-- Tenant-facing lookup for the access-grant mechanism (SPEC.md build order
-- step 2). Tenants never get a Supabase Auth account — the grant's token,
-- embedded in a landlord-shared URL, *is* the credential. This function is
-- the only way an anonymous caller can read anything scoped to a tenant: it
-- validates the token itself (must match an active grant) and only ever
-- returns the single tenant + property row that grant is for, nothing else.
--
-- security definer is required here (same pattern as handle_new_user in
-- 0001_init.sql) because the caller has no auth.uid() for RLS to key off of
-- — this function *is* the authorization check, not RLS.
create or replace function public.get_tenant_access(p_token text)
returns table (
  tenant_id uuid,
  tenant_name text,
  lease_status text,
  property_id uuid,
  property_address text,
  property_unit_info text
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
      p.unit_info as property_unit_info
    from public.access_grants ag
    join public.tenants t on t.id = ag.tenant_id
    join public.properties p on p.id = t.property_id
    where ag.token = p_token and ag.active = true;
end;
$$;

grant execute on function public.get_tenant_access(text) to anon, authenticated;
