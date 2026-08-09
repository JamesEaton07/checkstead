-- 0012's tenant-facing RPCs were hardcoded to checkin_type = 'baseline'.
-- Now that regular check-ins exist too (see process_due_checkins, 0017),
-- a tenant's link needs to resolve to whichever checkin is theirs right
-- now — the one with the latest created_at, since at most one checkin
-- is ever pending per tenant at a time (baseline is auto-created once;
-- process_due_checkins refuses to create a new regular checkin while a
-- pending one already exists). If it's pending, the tenant fills it
-- out; if already submitted, they see the same "on file" confirmation
-- the baseline flow already had, just generalized.
--
-- Internal only — never exposed to anon/authenticated directly.
create or replace function public.resolve_tenant_current_checkin(p_token text)
returns table (
  tenant_id uuid,
  checkin_id uuid,
  checkin_type text,
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
      c.checkin_type,
      c.status,
      (ag.active and t.tenant_access_enabled) as active
    from public.access_grants ag
    join public.tenants t on t.id = ag.tenant_id
    join public.checkins c on c.tenant_id = t.id
    where ag.token = p_token
    order by c.created_at desc
    limit 1;
end;
$$;

revoke execute on function public.resolve_tenant_current_checkin(text) from anon, authenticated, public;

-- ---------------------------------------------------------------------------
create or replace function public.get_tenant_current_checkin(p_token text)
returns table (checkin_id uuid, checkin_type text, status text, active boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select r.checkin_id, r.checkin_type, r.status, r.active
    from public.resolve_tenant_current_checkin(p_token) r;
end;
$$;

grant execute on function public.get_tenant_current_checkin(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.list_checkin_photos(p_token text)
returns table (category text, storage_path text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin_id uuid;
  v_active boolean;
begin
  select r.checkin_id, r.active into v_checkin_id, v_active
  from public.resolve_tenant_current_checkin(p_token) r;

  if v_checkin_id is null or not v_active then
    return;
  end if;

  return query
    select cp.category, cp.storage_path, cp.created_at
    from public.checkin_photos cp
    where cp.checkin_id = v_checkin_id
    order by cp.created_at asc;
end;
$$;

-- ---------------------------------------------------------------------------
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
  from public.resolve_tenant_current_checkin(p_token) r;

  if v_checkin_id is null or not v_active or v_status <> 'pending' then
    return false;
  end if;

  insert into public.checkin_photos (checkin_id, category, storage_path)
  values (v_checkin_id, p_category, p_storage_path);

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.submit_checkin(p_token text)
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
  from public.resolve_tenant_current_checkin(p_token) r;

  if v_checkin_id is null or not v_active or v_status <> 'pending' then
    return false;
  end if;

  update public.checkins
  set status = 'submitted', submitted_at = now()
  where id = v_checkin_id;

  return true;
end;
$$;

grant execute on function public.submit_checkin(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Superseded by the generalized functions above.
drop function if exists public.get_tenant_baseline_checkin(text);
drop function if exists public.submit_baseline_checkin(text);
drop function if exists public.resolve_tenant_baseline_checkin(text);
