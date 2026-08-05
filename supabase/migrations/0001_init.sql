-- Checkstead v1 — initial schema: landlords, properties, tenants
-- Covers build-order step 1 (auth + account setup). Later steps add
-- checkins, reliability_records, maintenance_requests, access_grants,
-- subscriptions in their own migrations.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- landlords
-- ---------------------------------------------------------------------------
-- One row per Supabase auth user who signs up as a landlord. The row is
-- created automatically by the handle_new_user trigger below, keyed to
-- auth.users.id, so app code never inserts into this table directly.
create table if not exists public.landlords (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  notify_pref text not null default 'email' check (notify_pref in ('email', 'sms')),
  days_late_threshold integer not null default 5 check (days_late_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.landlords (id) on delete cascade,
  address text not null,
  unit_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_landlord_id_idx on public.properties (landlord_id);

-- ---------------------------------------------------------------------------
-- tenants
-- ---------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  contact text,
  lease_status text not null default 'active' check (lease_status in ('active', 'past')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_property_id_idx on public.tenants (property_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.landlords;
create trigger set_updated_at before update on public.landlords
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.properties;
create trigger set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.tenants;
create trigger set_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-provision a landlord row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.landlords (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
alter table public.landlords enable row level security;
alter table public.properties enable row level security;
alter table public.tenants enable row level security;

-- landlords: a user can only ever see/edit their own row
create policy "landlords_select_own" on public.landlords
  for select using (id = auth.uid());

create policy "landlords_update_own" on public.landlords
  for update using (id = auth.uid());

-- properties: scoped to the owning landlord
create policy "properties_select_own" on public.properties
  for select using (landlord_id = auth.uid());

create policy "properties_insert_own" on public.properties
  for insert with check (landlord_id = auth.uid());

create policy "properties_update_own" on public.properties
  for update using (landlord_id = auth.uid());

create policy "properties_delete_own" on public.properties
  for delete using (landlord_id = auth.uid());

-- tenants: scoped via their parent property's landlord
create policy "tenants_select_own" on public.tenants
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = tenants.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "tenants_insert_own" on public.tenants
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = tenants.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "tenants_update_own" on public.tenants
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = tenants.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "tenants_delete_own" on public.tenants
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = tenants.property_id and p.landlord_id = auth.uid()
    )
  );
