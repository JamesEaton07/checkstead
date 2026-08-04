# Checkstead — v1 build spec

## What this is
A tool for small/remote landlords to track property condition over time and keep a private reliability record per tenant — without being a full rent-collection/accounting suite. Built for landlords managing 1-20 units, especially ones who don't live near all their properties.

## Core value prop
- Landlords can't easily verify property condition or tenant reliability from a distance.
- Existing landlord software (Buildium, DoorLoop, RentRedi, etc.) focuses on rent collection and accounting, not ongoing condition tracking or lightweight trust records.
- This app is a *second* tool, not a replacement for whatever the landlord already uses for money.

## v1 feature list

1. **Auth + account setup**
   - Landlord signup/login
   - Add/edit/remove a property (address, unit info)
   - Add/remove a tenant, tied to a property
   - Settings: notification preference (email only, default), landlord-set "days late" threshold for rent

2. **Tenant access mechanism**
   - Landlord generates a scoped, revocable access grant (magic link) per tenant
   - Opt-in per tenant — not on by default
   - Tenant sees only their own record: their own move-in baseline + everything from their own active tenancy. Nothing before their lease started, nothing after it ends, nothing from other tenants.
   - Landlord's own dashboard sees full property history across all tenants/vacancies — this scoping only applies to the tenant-facing view

3. **Check-in flow**
   - Scheduled reminders (landlord sets frequency) prompting tenant to submit photos
   - Photo checklist (kitchen, bathroom, previously flagged spots) so nothing gets skipped
   - Every new tenancy gets its own fresh move-in baseline check-in — never inherited from the previous tenant
   - Client-side image compression + upload progress indicator (for weaker connections)
   - Move-out check-in as a special type, auto-compared against that tenant's move-in baseline (deposit-dispute evidence)

4. **Condition comparison view**
   - Side-by-side baseline vs. latest check-in, per property
   - Manual landlord review (no AI-based damage detection in v1)
   - Tenant can add a comment on a flagged item ("that was already there")

5. **Overdue check-in flags**
   - If a check-in isn't submitted by end of due date: flag on landlord dashboard (distinct from a condition-decline flag) + email alert to tenant + notification to landlord
   - No automated penalty — landlord decides what to do

6. **Reliability record (tenant-facing, private per landlord)**
   - Manual "rent paid" marking against the landlord's own late-day threshold (no automated inference/quiz)
   - Rolled-up view: days-late average, check-in completion rate
   - Private to that landlord only — no cross-landlord visibility in v1

7. **Maintenance request log**
   - Tenant or landlord can log an issue with description + photo
   - Tied to the property (persists across tenants), tenant_id recorded but optional/nullable

8. **Notifications**
   - Email (Resend) for v1, invite/reminder messages include a plain-language notice of what the app is for
   - SMS (Twilio) alongside email for tenant-facing reminders/invite links, since not all tenants use email reliably
   - Landlord's own alerts: email by default, SMS opt-in via settings

9. **Billing**
   - Flat account pricing by property-count bracket (not per-unit)
   - Free tier: 1-2 properties
   - Paid tier(s) for 3+ — exact pricing TBD, roughly in line with market norms ($12-28/mo range)
   - Stripe Billing for subscription management
   - On cancel: account moves to archived/read-only state for a retention window (90 days suggested), plus an immediate data export option (photos + CSV/PDF summary)

## Explicitly NOT in v1
- Rent collection/payment processing
- Full accounting/tax reporting
- Tenant screening/background checks
- Lease e-signature/generation
- Cross-landlord tenant reputation network (future feature, needs legal review first)
- AI-based photo damage detection
- Second landlord/delegate per account

## Data model

- **LANDLORD** — id, email, notify_pref
- **PROPERTY** — id, landlord_id (FK), address
- **TENANT** — id, property_id (FK), name, contact, lease_status
- **CHECKIN** — id, property_id (FK), tenant_id (FK, nullable), submitted_at, checkin_type (baseline/regular/move-out), status
- **RELIABILITY_RECORD** — id, tenant_id (FK), days_late_avg, checkins_completed
- **MAINTENANCE_REQUEST** — id, property_id (FK), tenant_id (FK, nullable), description, status
- **ACCESS_GRANT** — id, tenant_id (FK), token, active
- **SUBSCRIPTION** — id, landlord_id (FK), tier

Key relationship rule: CHECKIN and MAINTENANCE_REQUEST anchor to PROPERTY (not TENANT), so condition/repair history persists across tenant turnover and vacancy. tenant_id on those tables is just provenance (who submitted it), not ownership.

## Suggested build order
1. Auth + account setup (landlord CRUD for properties/tenants, settings)
2. Core access-grant mechanism (scoped tenant link, even before polished delivery)
3. Check-in flow (photo checklist, upload, baseline capture)
4. Condition comparison + overdue check-in flags
5. Reliability record (manual rent tracking against landlord threshold)
6. Notification delivery — email (styled invites/reminders, disclaimer copy)
7. Maintenance request log
8. Move-out comparison (reuses step 4 logic)
9. SMS (Twilio) + billing (Stripe) — last, since both carry real per-use cost

## Stack
- Framework: Next.js
- Database + Auth + Storage: Supabase (Postgres, magic-link auth, file storage for photos)
- SMS: Twilio
- Email: Resend (+ React Email for templates)
- Payments: Stripe Billing
- Hosting: Vercel

## Name
Checkstead
