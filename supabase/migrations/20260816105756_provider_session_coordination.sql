-- Server-only coordination for opaque Luastra sessions.
-- The Data API exposes only these narrowly granted RPCs. Provider material is
-- encrypted by the application before it reaches Postgres and remains in the
-- private schema. A Supabase secret/service-role key is mandatory.

create table private.luastra_provider_revocations (
  revocation_id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  principal_id uuid not null,
  provider text not null,
  provider_user_id text not null,
  encrypted_material bytea not null,
  encryption_nonce bytea not null,
  encryption_tag bytea not null,
  encryption_key_version smallint not null,
  provider_expires_at timestamptz not null,
  attempts smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_owner uuid,
  lease_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint luastra_provider_revocations_provider check (provider ~ '^[a-z][a-z0-9_-]{0,31}$'),
  constraint luastra_provider_revocations_provider_user check (octet_length(provider_user_id) between 1 and 255),
  constraint luastra_provider_revocations_material check (octet_length(encrypted_material) between 1 and 33024),
  constraint luastra_provider_revocations_nonce check (octet_length(encryption_nonce) = 12),
  constraint luastra_provider_revocations_tag check (octet_length(encryption_tag) = 16),
  constraint luastra_provider_revocations_key_version check (encryption_key_version > 0),
  constraint luastra_provider_revocations_attempts check (attempts between 0 and 12),
  constraint luastra_provider_revocations_lease check ((lease_owner is null) = (lease_until is null)),
  constraint luastra_provider_revocations_last_error check (last_error is null or octet_length(last_error) <= 500)
);

create index luastra_provider_revocations_due_idx
  on private.luastra_provider_revocations(next_attempt_at)
  where completed_at is null;

revoke all on private.luastra_provider_revocations from public, anon, authenticated, service_role;

create or replace function public.luastra_server_issue_session(
  p_session_id uuid,
  p_token_hash bytea,
  p_principal_id uuid,
  p_principal_name text,
  p_roles text[],
  p_provider text,
  p_provider_user_id text,
  p_encrypted_material bytea,
  p_encryption_nonce bytea,
  p_encryption_tag bytea,
  p_encryption_key_version smallint,
  p_provider_expires_at timestamptz,
  p_session_expires_at timestamptz
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_revision bigint;
begin
  if p_session_expires_at <= now() or p_provider_expires_at <= now() then
    raise exception using errcode = '22023', message = 'session expiry must be in the future';
  end if;

  insert into private.luastra_provider_sessions (
    session_id, token_hash, principal_id, principal_name, roles, provider,
    provider_user_id, encrypted_material, encryption_nonce, encryption_tag,
    encryption_key_version, provider_expires_at, session_expires_at
  ) values (
    p_session_id, p_token_hash, p_principal_id, p_principal_name, p_roles, p_provider,
    p_provider_user_id, p_encrypted_material, p_encryption_nonce, p_encryption_tag,
    p_encryption_key_version, p_provider_expires_at, p_session_expires_at
  ) returning revision into created_revision;

  return created_revision;
end;
$$;

create or replace function public.luastra_server_resolve_session(p_token_hash bytea)
returns table (
  session_id uuid,
  principal_id uuid,
  principal_name text,
  roles text[],
  provider text,
  provider_user_id text,
  encrypted_material bytea,
  encryption_nonce bytea,
  encryption_tag bytea,
  encryption_key_version smallint,
  provider_expires_at timestamptz,
  session_expires_at timestamptz,
  revision bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.luastra_provider_sessions s
  where s.token_hash = p_token_hash and s.session_expires_at <= now();

  return query
    select s.session_id, s.principal_id, s.principal_name, s.roles, s.provider,
      s.provider_user_id, s.encrypted_material, s.encryption_nonce,
      s.encryption_tag, s.encryption_key_version, s.provider_expires_at,
      s.session_expires_at, s.revision
    from private.luastra_provider_sessions s
    where s.token_hash = p_token_hash and s.session_expires_at > now();
end;
$$;

create or replace function public.luastra_server_acquire_refresh_lease(
  p_session_id uuid,
  p_expected_revision bigint,
  p_lease_hash bytea,
  p_lease_until timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if octet_length(p_lease_hash) <> 32
     or p_lease_until <= now()
     or p_lease_until > now() + interval '2 minutes' then
    raise exception using errcode = '22023', message = 'invalid refresh lease';
  end if;

  update private.luastra_provider_sessions s
  set refresh_lease_hash = p_lease_hash,
      refresh_lease_until = p_lease_until,
      updated_at = now()
  where s.session_id = p_session_id
    and s.revision = p_expected_revision
    and s.session_expires_at > now()
    and (s.refresh_lease_until is null or s.refresh_lease_until <= now());
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.luastra_server_complete_refresh(
  p_session_id uuid,
  p_lease_hash bytea,
  p_principal_name text,
  p_roles text[],
  p_encrypted_material bytea,
  p_encryption_nonce bytea,
  p_encryption_tag bytea,
  p_encryption_key_version smallint,
  p_provider_expires_at timestamptz
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  update private.luastra_provider_sessions s
  set principal_name = p_principal_name,
      roles = p_roles,
      encrypted_material = p_encrypted_material,
      encryption_nonce = p_encryption_nonce,
      encryption_tag = p_encryption_tag,
      encryption_key_version = p_encryption_key_version,
      provider_expires_at = p_provider_expires_at,
      refresh_lease_hash = null,
      refresh_lease_until = null,
      revision = s.revision + 1,
      updated_at = now()
  where s.session_id = p_session_id
    and s.refresh_lease_hash = p_lease_hash
    and s.refresh_lease_until > now()
    and s.session_expires_at > now()
  returning s.revision into next_revision;

  if next_revision is null then
    raise exception using errcode = '40001', message = 'stale or expired refresh lease';
  end if;
  return next_revision;
end;
$$;

create or replace function public.luastra_server_release_refresh_lease(
  p_session_id uuid,
  p_lease_hash bytea
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update private.luastra_provider_sessions s
  set refresh_lease_hash = null, refresh_lease_until = null, updated_at = now()
  where s.session_id = p_session_id and s.refresh_lease_hash = p_lease_hash;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.luastra_server_revoke_session(
  p_session_id uuid,
  p_enqueue_provider_revocation boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed private.luastra_provider_sessions%rowtype;
begin
  delete from private.luastra_provider_sessions s
  where s.session_id = p_session_id
  returning s.* into removed;

  if removed.session_id is null then
    return false;
  end if;

  if p_enqueue_provider_revocation and removed.provider_expires_at > now() then
    insert into private.luastra_provider_revocations (
      session_id, principal_id, provider, provider_user_id, encrypted_material,
      encryption_nonce, encryption_tag, encryption_key_version,
      provider_expires_at
    ) values (
      removed.session_id, removed.principal_id, removed.provider,
      removed.provider_user_id, removed.encrypted_material,
      removed.encryption_nonce, removed.encryption_tag,
      removed.encryption_key_version, removed.provider_expires_at
    ) on conflict (session_id) do nothing;
  end if;

  return true;
end;
$$;

create or replace function public.luastra_server_claim_revocations(
  p_worker_id uuid,
  p_limit integer default 10,
  p_lease_seconds integer default 30
)
returns table (
  revocation_id uuid,
  session_id uuid,
  provider text,
  provider_user_id text,
  encrypted_material bytea,
  encryption_nonce bytea,
  encryption_tag bytea,
  encryption_key_version smallint,
  provider_expires_at timestamptz,
  attempts smallint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 50 or p_lease_seconds < 5 or p_lease_seconds > 120 then
    raise exception using errcode = '22023', message = 'invalid revocation lease bounds';
  end if;

  return query
  with due as (
    select r.revocation_id
    from private.luastra_provider_revocations r
    where r.completed_at is null
      and r.provider_expires_at > now()
      and r.attempts < 12
      and r.next_attempt_at <= now()
      and (r.lease_until is null or r.lease_until <= now())
    order by r.next_attempt_at, r.created_at
    for update skip locked
    limit p_limit
  ), claimed as (
    update private.luastra_provider_revocations r
    set lease_owner = p_worker_id,
        lease_until = now() + make_interval(secs => p_lease_seconds),
        attempts = r.attempts + 1,
        updated_at = now()
    from due
    where r.revocation_id = due.revocation_id
    returning r.*
  )
  select c.revocation_id, c.session_id, c.provider, c.provider_user_id,
    c.encrypted_material, c.encryption_nonce, c.encryption_tag,
    c.encryption_key_version, c.provider_expires_at, c.attempts
  from claimed c;
end;
$$;

create or replace function public.luastra_server_complete_revocation(
  p_revocation_id uuid,
  p_worker_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update private.luastra_provider_revocations r
  set completed_at = now(), lease_owner = null, lease_until = null,
      last_error = null, updated_at = now()
  where r.revocation_id = p_revocation_id
    and r.lease_owner = p_worker_id
    and r.completed_at is null;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.luastra_server_retry_revocation(
  p_revocation_id uuid,
  p_worker_id uuid,
  p_delay_seconds integer,
  p_last_error text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if p_delay_seconds < 1 or p_delay_seconds > 3600 or octet_length(p_last_error) > 500 then
    raise exception using errcode = '22023', message = 'invalid revocation retry';
  end if;

  update private.luastra_provider_revocations r
  set next_attempt_at = least(now() + make_interval(secs => p_delay_seconds), r.provider_expires_at),
      lease_owner = null,
      lease_until = null,
      last_error = p_last_error,
      updated_at = now()
  where r.revocation_id = p_revocation_id
    and r.lease_owner = p_worker_id
    and r.completed_at is null;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.luastra_server_prune_security_state()
returns table (expired_sessions bigint, expired_revocations bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_count bigint;
  revocation_count bigint;
begin
  delete from private.luastra_provider_sessions where session_expires_at <= now();
  get diagnostics session_count = row_count;
  delete from private.luastra_provider_revocations
  where provider_expires_at <= now() or completed_at <= now() - interval '7 days';
  get diagnostics revocation_count = row_count;
  return query select session_count, revocation_count;
end;
$$;

revoke all on function public.luastra_server_issue_session(uuid, bytea, uuid, text, text[], text, text, bytea, bytea, bytea, smallint, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.luastra_server_resolve_session(bytea) from public, anon, authenticated;
revoke all on function public.luastra_server_acquire_refresh_lease(uuid, bigint, bytea, timestamptz) from public, anon, authenticated;
revoke all on function public.luastra_server_complete_refresh(uuid, bytea, text, text[], bytea, bytea, bytea, smallint, timestamptz) from public, anon, authenticated;
revoke all on function public.luastra_server_release_refresh_lease(uuid, bytea) from public, anon, authenticated;
revoke all on function public.luastra_server_revoke_session(uuid, boolean) from public, anon, authenticated;
revoke all on function public.luastra_server_claim_revocations(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.luastra_server_complete_revocation(uuid, uuid) from public, anon, authenticated;
revoke all on function public.luastra_server_retry_revocation(uuid, uuid, integer, text) from public, anon, authenticated;
revoke all on function public.luastra_server_prune_security_state() from public, anon, authenticated;

grant execute on function public.luastra_server_issue_session(uuid, bytea, uuid, text, text[], text, text, bytea, bytea, bytea, smallint, timestamptz, timestamptz) to service_role;
grant execute on function public.luastra_server_resolve_session(bytea) to service_role;
grant execute on function public.luastra_server_acquire_refresh_lease(uuid, bigint, bytea, timestamptz) to service_role;
grant execute on function public.luastra_server_complete_refresh(uuid, bytea, text, text[], bytea, bytea, bytea, smallint, timestamptz) to service_role;
grant execute on function public.luastra_server_release_refresh_lease(uuid, bytea) to service_role;
grant execute on function public.luastra_server_revoke_session(uuid, boolean) to service_role;
grant execute on function public.luastra_server_claim_revocations(uuid, integer, integer) to service_role;
grant execute on function public.luastra_server_complete_revocation(uuid, uuid) to service_role;
grant execute on function public.luastra_server_retry_revocation(uuid, uuid, integer, text) to service_role;
grant execute on function public.luastra_server_prune_security_state() to service_role;
