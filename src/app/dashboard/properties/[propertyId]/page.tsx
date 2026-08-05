import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Property, Tenant } from "@/lib/types/database";
import { AddTenantForm } from "./add-tenant-form";
import { TenantRow } from "./tenant-row";

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
                <TenantRow propertyId={property.id} tenant={tenant} />
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
