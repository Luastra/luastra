-- SQLSTATE 40001 advertises a retryable serialization failure to gateways and
-- drivers. A stale lease is an expected application result, so return zero.

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

  return coalesce(next_revision, 0);
end;
$$;

revoke all on function public.luastra_server_complete_refresh(uuid, bytea, text, text[], bytea, bytea, bytea, smallint, timestamptz) from public, anon, authenticated;
grant execute on function public.luastra_server_complete_refresh(uuid, bytea, text, text[], bytea, bytea, bytea, smallint, timestamptz) to service_role;
