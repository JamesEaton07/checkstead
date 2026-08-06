-- Separates "is tenant access turned on for this tenant" (a persistent,
-- reversible landlord preference) from "is this specific link still valid"
-- (access_grants.active, a one-way expiry). Previously these were the same
-- flag, which meant expiring a link and turning off tenant access were
-- indistinguishable — expiring a stale link permanently required generating
-- a brand new one even when the landlord just wanted to pause and resume
-- the same link later.
alter table public.tenants add column tenant_access_enabled boolean not null default false;

-- ---------------------------------------------------------------------------
-- get_tenant_access: "active" in the response is now the combination of
-- both — the grant itself must not be expired, AND the tenant-level toggle
-- must be on. Toggling off blocks access immediately without expiring the
-- grant; toggling back on resumes the same link. Expiring the grant
-- (access_grants.active = false) is the separate, one-way action.
-- ---------------------------------------------------------------------------
drop function if exists public.get_tenant_access(text);

create function public.get_tenant_access(p_token text)
returns table (
  tenant_id uuid,
  tenant_name text,
  lease_status text,
  property_id uuid,
  property_address text,
  property_unit_info text,
  active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      t.id as tenant_id,
      t.name as tenant_name,
      t.lease_status,
      p.id as property_id,
      p.address as property_address,
      p.unit_info as property_unit_info,
      (ag.active and t.tenant_access_enabled) as active
    from public.access_grants ag
    join public.tenants t on t.id = ag.tenant_id
    join public.properties p on p.id = t.property_id
    where ag.token = p_token;
end;
$$;

grant execute on function public.get_tenant_access(text) to anon, authenticated;
