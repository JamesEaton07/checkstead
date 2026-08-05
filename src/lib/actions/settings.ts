"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const notifyEmail = formData.get("notify_email") === "on";
  const notifySms = formData.get("notify_sms") === "on";
  const daysLateThreshold = Number(formData.get("days_late_threshold"));

  if (!notifyEmail && !notifySms) {
    return { error: "Select at least one notification channel." };
  }
  if (!Number.isInteger(daysLateThreshold) || daysLateThreshold < 0) {
    return { error: "Days-late threshold must be a whole number of 0 or more." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("landlords")
    .update({
      notify_email: notifyEmail,
      notify_sms: notifySms,
      days_late_threshold: daysLateThreshold,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}
