begin;
create extension if not exists pgtap with schema extensions;
create temporary table luastra_tap_results (
  sequence bigint generated always as identity,
  line text not null
) on commit drop;
grant insert on table luastra_tap_results to authenticated, anon;
grant usage, select on sequence luastra_tap_results_sequence_seq to authenticated, anon;
insert into luastra_tap_results (line) select plan(16);

insert into auth.users (id, email) values
  ('123e4567-e89b-42d3-a456-426614174000', 'owner-one@example.test'),
  ('987fcdeb-51a2-43d7-9012-345678901234', 'owner-two@example.test');

insert into public.luastra_favorites (id, user_id, resource_key) values
  ('10000000-0000-4000-8000-000000000001', '123e4567-e89b-42d3-a456-426614174000', 'audio/one'),
  ('20000000-0000-4000-8000-000000000001', '987fcdeb-51a2-43d7-9012-345678901234', 'audio/two');

insert into public.luastra_progress (id, user_id, resource_key, position_seconds) values
  ('10000000-0000-4000-8000-000000000002', '123e4567-e89b-42d3-a456-426614174000', 'audio/one', 10),
  ('20000000-0000-4000-8000-000000000002', '987fcdeb-51a2-43d7-9012-345678901234', 'audio/two', 20);

insert into public.luastra_entitlements (id, user_id, resource_key) values
  ('10000000-0000-4000-8000-000000000003', '123e4567-e89b-42d3-a456-426614174000', 'audio/one'),
  ('20000000-0000-4000-8000-000000000003', '987fcdeb-51a2-43d7-9012-345678901234', 'audio/two');

insert into private.luastra_protected_assets (resource_key, bucket_id, object_name) values
  ('audio/one', 'luastra-private-media', 'audio/one.mp3'),
  ('audio/two', 'luastra-private-media', 'audio/two.mp3');

insert into luastra_tap_results (line) select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.luastra_profiles'::regclass), 'profiles has forced RLS');
insert into luastra_tap_results (line) select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.luastra_favorites'::regclass), 'favorites has forced RLS');
insert into luastra_tap_results (line) select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.luastra_progress'::regclass), 'progress has forced RLS');
insert into luastra_tap_results (line) select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.luastra_entitlements'::regclass), 'entitlements has forced RLS');

set local role authenticated;
set local request.jwt.claim.sub = '123e4567-e89b-42d3-a456-426614174000';

insert into luastra_tap_results (line) select results_eq(
  'select count(*) from public.luastra_favorites',
  array[1::bigint],
  'an authenticated user sees only their favorites'
);
insert into luastra_tap_results (line) select results_eq(
  'select resource_key from public.luastra_progress order by resource_key',
  array['audio/one'::text],
  'an authenticated user sees only their progress'
);
insert into luastra_tap_results (line) select lives_ok(
  $$insert into public.luastra_favorites (id, user_id, resource_key) values ('10000000-0000-4000-8000-000000000004', '123e4567-e89b-42d3-a456-426614174000', 'audio/three')$$,
  'an authenticated user can insert their own favorite'
);
insert into luastra_tap_results (line) select throws_ok(
  $$insert into public.luastra_favorites (id, user_id, resource_key) values ('10000000-0000-4000-8000-000000000005', '987fcdeb-51a2-43d7-9012-345678901234', 'audio/attack')$$,
  '42501',
  'new row violates row-level security policy for table "luastra_favorites"',
  'an authenticated user cannot insert another owner favorite'
);
insert into luastra_tap_results (line) select results_eq(
  $$update public.luastra_progress set position_seconds = 99 where user_id = '987fcdeb-51a2-43d7-9012-345678901234' returning id$$,
  array[]::uuid[],
  'an authenticated user cannot update another owner progress'
);
insert into luastra_tap_results (line) select results_eq(
  'select resource_key from public.luastra_entitlements order by resource_key',
  array['audio/one'::text],
  'an authenticated user sees only their entitlements'
);
insert into luastra_tap_results (line) select is(
  private.luastra_can_read_protected_object('luastra-private-media', 'audio/one.mp3'),
  true,
  'an active own entitlement permits the mapped protected object'
);
insert into luastra_tap_results (line) select is(
  private.luastra_can_read_protected_object('luastra-private-media', 'audio/two.mp3'),
  false,
  'another owner entitlement cannot permit a protected object'
);
insert into luastra_tap_results (line) select throws_ok(
  'select count(*) from private.luastra_provider_sessions',
  '42501',
  'permission denied for table luastra_provider_sessions',
  'authenticated cannot read brokered provider sessions'
);
insert into luastra_tap_results (line) select throws_ok(
  $$select * from public.luastra_server_resolve_session(decode(repeat('00', 32), 'hex'))$$,
  '42501',
  'permission denied for function luastra_server_resolve_session',
  'authenticated cannot execute server session RPCs'
);
insert into luastra_tap_results (line) select throws_ok(
  $$insert into public.luastra_entitlements (user_id, resource_key) values ('123e4567-e89b-42d3-a456-426614174000', 'audio/escalation')$$,
  '42501',
  'permission denied for table luastra_entitlements',
  'authenticated cannot grant their own entitlement'
);

reset role;
set local role anon;
set local request.jwt.claim.sub = '';
insert into luastra_tap_results (line) select throws_ok(
  'select count(*) from public.luastra_favorites',
  '42501',
  'permission denied for table luastra_favorites',
  'anonymous clients have no record-table grant'
);

reset role;
insert into luastra_tap_results (line) select * from finish();

-- Emit the buffered TAP lines for `supabase test db` / pg_prove. Assertions
-- are buffered above because several of them run after switching to the
-- authenticated and anon roles.
select line from luastra_tap_results order by sequence;

select jsonb_build_object(
  'plan', (select line from luastra_tap_results where line like '1..%' order by sequence limit 1),
  'assertion_count', (select count(*) from luastra_tap_results where line ~ '^(not )?ok [0-9]+'),
  'failures', (select count(*) from luastra_tap_results where line like 'not ok %'),
  'assertions', (select jsonb_agg(line order by sequence) from luastra_tap_results where line ~ '^(not )?ok [0-9]+')
) as hosted_tap_report;
rollback;
