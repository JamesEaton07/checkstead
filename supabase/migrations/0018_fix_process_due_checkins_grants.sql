-- process_due_checkins() (0017) came out with explicit EXECUTE grants
-- to anon and authenticated despite the migration already revoking from
-- PUBLIC — this project's default privileges for the postgres role now
-- grant EXECUTE to anon/authenticated/service_role on every new function
-- at creation time (confirmed via pg_default_acl), separately from
-- PUBLIC's own grant. Revoking from PUBLIC alone is no longer sufficient
-- for internal-only functions going forward — anon/authenticated need
-- an explicit revoke too. service_role is untouched; the cron route
-- calls this function using the service role client.
revoke execute on function public.process_due_checkins() from anon, authenticated;
