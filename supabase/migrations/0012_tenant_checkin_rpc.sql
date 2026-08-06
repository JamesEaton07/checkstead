-- Tenant-facing baseline check-in access. Same trust model as
-- get_tenant_access (0006/0007): tenants have no Supabase Auth session at
-- all, so the access-grant token is the only credential, and every
-- function here re-validates it independently rather than trusting a
-- caller-supplied checkin_id.

-- Internal helper only — never exposed to anon/authenticated directly.
-- The four functions below call it to resolve token -> tenant's own
-- baseline checkin, so the validation logic lives in exactly one place.
create or replace function public.resolve_tenant_baseline_checkin(p_token text)
returns table (
  tenant_id uuid,
  checkin_id uuid,
  status text,
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
      c.id as checkin_id,
      c.status,
      (ag.active and t.tenant_access_enabled) as active
    from public.access_grants ag
    join public.tenants t on t.id = ag.tenant_id
    join public.checkins c on c.tenant_id = t.id and c.checkin_type = 'baseline'
    where ag.token = p_token;
end;
$$;

revoke execute on function public.resolve_tenant_baseline_checkin(text) from anon, authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.get_tenant_baseline_checkin(p_token text)
returns table (checkin_id uuid, status text, active boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select r.checkin_id, r.status, r.active
    from public.resolve_tenant_baseline_checkin(p_token) r;
end;
$$;

grant execute on function public.get_tenant_baseline_checkin(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.list_checkin_photos(p_token text)
returns table (category text, storage_path text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin_id uuid;
begin
  select r.checkin_id into v_checkin_id
  from public.resolve_tenant_baseline_checkin(p_token) r;

  if v_checkin_id is null then
    return;
  end if;

  return query
    select cp.category, cp.storage_path, cp.created_at
    from public.checkin_photos cp
    where cp.checkin_id = v_checkin_id
    order by cp.created_at asc;
end;
$$;

grant execute on function public.list_checkin_photos(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Only inserts while the checkin is still pending and access is active —
-- once submitted, the baseline is the official record and shouldn't be
-- appended to (it's later used as deposit-dispute evidence).
create or replace function public.record_checkin_photo(
  p_token text,
  p_category text,
  p_storage_path text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin_id uuid;
  v_status text;
  v_active boolean;
begin
  select r.checkin_id, r.status, r.active
  into v_checkin_id, v_status, v_active
  from public.resolve_tenant_baseline_checkin(p_token) r;

  if v_checkin_id is null or not v_active or v_status <> 'pending' then
    return false;
  end if;

  insert into public.checkin_photos (checkin_id, category, storage_path)
  values (v_checkin_id, p_category, p_storage_path);

  return true;
end;
$$;

grant execute on function public.record_checkin_photo(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.submit_baseline_checkin(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin_id uuid;
  v_status text;
  v_active boolean;
begin
  select r.checkin_id, r.status, r.active
  into v_checkin_id, v_status, v_active
  from public.resolve_tenant_baseline_checkin(p_token) r;

  if v_checkin_id is null or not v_active or v_status <> 'pending' then
    return false;
  end if;

  update public.checkins
  set status = 'submitted', submitted_at = now()
  where id = v_checkin_id;

  return true;
end;
$$;

grant execute on function public.submit_baseline_checkin(text) to anon, authenticated;
