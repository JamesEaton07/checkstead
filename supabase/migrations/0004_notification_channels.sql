-- Replace the single exclusive notify_pref ('email' | 'sms') with two
-- independent boolean channels, so a landlord can opt into both email and
-- SMS at once instead of picking exactly one.

alter table public.landlords add column notify_email boolean not null default true;
alter table public.landlords add column notify_sms boolean not null default false;

update public.landlords
set notify_email = (notify_pref = 'email'),
    notify_sms = (notify_pref = 'sms');

alter table public.landlords drop column notify_pref;
