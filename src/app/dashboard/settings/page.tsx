import { createClient } from "@/lib/supabase/server";
import type { Landlord } from "@/lib/types/database";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: landlord } = await supabase
    .from("landlords")
    .select("*")
    .eq("id", user!.id)
    .single<Landlord>();

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      {landlord && <SettingsForm landlord={landlord} />}
    </div>
  );
}
