// Boots PGlite (real Postgres in WASM) with minimal Supabase stubs and runs the project's SQL.
//
// The stubs deliberately give anon/authenticated NO access to schema public: every grant the
// API needs must come from the migrations, so a missing grant fails the tests.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const STUBS = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key, instance_id uuid, aud text, role text, email text, encrypted_password text, email_confirmed_at timestamptz,
    raw_app_meta_data jsonb, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz, updated_at timestamptz);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
  grant usage on schema auth, storage to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
  revoke all on schema public from public;
`;

export function migrations() {
  return fs.readdirSync(path.join(ROOT, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
}

/**
 * @param {{ supabaseDefaults?: boolean, seed?: boolean }} opts
 *   supabaseDefaults: new objects in public are fully granted to API roles (as on a fresh Supabase project).
 */
export async function createDb({ supabaseDefaults = false, seed = false } = {}) {
  const db = new PGlite();
  await db.exec(STUBS);
  if (supabaseDefaults) {
    await db.exec(`alter default privileges in schema public grant all on tables to anon, authenticated;
                   alter default privileges in schema public grant all on functions to anon, authenticated;`);
  }
  // uuid-ossp is not bundled with PGlite and not used by the schema.
  await db.exec(read('supabase_schema.sql').replace(/create extension[^;]+;/i, ''));
  const migrate = async () => {
    for (const f of migrations()) await db.exec(read(`supabase/migrations/${f}`));
  };
  await migrate();
  if (seed) await db.exec(read('supabase_seed.sql').replace(/PERFORM pg_sleep\(\d+\);/g, ''));

  /** Runs a query as a signed-in user (anon when uid is null). Returns { rows } or { error }. */
  const as = async (uid, sql, params = []) => {
    try {
      return await db.transaction(async (tx) => {
        await tx.exec(`set local role ${uid ? 'authenticated' : 'anon'};`);
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
        return { rows: (await tx.query(sql, params)).rows };
      });
    } catch (e) {
      return { error: e.message, code: e.code };
    }
  };
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];
  const signup = (id, email, meta = {}) =>
    db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, email, JSON.stringify(meta)]);

  return { db, as, one, signup, migrate };
}

export const U = {
  admin: '00000000-0000-0000-0000-00000000000a',
  inst: '00000000-0000-0000-0000-0000000000b1',
  inst2: '00000000-0000-0000-0000-0000000000b2',
  stu: '00000000-0000-0000-0000-0000000000c1',
  stu2: '00000000-0000-0000-0000-0000000000c2',
};
