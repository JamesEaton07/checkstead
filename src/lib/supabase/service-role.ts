import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Server-only — this key bypasses RLS entirely. Never import this file
// from a "use client" component (SUPABASE_SERVICE_ROLE_KEY has no
// NEXT_PUBLIC_ prefix so Next.js won't bundle its value into client code
// either way, but the import itself should still stay server-side only).
// Use only for the narrow set of operations RLS structurally can't cover
// — e.g. minting a signed Storage upload URL for a tenant who has no
// Supabase Auth session at all. Every call site must independently
// validate the caller's access-grant token before using this client.
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
