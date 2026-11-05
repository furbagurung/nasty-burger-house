-- Additional verified sign-in emails for a single Supabase Auth customer identity.
-- Apply before deploying the matching application code. Does not merge existing auth users.
create table if not exists public.customer_email_aliases (
  email text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_at timestamptz,
  token_hash text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_email_alias_lowercase check (email = lower(trim(email)) and length(email) <= 160),
  constraint customer_email_alias_state check (
    (verified_at is null and token_hash is not null and expires_at is not null)
    or (verified_at is not null and token_hash is null and expires_at is null)
  )
);
create index if not exists customer_email_aliases_user_idx on public.customer_email_aliases (user_id);
create unique index if not exists customer_email_aliases_token_uidx
  on public.customer_email_aliases (token_hash) where token_hash is not null;

alter table public.customer_email_aliases enable row level security;
revoke all on public.customer_email_aliases from public, anon, authenticated;
grant select, insert, update, delete on public.customer_email_aliases to service_role;

-- An additional verified address may not impersonate another Auth user's primary email.
create or replace function public.guard_customer_email_alias()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.verified_at is not null and exists (
    select 1 from auth.users u
    where lower(u.email) = new.email and u.id <> new.user_id
  ) then
    raise exception 'Email address is already assigned to another account' using errcode = '23505';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_customer_email_alias() from public, anon, authenticated;
drop trigger if exists guard_customer_email_alias on public.customer_email_aliases;
create trigger guard_customer_email_alias before insert or update of email, user_id, verified_at
on public.customer_email_aliases for each row execute function public.guard_customer_email_alias();

-- Also prevent later primary-email changes/signups from colliding with a verified alias.
create or replace function public.guard_auth_primary_email_alias()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.email is not null and exists (
    select 1 from public.customer_email_aliases a
    where a.email = lower(new.email) and a.verified_at is not null and a.user_id <> new.id
  ) then
    raise exception 'Email address already belongs to another account' using errcode = '23505';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_auth_primary_email_alias() from public, anon, authenticated;
drop trigger if exists guard_auth_primary_email_alias on auth.users;
create trigger guard_auth_primary_email_alias before insert or update of email
on auth.users for each row execute function public.guard_auth_primary_email_alias();

comment on table public.customer_email_aliases is
  'Server-managed additional verified login emails; never public search data or a separate loyalty wallet.';
