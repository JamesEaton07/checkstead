-- Per-email rate limiting for magic-link sign-in emails.
--
-- Supabase Auth's built-in email_sent rate limit (see [auth.rate_limit] in
-- supabase/config.toml) is a single bucket shared across every recipient in
-- the project, so one address hammering signInWithOtp exhausts the quota for
-- everyone else too. This adds an application-level limiter keyed by email
-- address that server actions consult (via try_consume_email_send) before
-- ever calling signInWithOtp, so a single address getting rate limited no
-- longer affects other addresses.

create table if not exists public.email_send_rate_limits (
  email text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 0
);

alter table public.email_send_rate_limits enable row level security;
-- No policies: this table is only ever touched by the security-definer
-- function below, never read/written directly by anon/authenticated roles.

create or replace function public.try_consume_email_send(
  p_email text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_window_start timestamptz;
  v_attempt_count integer;
begin
  insert into public.email_send_rate_limits (email, window_start, attempt_count)
  values (v_email, now(), 0)
  on conflict (email) do nothing;

  select window_start, attempt_count
  into v_window_start, v_attempt_count
  from public.email_send_rate_limits
  where email = v_email
  for update;

  -- Window has expired: start a fresh one for this address.
  if v_window_start < now() - make_interval(secs => p_window_seconds) then
    v_window_start := now();
    v_attempt_count := 0;
  end if;

  if v_attempt_count >= p_max_attempts then
    update public.email_send_rate_limits
    set window_start = v_window_start
    where email = v_email;
    return false;
  end if;

  update public.email_send_rate_limits
  set window_start = v_window_start, attempt_count = v_attempt_count + 1
  where email = v_email;

  return true;
end;
$$;

grant execute on function public.try_consume_email_send(text, integer, integer)
  to anon, authenticated;
