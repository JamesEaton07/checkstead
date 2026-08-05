-- Checkstead v1 — remaining data-model tables: checkins, reliability
-- records, maintenance requests, access grants, subscriptions.
-- Builds on 0001_init.sql (landlords, properties, tenants).
--
-- Per SPEC.md: CHECKIN and MAINTENANCE_REQUEST anchor to PROPERTY (not
-- TENANT), so condition/repair history persists across tenant turnover and
-- vacancy. tenant_id on those tables is provenance (who submitted it), not
-- ownership — hence "on delete set null" rather than cascade.

-- ---------------------------------------------------------------------------
-- checkins
-- ---------------------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  checkin_type text not null check (checkin_type in ('baseline', 'regular', 'move-out')),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'overdue')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkins_property_id_idx on public.checkins (property_id);
create index if not exists checkins_tenant_id_idx on public.checkins (tenant_id);

-- ---------------------------------------------------------------------------
-- reliability_records
-- ---------------------------------------------------------------------------
-- One rolled-up row per tenant, private to the landlord who owns that
-- tenant's property.
create table if not exists public.reliability_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants (id) on delete cascade,
  days_late_avg numeric,
  checkins_completed integer not null default 0 check (checkins_completed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reliability_records_tenant_id_idx on public.reliability_records (tenant_id);

-- ---------------------------------------------------------------------------
-- maintenance_requests
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maintenance_requests_property_id_idx on public.maintenance_requests (property_id);
create index if not exists maintenance_requests_tenant_id_idx on public.maintenance_requests (tenant_id);

-- ---------------------------------------------------------------------------
-- access_grants
-- ---------------------------------------------------------------------------
-- Scoped, revocable magic-link access per tenant (opt-in, off by default).
create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_grants_tenant_id_idx on public.access_grants (tenant_id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
-- One row per landlord. Flat pricing by property-count bracket, managed via
-- Stripe Billing (added in a later build step).
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null unique references public.landlords (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_landlord_id_idx on public.subscriptions (landlord_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
-- Reuses public.set_updated_at() defined in 0001_init.sql.
drop trigger if exists set_updated_at on public.checkins;
create trigger set_updated_at before update on public.checkins
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.reliability_records;
create trigger set_updated_at before update on public.reliability_records
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.maintenance_requests;
create trigger set_updated_at before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.access_grants;
create trigger set_updated_at before update on public.access_grants
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
-- Landlord-side access only for now (scoped via the owning property or
-- tenant's property). The tenant-facing, access-grant-scoped read policies
-- come with the access-grant delivery mechanism in a later build step.
alter table public.checkins enable row level security;
alter table public.reliability_records enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.access_grants enable row level security;
alter table public.subscriptions enable row level security;

-- checkins: scoped via the parent property's landlord
create policy "checkins_select_own" on public.checkins
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = checkins.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "checkins_insert_own" on public.checkins
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = checkins.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "checkins_update_own" on public.checkins
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = checkins.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "checkins_delete_own" on public.checkins
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = checkins.property_id and p.landlord_id = auth.uid()
    )
  );

-- reliability_records: scoped via the tenant's property's landlord
create policy "reliability_records_select_own" on public.reliability_records
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = reliability_records.tenant_id and p.landlord_id = auth.uid()
    )
  );

create policy "reliability_records_insert_own" on public.reliability_records
  for insert with check (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = reliability_records.tenant_id and p.landlord_id = auth.uid()
    )
  );

create policy "reliability_records_update_own" on public.reliability_records
  for update using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = reliability_records.tenant_id and p.landlord_id = auth.uid()
    )
  );

create policy "reliability_records_delete_own" on public.reliability_records
  for delete using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = reliability_records.tenant_id and p.landlord_id = auth.uid()
    )
  );

-- maintenance_requests: scoped via the parent property's landlord
create policy "maintenance_requests_select_own" on public.maintenance_requests
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "maintenance_requests_insert_own" on public.maintenance_requests
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "maintenance_requests_update_own" on public.maintenance_requests
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.landlord_id = auth.uid()
    )
  );

create policy "maintenance_requests_delete_own" on public.maintenance_requests
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.landlord_id = auth.uid()
    )
  );

-- access_grants: scoped via the tenant's property's landlord
create policy "access_grants_select_own" on public.access_grants
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = access_grants.tenant_id and p.landlord_id = auth.uid()
    )
  );

create policy "access_grants_insert_own" on public.access_grants
  for insert with check (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = access_grants.tenant_id and p.landlord_id = auth.uid()
    )
  );

create policy "access_grants_update_own" on public.access_grants
  for update using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = access_grants.tenant_id and p.landlord_id = auth.uid()
    )
  );

create policy "access_grants_delete_own" on public.access_grants
  for delete using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = access_grants.tenant_id and p.landlord_id = auth.uid()
    )
  );

-- subscriptions: a landlord can only ever see/edit their own row
create policy "subscriptions_select_own" on public.subscriptions
  for select using (landlord_id = auth.uid());

create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (landlord_id = auth.uid());

create policy "subscriptions_update_own" on public.subscriptions
  for update using (landlord_id = auth.uid());
