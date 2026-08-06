# Checkstead

Property condition tracking and private tenant reliability records for small
landlords. See `checkstead-v1-spec.md` for the full product spec and build
order.

Live at [checksteadapp.com](https://checksteadapp.com), deployed via Vercel.

## Status

Build-order steps 1 and 2 are done:

- **Step 1** — landlord signup/login, property add/edit/remove, tenant
  add/remove, and a settings page (notification channels + days-late
  threshold).
- **Step 2** — the core access-grant mechanism: a landlord can generate a
  scoped link per tenant (opt-in, no account or password on the tenant's
  side), toggle their access on/off at any time, and expire a specific
  link permanently if needed.

## Setup

1. Create a Supabase project (or run one locally with the Supabase CLI).
2. Copy `.env.example` to `.env.local` and fill in the values from
   Project Settings -> API, plus a Resend API key (Resend dashboard -> API
   Keys — "Sending access" scope is enough):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   RESEND_API_KEY=
   ```
   `RESEND_API_KEY` must also be added to Vercel's project environment
   variables for production — it's server-only (no `NEXT_PUBLIC_` prefix)
   and I can't set that one myself.
3. Run the migrations in `supabase/migrations/` against your project
   (Supabase dashboard SQL editor, or `npx supabase db push` if you're using
   the CLI — this project is set up as a local dev dependency, already
   `supabase init`'d and linked via `npx supabase link --project-ref
   <ref>`). See the migrations list below for what each one adds.
   After migrating, regenerate types with:
   ```
   npx supabase gen types typescript --linked > src/lib/types/database.ts
   ```
   then re-append the "Convenience aliases" section at the bottom of that
   file (narrows CHECK-constraint text columns to literal unions, plus the
   `TenantAccess` RPC result type).
4. `supabase/config.toml`'s `[auth]` section controls Supabase's redirect
   allow-list (`site_url` / `additional_redirect_urls`) and SMTP settings
   (`[auth.email.smtp]`, wired to Resend) — push it with:
   ```
   RESEND_API_KEY=<your key> npx supabase config push
   ```
   `config push` pushes the *entire* file, not just what you changed — diff
   the output before trusting it if you're editing this on a project that's
   been configured outside this repo (e.g. via the Supabase dashboard or a
   Vercel integration), since it will silently overwrite anything that
   differs.
5. Install dependencies and run the dev server:
   ```
   npm install
   npm run dev
   ```

### Two separate identities, two different mechanisms

- **Landlord** (`/login`) — a real Supabase Auth account. Password sign-in
  by default. First time (or forgot password), "Email me a sign-in link"
  sends a magic link that confirms their email, then `/auth/set-password`
  has them set a password to use from then on. Requesting a magic link
  again later re-does the set-password step, which doubles as password
  reset.
- **Tenant** (`/tenant/access/[token]`) — no account, no password, no
  Supabase Auth session at all. A landlord generates a link from a
  tenant's row on the property page (`/dashboard/properties/[propertyId]`)
  and either copies it or has the app email it to the tenant's contact
  address directly. The token in that URL *is* the credential.
  `get_tenant_access()` (security definer) validates it against
  `access_grants` and returns only the single tenant + property it's scoped
  to — nothing else is reachable through it.

  There are two separate, independent controls over whether that link
  actually works, both on the tenant's row:
  - **Tenant access toggle** (`tenants.tenant_access_enabled`) — a
    persistent, reversible on/off switch. Turning it off blocks the tenant
    immediately without touching their link; turning it back on resumes
    the *same* link, no new one needed.
  - **Expire link** (`access_grants.active`) — a one-way action on one
    specific token. Once expired it's dead permanently (in case it was
    ever shared somewhere it shouldn't have been); "generate new link"
    always inserts a fresh grant with a new token rather than reactivating
    the old one, and also turns the toggle back on.

  `get_tenant_access()` only grants access when *both* are true. Either
  way — toggled off or expired — the tenant sees a clear "access turned
  off" message with a "Request access" button, which notifies the landlord
  (email today; SMS once Twilio is wired up in a later build step,
  depending on their settings) — rate-limited per tenant via the same
  `try_consume_email_send` counter the login flow uses, under a separate
  namespaced key so the two can't interfere with each other.

## Project layout

- `src/app/login` — landlord sign-in (password, with magic-link fallback)
- `src/app/auth/callback` — exchanges the magic-link code for a session,
  then always routes through `/auth/set-password`
- `src/app/auth/set-password` — landlord sets/resets their password after a
  magic-link sign-in
- `src/app/tenant/access/[token]` — public, token-authorized tenant view
  (no session). Access on: shows tenant + property info (check-ins and
  the reliability record land here in later build steps). Access off
  (toggled off or link expired): "access turned off" message + a
  request-access button.
- `src/app/dashboard` — landlord-only routes (protected by `src/proxy.ts`)
  - `/dashboard` — property list, add/edit/remove
  - `/dashboard/properties/[propertyId]` — tenant add/remove, and the
    access-grant control per tenant: on/off toggle, generate/send/copy
    link, expire link
  - `/dashboard/settings` — notification preference, days-late threshold
- `src/components/button.tsx` — shared `Button` (primary/secondary/
  destructive variants) used by every data-mutating button in the
  dashboard; pure navigation stays plain text
- `src/lib/supabase` — browser/server/middleware Supabase client helpers
- `src/lib/actions` — server actions for properties, tenants, settings,
  auth, access grants, and tenant access requests
- `src/lib/email/resend.ts` — direct Resend API calls for app-triggered
  emails (access-link invites, access-request notifications) — separate
  from Supabase Auth's own SMTP config, which only handles login emails
- `src/lib/types/database.ts` — generated Supabase types + convenience aliases
- `supabase/migrations` — SQL schema, in order:
  - `0001_init.sql` — step 1: `landlords`, `properties`, `tenants`
  - `0002_*.sql` — rest of the data model ahead of the steps that use it:
    `checkins`, `reliability_records`, `maintenance_requests`,
    `access_grants`, `subscriptions`
  - `0003_*.sql` — backfills landlord rows created before the signup
    trigger existed
  - `0004_*.sql` — splits notification preference into independent
    email/SMS booleans
  - `0005_*.sql` — per-email rate limit (`try_consume_email_send`) that
    `requestMagicLink` (`src/lib/actions/auth.ts`) checks before calling
    `signInWithOtp`, so one address hammering sign-in requests can't
    exhaust Supabase's project-wide email quota for everyone else
  - `0006_*.sql` — step 2: `get_tenant_access()`, the security-definer RPC
    behind the tenant access-grant mechanism
  - `0007_*.sql` — `get_tenant_access()` now returns expired grants too
    (with `active: false`) instead of nothing, so the UI can tell "expired"
    apart from "never existed"; adds `request_tenant_access()` for the
    tenant-side "notify my landlord" button
  - `0008_*.sql` — adds `tenants.tenant_access_enabled`, the persistent
    on/off toggle, decoupled from `access_grants.active` (one-way link
    expiry) — see the tenant-access explanation above
  - `0009_*.sql` — revokes the default PUBLIC execute grant on
    `handle_new_user()` and `set_updated_at()` (internal trigger-only
    helpers) so they're not exposed as callable RPC endpoints; triggers
    keep firing normally, since trigger invocation isn't subject to the
    caller's EXECUTE grant
