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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Constructing the client with an undefined key throws synchronously,
  // which upload-URL requests were surfacing to tenants as an opaque
  // "Server Components render" digest with no indication a env var was
  // the cause. Fail with a message that actually says so, server-side.
  if (!url || !key) {
    throw new Error(
      "Service role client is missing configuration: " +
        [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"]
          .filter(Boolean)
          .join(", ")
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
