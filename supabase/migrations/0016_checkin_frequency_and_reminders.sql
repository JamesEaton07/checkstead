-- Step 4 prerequisite: a global, opt-in recurring check-in schedule.
-- null = feature off (no automatic regular check-ins get created for
-- any tenant). A positive integer = days between check-ins, counted
-- from each tenant's own most recently submitted check-in — so this is
-- evaluated per tenant, not on a shared calendar.
alter table public.landlords
  add column checkin_frequency_days integer;

alter table public.landlords
  add constraint landlords_checkin_frequency_days_positive
  check (checkin_frequency_days is null or checkin_frequency_days > 0);
