import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { AccessGrant, Property, Tenant } from "@/lib/types/database";
import { AddTenantForm } from "./add-tenant-form";
import { TenantRow } from "./tenant-row";

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

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          ← Properties
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{property.address}</h1>
        {property.unit_info && (
          <p className="text-sm text-neutral-500">{property.unit_info}</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-700">Tenants</h2>
        <AddTenantForm propertyId={property.id} />

        {tenants && tenants.length > 0 ? (
          <ul className="space-y-3">
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                <TenantRow
                  propertyId={property.id}
                  tenant={tenant}
                  grant={latestGrantByTenant.get(tenant.id) ?? null}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No tenants added yet.</p>
        )}
      </div>
    </div>
  );
}
