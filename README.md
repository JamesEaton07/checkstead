# Checkstead

Property condition tracking and private tenant reliability records for small
landlords. See `checkstead-v1-spec.md` for the full product spec and build
order.

## Status

Build-order step 1 is scaffolded: landlord signup/login (Supabase magic
link), property add/edit/remove, tenant add/remove, and a settings page
(notification preference + days-late threshold).

## Setup

1. Create a Supabase project (or run one locally with the Supabase CLI).
2. Copy `.env.example` to `.env.local` and fill in the values from
   Project Settings -> API:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
3. Run the migrations in `supabase/migrations/` against your project
   (Supabase dashboard SQL editor, or `npx supabase db push` if you're using
   the CLI — this project is set up as a local dev dependency, already
   `supabase init`'d and linked via `npx supabase link --project-ref
   <ref>`). They create the full data model — `landlords`, `properties`,
   `tenants`, `checkins`, `reliability_records`, `maintenance_requests`,
   `access_grants`, `subscriptions` — row-level security policies scoping
   everything to the owning landlord, and a trigger that provisions a
   `landlords` row automatically when someone signs up.
   After migrating, regenerate types with:
   ```
   npx supabase gen types typescript --linked > src/lib/types/database.ts
   ```
   then re-append the "Convenience aliases" section at the bottom of that
   file (narrows CHECK-constraint text columns to literal unions).
4. In the Supabase dashboard, under Authentication -> URL Configuration, add
   `http://localhost:3000/auth/callback` (and your production equivalent) as
   a redirect URL.
5. Install dependencies and run the dev server:
   ```
   npm install
   npm run dev
   ```

There are two separate sign-in flows:

- **Landlord** (`/login`) — password sign-in by default. First time (or
  forgot password), they use "Email me a sign-in link" instead: a magic link
  confirms their email, then `/auth/set-password` has them set a password to
  use from then on. Requesting a magic link again later re-does the
  set-password step, which doubles as password reset.
- **Tenant** (`/tenant/login`) — magic link only, no password, ever. This is
  currently a placeholder: it's a generic Supabase magic-link sign-in, not
  yet scoped to a specific tenant's access grant (see SPEC.md build order
  step 2, not built yet) — anyone can request a link for any email and land
  on the `/tenant` stub page. Replace this once the scoped, revocable
  per-tenant access-grant mechanism is built.

Both flows share `/auth/callback`, which reads a `flow` query param
(`landlord` | `tenant`) to decide whether to route through the password step.

## Project layout

- `src/app/login` — landlord sign-in (password, with magic-link fallback)
- `src/app/auth/callback` — exchanges the magic-link code for a session,
  then routes by `flow`
- `src/app/auth/set-password` — landlord sets/resets their password after a
  magic-link sign-in
- `src/app/tenant/login` — tenant magic-link sign-in (placeholder, see above)
- `src/app/tenant` — placeholder post-login landing page for tenants
- `src/app/dashboard` — landlord-only routes (protected by `src/proxy.ts`)
  - `/dashboard` — property list, add/edit/remove
  - `/dashboard/properties/[propertyId]` — tenant add/remove for a property
  - `/dashboard/settings` — notification preference, days-late threshold
- `src/lib/supabase` — browser/server/middleware Supabase client helpers
- `src/lib/actions` — server actions for properties, tenants, settings, auth
- `src/lib/types/database.ts` — generated Supabase types + convenience aliases
- `supabase/migrations` — SQL schema; `0001_init.sql` covers step 1
  (landlords/properties/tenants), `0002_*.sql` adds the rest of the data
  model (checkins, reliability_records, maintenance_requests, access_grants,
  subscriptions) ahead of the build steps that use them, `0003_*.sql`
  backfills landlord rows created before the signup trigger existed,
  `0004_*.sql` splits notification preference into independent
  email/SMS booleans, `0005_*.sql` adds a per-email rate limit
  (`try_consume_email_send`) that `requestMagicLink` (`src/lib/actions/auth.ts`)
  checks before calling `signInWithOtp`, so one address hammering sign-in
  requests can't exhaust Supabase's project-wide email quota for everyone else
