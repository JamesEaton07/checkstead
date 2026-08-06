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

  // Don't surface raw database error text to the client — it can include
  // internal details (constraint/column names) that shouldn't be
  // user-facing. Server actions still see the real `error` for their own
  // logic; only the message shown to the user is generic.
  if (error) return { error: "Couldn't add this property. Please try again." };

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

  if (error) return { error: "Couldn't save these changes. Please try again." };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) return { error: "Couldn't remove this property. Please try again." };

  revalidatePath("/dashboard");
  return { error: null };
}
