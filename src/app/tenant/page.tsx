import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

// Placeholder landing page for the tenant magic-link stub (src/app/tenant/login).
// Replace with the real scoped, per-tenancy view once the access-grant
// mechanism (SPEC.md build order step 2) is built.
export default async function TenantPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/tenant/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-semibold">You&apos;re signed in</h1>
        <p className="text-sm text-neutral-500">
          Signed in as <span className="font-medium">{user.email}</span>. The
          tenant portal (your move-in baseline, check-ins, and reliability
          record) isn&apos;t built yet — this page is a placeholder for the
          sign-in flow.
        </p>
        <form action={signOut.bind(null, "/tenant/login")}>
          <button
            type="submit"
            className="text-sm text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
