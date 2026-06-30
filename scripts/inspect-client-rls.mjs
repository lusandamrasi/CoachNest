// Inspect actual RLS state on client_profiles using the service role.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing url or service key')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function rpcSql(sql) {
  // Use Postgres meta endpoint if available; otherwise fall back to a small RPC trick:
  // call a one-shot function via supabase-js raw SQL is not supported, so use the
  // PostgREST RPC pattern by creating a temporary function-less approach: hit the
  // postgres-meta SQL endpoint directly.
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: sql }),
  })
  return { status: res.status, body: await res.text() }
}

// We don't have an exec_sql function — instead use direct table SELECTs against
// pg_policies / pg_class via PostgREST's introspection. PostgREST exposes
// information_schema but not pg_catalog by default. So we use the supabase-js
// `.from('pg_policies')` against the `pg_catalog` schema via PostgREST headers.
async function viaPgMeta(sql) {
  // Try Supabase's hidden /pg endpoint (works in cloud projects)
  const r = await fetch(`${url}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  return { status: r.status, body: await r.text() }
}

// Simpler: use REST against information_schema views (PostgREST exposes them).
async function selectAt(path, headers = {}) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...headers,
    },
  })
  return { status: r.status, body: await r.text() }
}

console.log('=== /pg/query (pg_policies) ===')
const pol = await viaPgMeta(`
  select policyname, cmd, roles, permissive, qual, with_check
  from pg_policies
  where schemaname = 'public' and tablename = 'client_profiles'
  order by cmd, policyname;
`)
console.log('status', pol.status)
console.log(pol.body)

console.log('\n=== /pg/query (rls + grants) ===')
const meta = await viaPgMeta(`
  select c.relname,
         c.relrowsecurity,
         c.relforcerowsecurity,
         array_agg(distinct g.grantee) filter (where g.grantee is not null) as grants
  from pg_class c
  left join information_schema.role_table_grants g
    on g.table_schema = 'public' and g.table_name = c.relname
  where c.relname = 'client_profiles'
  group by c.relname, c.relrowsecurity, c.relforcerowsecurity;
`)
console.log('status', meta.status)
console.log(meta.body)

console.log('\n=== /pg/query (table grants detail) ===')
const grants = await viaPgMeta(`
  select grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'client_profiles'
  order by grantee, privilege_type;
`)
console.log('status', grants.status)
console.log(grants.body)
