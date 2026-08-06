"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/safe-redirect";

export async function signOut(redirectTo: string = "/login") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}

// Per-email cap, independent of Supabase's project-wide email_sent bucket
// (supabase/config.toml [auth.rate_limit]). Keeps one address getting
// rate limited from blocking sign-in emails for everyone else.
const MAGIC_LINK_MAX_ATTEMPTS = 3;
const MAGIC_LINK_WINDOW_SECONDS = 60 * 60;

export async function requestMagicLink(
  email: string,
  origin: string,
  redirectTo: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: allowed, error: rpcError } = await supabase.rpc(
    "try_consume_email_send",
    {
      p_email: email,
      p_max_attempts: MAGIC_LINK_MAX_ATTEMPTS,
      p_window_seconds: MAGIC_LINK_WINDOW_SECONDS,
    }
  );

  if (rpcError) {
    return { error: "Something went wrong. Please try again." };
  }

  if (!allowed) {
    return {
      error:
        "Too many sign-in requests for this email. Please wait a bit and try again.",
    };
  }

  const safeTo = safeRedirect(redirectTo, "/dashboard");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?redirectTo=${encodeURIComponent(safeTo)}`,
    },
  });

  return { error: error?.message ?? null };
}
