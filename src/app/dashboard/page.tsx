import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types/database";
import { AddPropertyForm } from "./add-property-form";
import { PropertyCard } from "./property-card";

export const metadata: Metadata = {
  title: "Properties",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("landlord_id", user!.id)
    .order("created_at", { ascending: true })
    .returns<Property[]>();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your properties</h1>
      </div>

      <AddPropertyForm />

      {properties && properties.length > 0 ? (
        <ul className="space-y-3">
          {properties.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">
          No properties yet. Add your first one above.
        </p>
      )}
    </div>
  );
}
