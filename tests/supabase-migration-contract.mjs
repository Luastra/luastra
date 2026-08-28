import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const prototype = resolve(import.meta.dirname, "..");
const supabaseRoot = resolve(prototype, "supabase");

async function migration() {
  const files = (await readdir(resolve(supabaseRoot, "migrations"))).filter((file) => file.endsWith("_luastra_provider_foundation.sql"));
  assert.equal(files.length, 1, "provider foundation must have exactly one CLI-generated migration");
  assert.match(files[0], /^\d{14}_luastra_provider_foundation\.sql$/);
  return readFile(resolve(supabaseRoot, "migrations", files[0]), "utf8");
}

async function coordinationMigrations() {
  const files = (await readdir(resolve(supabaseRoot, "migrations")))
    .filter((file) => file.endsWith("_provider_session_coordination.sql") || file.endsWith("_erase_completed_revocation_material.sql") || file.endsWith("_deterministic_stale_refresh_result.sql"))
    .sort();
  assert.equal(files.length, 3, "session coordination must retain its three ordered migrations");
  for (const file of files) assert.match(file, /^\d{14}_[a-z0-9_]+\.sql$/);
  return Promise.all(files.map((file) => readFile(resolve(supabaseRoot, "migrations", file), "utf8")));
}

test("Supabase workspace pins the stable CLI and hardened local Auth defaults", async () => {
  const packageJson = JSON.parse(await readFile(resolve(prototype, "package.json"), "utf8"));
  const packageLock = JSON.parse(await readFile(resolve(prototype, "package-lock.json"), "utf8"));
  const config = await readFile(resolve(supabaseRoot, "config.toml"), "utf8");
  assert.equal(packageJson.devDependencies.supabase, "2.114.0");
  assert.equal(packageLock.packages["node_modules/supabase"].version, "2.114.0");
  assert.match(config, /project_id = "luastra-phase5-provider-proof"/);
  assert.match(config, /major_version = 17/);
  assert.match(config, /enable_refresh_token_rotation = true/);
  assert.match(config, /minimum_password_length = 10/);
  assert.match(config, /password_requirements = "lower_upper_letters_digits_symbols"/);
  assert.match(config, /enable_confirmations = true/);
  assert.doesNotMatch(config, /^auto_expose_new_tables\s*=\s*true/m);
});

test("Supabase migration exposes only owner-scoped user tables and keeps provider state private", async () => {
  const sql = await migration();
  for (const table of ["luastra_profiles", "luastra_favorites", "luastra_progress", "luastra_entitlements"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`));
    assert.match(sql, new RegExp(`alter table public\\.${table} force row level security;`));
  }
  assert.equal((sql.match(/to authenticated\n\s+(?:using|with check) \(\(select auth\.uid\(\)\) = (?:id|user_id)\)/g) ?? []).length >= 10, true);
  assert.doesNotMatch(sql, /grant\s+(?:select|insert|update|delete).*\s+to\s+anon/i);
  assert.match(sql, /alter default privileges for role postgres in schema public\n\s+revoke select, insert, update, delete on tables from anon, authenticated, service_role;/);
  assert.match(sql, /alter default privileges for role postgres in schema public\n\s+revoke usage, select on sequences from anon, authenticated, service_role;/);
  assert.match(sql, /alter default privileges for role postgres in schema public\n\s+revoke execute on functions from public, anon, authenticated, service_role;/);
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete).*luastra_entitlements.*authenticated/i);
  assert.match(sql, /revoke all on schema private from public, anon, authenticated, service_role;/);
  assert.match(sql, /token_hash bytea not null unique/);
  assert.match(sql, /principal_name text not null/);
  assert.match(sql, /char_length\(principal_name\) between 1 and 128/);
  assert.match(sql, /octet_length\(token_hash\) = 32/);
  assert.match(sql, /encrypted_material bytea not null/);
  assert.match(sql, /encryption_key_version smallint not null/);
  assert.match(sql, /refresh_lease_hash bytea/);
  assert.match(sql, /revision bigint not null default 1/);
  assert.match(sql, /revoke all on private\.luastra_provider_sessions, private\.luastra_protected_assets from public, anon, authenticated, service_role;/);
});

test("Supabase private media policy is entitlement-bound and has no authenticated upload path", async () => {
  const sql = await migration();
  assert.match(sql, /'luastra-private-media',[\s\S]*?false,[\s\S]*?524288000/);
  assert.match(sql, /create or replace function private\.luastra_can_read_protected_object\(requested_bucket text, requested_name text\)/);
  assert.match(sql, /security definer\nset search_path = ''/);
  assert.match(sql, /entitlement\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /entitlement\.active/);
  assert.match(sql, /entitlement\.valid_until is null or entitlement\.valid_until > now\(\)/);
  assert.match(sql, /create policy luastra_private_media_select on storage\.objects\n\s+for select to authenticated/);
  assert.doesNotMatch(sql, /create policy .*storage\.objects[\s\S]{0,120}for (?:insert|update|delete) to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete).*storage\.objects.*authenticated/i);
});

test("Supabase server RPCs coordinate refresh and erase completed revocation material", async () => {
  const migrations = await coordinationMigrations();
  const sql = migrations.join("\n");
  assert.match(sql, /create table private\.luastra_provider_revocations/);
  assert.match(sql, /encrypted_material bytea not null/);
  assert.match(sql, /attempts smallint not null default 0/);
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /create or replace function public\.luastra_server_acquire_refresh_lease/);
  assert.match(sql, /s\.revision = p_expected_revision/);
  assert.match(sql, /create or replace function public\.luastra_server_revoke_session/);
  assert.match(sql, /insert into private\.luastra_provider_revocations/);
  assert.match(sql, /create or replace function public\.luastra_server_claim_revocations/);
  assert.match(sql, /create or replace function public\.luastra_server_complete_revocation/);
  assert.match(migrations[1], /delete from private\.luastra_provider_revocations/);
  assert.doesNotMatch(migrations[1], /set completed_at = now\(\)/);
  assert.match(migrations[2], /return coalesce\(next_revision, 0\)/);
  assert.doesNotMatch(migrations[2], /errcode = '40001'/);
  assert.doesNotMatch(sql, /grant execute[^;]+to (?:public|anon|authenticated)/i);
  assert.equal((sql.match(/grant execute on function public\.luastra_server_[^;]+ to service_role;/g) ?? []).length >= 10, true);
});

test("Supabase pgTAP plan includes owner-isolation, escalation and server-RPC negative controls", async () => {
  const sql = await readFile(resolve(supabaseRoot, "tests", "luastra_rls_test.sql"), "utf8");
  assert.match(sql, /select plan\(16\)/);
  assert.match(sql, /'assertion_count'/);
  assert.match(sql, /'failures'/);
  assert.match(sql, /as hosted_tap_report/);
  assert.match(sql, /set local role authenticated/);
  assert.match(sql, /cannot insert another owner favorite/);
  assert.match(sql, /cannot update another owner progress/);
  assert.match(sql, /another owner entitlement cannot permit a protected object/);
  assert.match(sql, /authenticated cannot read brokered provider sessions/);
  assert.match(sql, /authenticated cannot execute server session RPCs/);
  assert.match(sql, /authenticated cannot grant their own entitlement/);
  assert.match(sql, /set local role anon/);
  assert.match(sql, /anonymous clients have no record-table grant/);
  assert.match(sql, /rollback;/);
});
