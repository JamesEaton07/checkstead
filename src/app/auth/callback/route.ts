import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/safe-redirect";

// Landlord magic-link callback only — tenants never use Supabase Auth at
// all (see src/app/tenant/access). Every successful callback here routes
// through set-password, since magic link is only ever used for first-time
// signup or a forgotten-password reset, both of which end the same way.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = safeRedirect(searchParams.get("redirectTo"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        `${origin}/auth/set-password?redirectTo=${encodeURIComponent(redirectTo)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
