-- Set the default daily online ordering start time to 11:30 AM Sydney time.
-- Preserve custom schedules if an administrator has already changed the start.
alter table public.shop_control alter column opens_at set default '11:30';

update public.shop_control
set opens_at = '11:30',
    updated_at = now(),
    updated_by = null
where id = 1 and opens_at = '11:00';
