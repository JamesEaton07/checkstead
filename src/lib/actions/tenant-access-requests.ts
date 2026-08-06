"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape-html";
import type { TenantAccessRequest } from "@/lib/types/database";

// Called from the public /tenant/access/[token] page when a tenant's access
// is off (their link expired, or the landlord's access toggle is off) and
// they ask their landlord to restore it. The token is the only thing
// identifying the caller — request_tenant_access() looks up and rate-limits
// server-side (see supabase/migrations/0007), and the landlord's email
// never leaves this function.
export async function requestTenantAccess(token: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data, error: rpcError } = await supabase
    .rpc("request_tenant_access", { p_token: token })
    .maybeSingle<TenantAccessRequest>();

  if (rpcError) return { error: "Something went wrong. Please try again." };
  if (!data) return { error: "This link isn't valid." };
  if (!data.allowed) {
    return { error: "A request was already sent recently. Please wait before trying again." };
  }

  // SMS delivery (Twilio) arrives in a later build step — for now this only
  // does anything if the landlord has email notifications on.
  if (data.landlord_notify_email) {
    // tenant_name and property_address are landlord-entered free text —
    // escape before interpolating into raw HTML so they can't inject
    // markup/scripts into an email sent to the landlord.
    const safeName = escapeHtml(data.tenant_name);
    const safeAddress = escapeHtml(data.property_address);
    const { error } = await sendEmail({
      to: data.landlord_email,
      subject: `${data.tenant_name} is requesting access — ${data.property_address}`,
      html: `
        <p>${safeName} tried to open their Checkstead access link
        for ${safeAddress} and found it turned off.</p>
        <p>If you'd like to let them back in: if tenant access is toggled
        off for them, turn it back on and their existing link will start
        working again — no need to send a new one. If their link was
        expired instead, generate a new one from their tenant row on the
        property page and send it to them.</p>
      `,
    });
    if (error) return { error: "Couldn't send the request. Please try again." };
  }

  return { error: null };
}
