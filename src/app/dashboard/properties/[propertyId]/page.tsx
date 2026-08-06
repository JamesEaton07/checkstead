import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { AccessGrant, Checkin, Property, Tenant } from "@/lib/types/database";
import { AddTenantForm } from "./add-tenant-form";
import { TenantRow } from "./tenant-row";

export type BaselineCheckinSummary = {
  checkinId: string;
  status: Checkin["status"];
  submittedAt: string | null;
  photoCount: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}): Promise<Metadata> {
  const { propertyId } = await params;
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("address")
    .eq("id", propertyId)
    .single();

  return { title: property?.address ?? "Property" };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single<Property>();

  if (!property) {
    notFound();
  }

  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true })
    .returns<Tenant[]>();

  const tenantIds = tenants?.map((tenant) => tenant.id) ?? [];
  const { data: grants } = await supabase
    .from("access_grants")
    .select("*")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : [""])
    .order("created_at", { ascending: false })
    .returns<AccessGrant[]>();

  // Most recent grant per tenant — grants is already newest-first, so the
  // first match per tenant_id wins.
  const latestGrantByTenant = new Map<string, AccessGrant>();
  for (const grant of grants ?? []) {
    if (!latestGrantByTenant.has(grant.tenant_id)) {
      latestGrantByTenant.set(grant.tenant_id, grant);
    }
  }

  // One baseline checkin per tenant, enforced by the on_tenant_created
  // trigger (0010). Fetched here (not lazily per-row) since it's cheap —
  // just row metadata, no photo bytes or signed URLs yet. Those are only
  // generated on demand when a landlord actually opens the gallery, via
  // getBaselinePhotoUrls in checkin-photos-gallery.tsx.
  const { data: baselineCheckins } = await supabase
    .from("checkins")
    .select("id, tenant_id, status, submitted_at")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : [""])
    .eq("checkin_type", "baseline")
    .returns<Pick<Checkin, "id" | "tenant_id" | "status" | "submitted_at">[]>();

  const checkinIds = baselineCheckins?.map((c) => c.id) ?? [];
  const { data: photoRows } = await supabase
    .from("checkin_photos")
    .select("checkin_id")
    .in("checkin_id", checkinIds.length > 0 ? checkinIds : [""]);

  const photoCountByCheckin = new Map<string, number>();
  for (const row of photoRows ?? []) {
    photoCountByCheckin.set(row.checkin_id, (photoCountByCheckin.get(row.checkin_id) ?? 0) + 1);
  }

  const baselineByTenant = new Map<string, BaselineCheckinSummary>();
  // tenant_id is nullable at the column level (regular/move-out checkins
  // can be tenant-less), but the on_tenant_created trigger always sets it
  // for baseline checkins — filter defensively rather than assert.
  for (const checkin of baselineCheckins ?? []) {
    if (!checkin.tenant_id) continue;
    baselineByTenant.set(checkin.tenant_id, {
      checkinId: checkin.id,
      status: checkin.status as Checkin["status"],
      submittedAt: checkin.submitted_at,
      photoCount: photoCountByCheckin.get(checkin.id) ?? 0,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="rounded-sm text-sm text-neutral-500 dark:text-neutral-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
        >
          ← Properties
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{property.address}</h1>
        {property.unit_info && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{property.unit_info}</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tenants</h2>
        <AddTenantForm propertyId={property.id} />

        {tenants && tenants.length > 0 ? (
          <ul className="space-y-3">
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                <TenantRow
                  propertyId={property.id}
                  tenant={tenant}
                  grant={latestGrantByTenant.get(tenant.id) ?? null}
                  baselineCheckin={baselineByTenant.get(tenant.id) ?? null}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No tenants added yet.</p>
        )}
      </div>
    </div>
  );
}
