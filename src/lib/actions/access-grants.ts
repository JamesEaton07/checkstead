"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Generating a "new" link always inserts a fresh row (fresh token) rather
// than reactivating an old one — once a link is revoked it should stay dead
// permanently, in case it was ever shared somewhere it shouldn't have been.
export async function createAccessGrant(propertyId: string, tenantId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("access_grants").insert({ tenant_id: tenantId });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}

export async function revokeAccessGrant(propertyId: string, grantId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("access_grants")
    .update({ active: false })
    .eq("id", grantId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { error: null };
}
