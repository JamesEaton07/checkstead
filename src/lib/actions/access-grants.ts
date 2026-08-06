"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape-html";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generating a "new" link always inserts a fresh row (fresh token) rather
// than reactivating an old one — once a link is expired it should stay dead
// permanently, in case it was ever shared somewhere it shouldn't have been.
// Also turns tenant access on, since generating a link (first time, or a
// fresh one after expiry) clearly means the landlord wants access enabled.
export async function createAccessGrant(propertyId: string, tenantId: string) {
  const supabase = await createClient();

  const [{ error: grantError }, { error: tenantError }] = await Promise.all([
    supabase.from("access_grants").insert({ tenant_id: tenantId }),
    supabase.from("tenants").update({ tenant_access_enabled: true }).eq("id", tenantId),
  ]);

  if (grantError || tenantError) {
    return { error: "Couldn't create an access link. Please try again." };
  }

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

// Expires one specific link permanently (one-way). Independent of the
// tenant-level access toggle — expiring a link never changes whether
// tenant access is turned on, it only kills that one token.
export async function expireAccessGrant(propertyId: string, grantId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("access_grants")
    .update({ active: false })
    .eq("id", grantId);

  if (error) return { error: "Couldn't expire this link. Please try again." };

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

// The persistent on/off switch for a tenant's access. Reversible — turning
// it back on resumes whatever link was already sent, no need to regenerate.
export async function toggleTenantAccess(propertyId: string, tenantId: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ tenant_access_enabled: enabled })
    .eq("id", tenantId);

  if (error) return { error: "Couldn't update tenant access. Please try again." };

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

export async function sendAccessLinkEmail(
  propertyId: string,
  tenantId: string,
  grantId: string,
  origin: string
) {
  const supabase = await createClient();

  // Every fetch here goes through RLS under the calling landlord's session,
  // so this can't be used to email a link for a tenant/grant that isn't
  // actually theirs.
  const [{ data: tenant }, { data: grant }, { data: property }] = await Promise.all([
    supabase.from("tenants").select("name, contact").eq("id", tenantId).single(),
    supabase.from("access_grants").select("token, active").eq("id", grantId).single(),
    supabase.from("properties").select("address, unit_info").eq("id", propertyId).single(),
  ]);

  if (!tenant || !grant || !property) {
    return { error: "Couldn't find that tenant, link, or property." };
  }
  if (!grant.active) {
    return { error: "This link has expired. Generate a new one first." };
  }
  if (!tenant.contact || !EMAIL_PATTERN.test(tenant.contact)) {
    return { error: "This tenant doesn't have a valid email on file to send to." };
  }

  const url = `${origin}/tenant/access/${grant.token}`;
  const propertyLine = property.unit_info
    ? `${property.address}, ${property.unit_info}`
    : property.address;
  // tenant.name and propertyLine are landlord-entered free text — escape
  // before interpolating into raw HTML so they can't inject markup/scripts
  // into an email sent to the tenant.
  const safeName = escapeHtml(tenant.name);
  const safePropertyLine = escapeHtml(propertyLine);

  const { error } = await sendEmail({
    to: tenant.contact,
    subject: `Access to your Checkstead record for ${propertyLine}`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Your landlord has given you access to Checkstead, a property
      condition and rent-reliability tracker, for your tenancy at
      ${safePropertyLine}. Use the link below to view your record — it only
      shows information from your own tenancy, nothing before it started
      and nothing from other tenants.</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link is personal to you — please don't share it.</p>
    `,
  });

  if (error) return { error: "Couldn't send the email. Please try again." };

  return { error: null };
}
