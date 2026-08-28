-- Successful provider logout removes the encrypted token material immediately.
-- Operational counters/logs belong outside the credential-bearing outbox row.

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
  delete from private.luastra_provider_revocations r
  where r.revocation_id = p_revocation_id
    and r.lease_owner = p_worker_id
    and r.completed_at is null;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.luastra_server_complete_revocation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.luastra_server_complete_revocation(uuid, uuid) to service_role;
