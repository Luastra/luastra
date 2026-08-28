-- Luastra provider foundation.
-- User-facing records are explicit Data API surfaces protected by RLS.
-- Provider sessions and protected-object mappings remain in an unexposed schema.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

-- Data API exposure is opt-in. Keep future public objects closed until the
-- migration that creates them also grants the exact role and operation.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

create table public.luastra_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint luastra_profiles_display_name check (display_name is null or char_length(display_name) between 1 and 120)
);

create table public.luastra_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_key text not null,
  created_at timestamptz not null default now(),
  constraint luastra_favorites_resource_key check (resource_key ~ '^[a-z][a-z0-9_-]*(/[a-z][a-z0-9_-]*)*$'),
  constraint luastra_favorites_owner_resource unique (user_id, resource_key)
);

create table public.luastra_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_key text not null,
  position_seconds double precision not null default 0,
  duration_seconds double precision,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint luastra_progress_resource_key check (resource_key ~ '^[a-z][a-z0-9_-]*(/[a-z][a-z0-9_-]*)*$'),
  constraint luastra_progress_position check (position_seconds >= 0 and position_seconds <= 604800),
  constraint luastra_progress_duration check (duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 604800)),
  constraint luastra_progress_bounds check (duration_seconds is null or position_seconds <= duration_seconds + 1),
  constraint luastra_progress_owner_resource unique (user_id, resource_key)
);

create table public.luastra_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_key text not null,
  active boolean not null default true,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  constraint luastra_entitlements_resource_key check (resource_key ~ '^[a-z][a-z0-9_-]*(/[a-z][a-z0-9_-]*)*$'),
  constraint luastra_entitlements_owner_resource unique (user_id, resource_key)
);

create table private.luastra_protected_assets (
  resource_key text primary key,
  bucket_id text not null,
  object_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint luastra_protected_assets_resource_key check (resource_key ~ '^[a-z][a-z0-9_-]*(/[a-z][a-z0-9_-]*)*$'),
  constraint luastra_protected_assets_bucket check (bucket_id ~ '^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$'),
  constraint luastra_protected_assets_object check (object_name !~ '(^/|/$|(^|/)\.\.?(/|$))' and octet_length(object_name) between 1 and 1024),
  constraint luastra_protected_assets_object_unique unique (bucket_id, object_name)
);

create table private.luastra_provider_sessions (
  session_id uuid primary key default gen_random_uuid(),
  token_hash bytea not null unique,
  principal_id uuid not null references auth.users(id) on delete cascade,
  principal_name text not null,
  roles text[] not null default array['user']::text[],
  provider text not null,
  provider_user_id text not null,
  encrypted_material bytea not null,
  encryption_nonce bytea not null,
  encryption_tag bytea not null,
  encryption_key_version smallint not null,
  provider_expires_at timestamptz not null,
  session_expires_at timestamptz not null,
  refresh_lease_hash bytea,
  refresh_lease_until timestamptz,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint luastra_provider_sessions_token_hash check (octet_length(token_hash) = 32),
  constraint luastra_provider_sessions_principal_name check (char_length(principal_name) between 1 and 128),
  constraint luastra_provider_sessions_roles check (cardinality(roles) between 1 and 8 and roles <@ array['user', 'admin']::text[]),
  constraint luastra_provider_sessions_provider check (provider ~ '^[a-z][a-z0-9_-]{0,31}$'),
  constraint luastra_provider_sessions_provider_user check (octet_length(provider_user_id) between 1 and 255),
  constraint luastra_provider_sessions_material check (octet_length(encrypted_material) between 1 and 33024),
  constraint luastra_provider_sessions_nonce check (octet_length(encryption_nonce) = 12),
  constraint luastra_provider_sessions_tag check (octet_length(encryption_tag) = 16),
  constraint luastra_provider_sessions_key_version check (encryption_key_version > 0),
  constraint luastra_provider_sessions_lease check ((refresh_lease_hash is null) = (refresh_lease_until is null)),
  constraint luastra_provider_sessions_lease_hash check (refresh_lease_hash is null or octet_length(refresh_lease_hash) = 32),
  constraint luastra_provider_sessions_revision check (revision > 0),
  constraint luastra_provider_sessions_expiry check (session_expires_at > created_at)
);

create index luastra_favorites_user_id_idx on public.luastra_favorites(user_id);
create index luastra_progress_user_id_idx on public.luastra_progress(user_id);
create index luastra_entitlements_user_id_idx on public.luastra_entitlements(user_id);
create index luastra_entitlements_access_idx on public.luastra_entitlements(user_id, resource_key) where active;
create index luastra_provider_sessions_expiry_idx on private.luastra_provider_sessions(session_expires_at);
create index luastra_provider_sessions_principal_idx on private.luastra_provider_sessions(principal_id);

create or replace function private.luastra_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger luastra_profiles_updated_at
before update on public.luastra_profiles
for each row execute function private.luastra_set_updated_at();

create trigger luastra_progress_updated_at
before update on public.luastra_progress
for each row execute function private.luastra_set_updated_at();

alter table public.luastra_profiles enable row level security;
alter table public.luastra_profiles force row level security;
alter table public.luastra_favorites enable row level security;
alter table public.luastra_favorites force row level security;
alter table public.luastra_progress enable row level security;
alter table public.luastra_progress force row level security;
alter table public.luastra_entitlements enable row level security;
alter table public.luastra_entitlements force row level security;

revoke all on public.luastra_profiles, public.luastra_favorites, public.luastra_progress, public.luastra_entitlements from anon, authenticated;
grant select on public.luastra_profiles, public.luastra_favorites, public.luastra_progress, public.luastra_entitlements to authenticated;
grant insert (id, display_name) on public.luastra_profiles to authenticated;
grant update (display_name) on public.luastra_profiles to authenticated;
grant delete on public.luastra_profiles to authenticated;
grant insert (id, user_id, resource_key) on public.luastra_favorites to authenticated;
grant delete on public.luastra_favorites to authenticated;
grant insert (id, user_id, resource_key, position_seconds, duration_seconds, completed) on public.luastra_progress to authenticated;
grant update (position_seconds, duration_seconds, completed) on public.luastra_progress to authenticated;
grant delete on public.luastra_progress to authenticated;

create policy luastra_profiles_select_own on public.luastra_profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy luastra_profiles_insert_own on public.luastra_profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
create policy luastra_profiles_update_own on public.luastra_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy luastra_profiles_delete_own on public.luastra_profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

create policy luastra_favorites_select_own on public.luastra_favorites
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy luastra_favorites_insert_own on public.luastra_favorites
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy luastra_favorites_delete_own on public.luastra_favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy luastra_progress_select_own on public.luastra_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy luastra_progress_insert_own on public.luastra_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy luastra_progress_update_own on public.luastra_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy luastra_progress_delete_own on public.luastra_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy luastra_entitlements_select_own on public.luastra_entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.luastra_can_read_protected_object(requested_bucket text, requested_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from private.luastra_protected_assets asset
    join public.luastra_entitlements entitlement on entitlement.resource_key = asset.resource_key
    where asset.bucket_id = requested_bucket
      and asset.object_name = requested_name
      and asset.active
      and entitlement.user_id = (select auth.uid())
      and entitlement.active
      and (entitlement.valid_until is null or entitlement.valid_until > now())
  );
$$;

revoke all on function private.luastra_set_updated_at() from public, anon, authenticated;
revoke all on function private.luastra_can_read_protected_object(text, text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.luastra_can_read_protected_object(text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'luastra-private-media',
  'luastra-private-media',
  false,
  524288000,
  array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy luastra_private_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'luastra-private-media'
    and private.luastra_can_read_protected_object(bucket_id, name)
  );

revoke all on private.luastra_provider_sessions, private.luastra_protected_assets from public, anon, authenticated, service_role;
