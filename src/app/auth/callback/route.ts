import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "landlord" is the default so old/bare callback links (no flow param)
  // still get routed through the password step rather than straight in.
  const flow = searchParams.get("flow") === "tenant" ? "tenant" : "landlord";
  const redirectTo = searchParams.get("redirectTo") ?? (flow === "tenant" ? "/tenant" : "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (flow === "landlord") {
        return NextResponse.redirect(
          `${origin}/auth/set-password?redirectTo=${encodeURIComponent(redirectTo)}`
        );
      }
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  const loginPath = flow === "tenant" ? "/tenant/login" : "/login";
  return NextResponse.redirect(`${origin}${loginPath}?error=auth`);
}
