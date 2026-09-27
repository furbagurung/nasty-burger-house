-- Durable application-level abuse controls for authentication and checkout.
-- Raw IP addresses, emails and phone numbers are never stored: application keys
-- are SHA-256 hashed before they reach this table.

create table if not exists public.auth_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash, window_start)
);

alter table public.auth_rate_limits enable row level security;

revoke all on table public.auth_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.auth_rate_limits to service_role;

create or replace function public.consume_rate_limit(
  limit_scope text,
  limit_key_hash text,
  max_attempts integer,
  window_seconds integer
)
returns table (
  allowed boolean,
  attempts integer,
  retry_after_seconds integer
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bucket_start timestamptz;
  current_attempts integer;
  seconds_remaining integer;
begin
  if max_attempts < 1 or window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from now()) / window_seconds) * window_seconds
  );

  insert into public.auth_rate_limits(scope, key_hash, window_start, attempts)
  values (limit_scope, limit_key_hash, bucket_start, 1)
  on conflict (scope, key_hash, window_start)
  do update
    set attempts = public.auth_rate_limits.attempts + 1,
        updated_at = now()
  returning public.auth_rate_limits.attempts into current_attempts;

  seconds_remaining := greatest(
    1,
    ceil(
      extract(
        epoch from ((bucket_start + make_interval(secs => window_seconds)) - now())
      )
    )::integer
  );

  return query
  select current_attempts <= max_attempts, current_attempts, seconds_remaining;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
to service_role;

create index if not exists auth_rate_limits_updated_at_idx
  on public.auth_rate_limits(updated_at);

-- Opportunistic cleanup can be run periodically; old buckets contain no raw PII.
