"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProperty(formData: FormData) {
  const address = String(formData.get("address") ?? "").trim();
  const unitInfo = String(formData.get("unit_info") ?? "").trim();

  if (!address) {
    return { error: "Address is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("properties").insert({
    landlord_id: user.id,
    address,
    unit_info: unitInfo || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const address = String(formData.get("address") ?? "").trim();
  const unitInfo = String(formData.get("unit_info") ?? "").trim();

  if (!address) {
    return { error: "Address is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ address, unit_info: unitInfo || null })
    .eq("id", propertyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}
