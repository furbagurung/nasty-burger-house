-- Customer review moderation and least-privilege hardening.
-- Public review reads are served through the server API; no customer PII is exposed.

alter table public.reviews
  drop constraint if exists reviews_status_check;

alter table public.reviews
  alter column status set default 'pending';

alter table public.reviews
  add constraint reviews_status_check
  check (status in ('pending', 'published', 'hidden', 'flagged'));

alter table public.reviews
  drop constraint if exists reviews_message_length_check;

alter table public.reviews
  add constraint reviews_message_length_check
  check (char_length(message) <= 1000);

create index if not exists reviews_status_created_at_idx
  on public.reviews(status, created_at desc);

-- Review writes move behind the authenticated server route. Customers retain
-- read access to their own reviews, but can no longer change moderation status
-- through the public Data API.
revoke insert, update on table public.reviews from authenticated;
grant select on table public.reviews to authenticated;
revoke all on table public.reviews from anon;

drop policy if exists reviews_insert_completed_order on public.reviews;
drop policy if exists reviews_update_self on public.reviews;
