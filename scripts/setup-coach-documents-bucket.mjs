import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = (() => {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const e = {}
  for (const l of raw.split('\n')) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }
  return e
})()

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('creating bucket "coach-documents" (private)...')
const { data, error } = await admin.storage.createBucket('coach-documents', {
  public: false,
  fileSizeLimit: 10 * 1024 * 1024,
})
if (error && error.message !== 'The resource already exists') {
  console.error('failed:', error.message)
  process.exit(1)
}
console.log('  ✓', data ?? 'already exists')

// List to confirm
const { data: buckets } = await admin.storage.listBuckets()
const doc = buckets?.find((b) => b.name === 'coach-documents')
console.log(`  coach-documents  public=${doc?.public}`)
