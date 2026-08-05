"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTenant(propertyId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tenants").insert({
    property_id: propertyId,
    name,
    contact: contact || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

export async function removeTenant(propertyId: string, tenantId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tenants").delete().eq("id", tenantId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}
