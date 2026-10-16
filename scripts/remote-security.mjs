import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { REMOTE_TABLES } from '../src/data-access/supabaseRepository.js'
import { loadSecurityCredentials, securityEnvStatus } from './security-env.mjs'

// Real Auth + PostgREST, no service_role or SQL-admin bypass. Never log error objects/sessions.
// Vite loads public configuration only. Credentials use the literal parser, never dotenv-expand.
let credentials
try { credentials = loadSecurityCredentials() }
catch { console.error('Arquivo de credenciais inválido; nenhum teste executado.'); process.exit(2) }
const credentialStatus = securityEnvStatus(credentials)
for (const [name, result] of Object.entries(credentialStatus)) {
  console.log(`${name}: carregada=${result.loaded}; não vazia=${result.nonEmpty}`)
}
if (!process.argv.includes('--anonymous-only') && Object.values(credentialStatus).some((result) => !result.nonEmpty)) {
  console.error('Credenciais incompletas; nenhum teste executado.')
  process.exit(2)
}
const env = { ...loadEnv('development', process.cwd(), 'VITE_'), ...credentials }
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
assert.equal(new URL(url).hostname, 'vygojpxmuzjmshotlxrl.supabase.co', 'Wrong project')
assert.ok(key?.startsWith('sb_publishable_'), 'Public key required')
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
const run = `targetfb-security:${randomUUID()}`
const criteria = { version: 1, items: { performance: { passed: null } } }
const actors = []
const created = []
const checks = []
const check = (name) => { checks.push(name); console.log(`PASS ${name}`) }
const requireData = ({ data, error }) => {
  if (error) throw new Error(`PostgREST failure ${error.code ?? 'unknown'}`)
  return data
}
const denied = ({ error }) => assert.equal(error?.code, '42501', 'Expected permission denial')
const create = async (actor, table, values) => {
  const row = requireData(await actor.db.from(table).insert({ ...values, legacy_id: `${run}:${table}` }).select().single())
  actor.rows[table] = row
  created.push({ actor, table, id: row.id, marker: row.legacy_id })
  return row
}
const record = async (actor, args) => {
  const row = requireData(await actor.db.rpc('record_evaluation', args))
  // A scalar composite is normally an object; tolerate PostgREST's row-array representation.
  const saved = Array.isArray(row) ? row[0] : row
  created.push({ actor, table: 'evaluations', id: saved.id, target: args.p_formula_id ?? args.p_publication_id })
  return saved
}

async function anonymous() {
  const anon = client()
  const absent = randomUUID()
  for (const table of REMOTE_TABLES) {
    denied(await anon.from(table).select('id').limit(1))
    denied(await anon.from(table).insert({}))
    denied(await anon.from(table).update({ updated_at: new Date().toISOString() }).eq('id', absent))
    denied(await anon.from(table).delete().eq('id', absent))
  }
  denied(await anon.rpc('record_evaluation', { p_criteria: criteria, p_formula_id: absent }))
  const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
  assert.ok(response.ok)
  const settings = await response.json()
  assert.equal(settings.disable_signup, true, 'Server-side signup must be disabled')
  assert.equal(settings.external?.email, true)
  assert.equal(settings.external?.anonymous_users, false)
  check('anonymous CRUD denied on all 10 tables; RPC denied; public signup disabled')
}

async function login(slot) {
  const email = env[`SECURITY_EMAIL_${slot}`]
  const password = env[`SECURITY_PASSWORD_${slot}`]
  assert.ok(email?.includes('targetfb-security-') && password, 'Dedicated temporary test accounts required')
  const db = client()
  const signed = await db.auth.signInWithPassword({ email, password })
  if (signed.error) throw new Error('Temporary Auth login failed; check local credentials')
  const { user } = requireData(await db.auth.getUser())
  const actor = { db, user, rows: {} }
  actors.push(actor)
  // Never use a real editorial account, or an account with pre-existing records.
  for (const table of REMOTE_TABLES) {
    assert.equal(requireData(await db.from(table).select('id').limit(1)).length, 0, 'Test account is not empty; aborting')
  }
  return actor
}

async function fixtures(actor) {
  await create(actor, 'user_settings', { active_tab: 'positioning' })
  await create(actor, 'strategy', { avatar: run })
  await create(actor, 'offers', { name: run })
  await create(actor, 'formulas', { topic: run, format: 'security-test', layout: 'security-test' })
  await create(actor, 'content_topics', { topic: run, objective: 'authority', strategy_id: actor.rows.strategy.id, suggested_formula_id: actor.rows.formulas.id })
  await create(actor, 'sprints', { start_date: '2026-10-15', goal: 1, offer_id: actor.rows.offers.id })
  await create(actor, 'publications', { title: run, published_on: '2026-10-15', channel: 'security-test', sprint_id: actor.rows.sprints.id, topic_id: actor.rows.content_topics.id, formula_id: actor.rows.formulas.id })
  await create(actor, 'evidence', { publication_id: actor.rows.publications.id, observation: run })
  await create(actor, 'evaluations', { formula_id: actor.rows.formulas.id, criteria, rationale: run })
  await create(actor, 'migration_imports', { dataset_id: randomUUID(), snapshot_sha256: createHash('sha256').update(run).digest('hex'), source_snapshot: { test: run } })
}

async function ownership(a, b) {
  for (const table of REMOTE_TABLES) {
    const own = a.rows[table]
    const other = b.rows[table]
    const visible = requireData(await a.db.from(table).select('id'))
    assert.deepEqual(visible.map((row) => row.id), [own.id])
    assert.equal(requireData(await a.db.from(table).update({ updated_at: new Date().toISOString() }).eq('id', own.id).select()).length, 1)
    assert.deepEqual(requireData(await a.db.from(table).select('id').eq('id', other.id)), [])
    assert.deepEqual(requireData(await a.db.from(table).update({ updated_at: new Date().toISOString() }).eq('id', other.id).select()), [])
    assert.deepEqual(requireData(await a.db.from(table).delete().eq('id', other.id).select()), [])
    denied(await a.db.from(table).update({ user_id: b.user.id }).eq('id', own.id))
    const spoof = { ...own, id: randomUUID(), user_id: b.user.id, legacy_id: `${run}:spoof:${table}` }
    denied(await a.db.from(table).insert(spoof))
  }
  check('authenticated own SELECT/INSERT/UPDATE and cross-user CRUD blocked (one direction)')
}

async function transactions(actor, other) {
  const id = actor.rows.formulas.id
  const args = { p_criteria: criteria, p_rationale: run, p_formula_id: id, p_new_formula_status: 'validated' }
  const formulaEvaluation = await record(actor, args)
  assert.equal(formulaEvaluation.formula_status_before, 'testing')
  assert.equal(formulaEvaluation.formula_status_after, 'validated')
  const status = async () => requireData(await actor.db.from('formulas').select('status').eq('id', id).single()).status
  assert.equal(await status(), 'validated')
  await record(actor, { ...args, p_new_formula_status: 'testing' })
  await record(actor, { p_criteria: criteria, p_publication_id: actor.rows.publications.id, p_rationale: run })
  assert.equal(await status(), 'testing')
  const badPublication = await actor.db.rpc('record_evaluation', { p_criteria: criteria, p_publication_id: actor.rows.publications.id, p_new_formula_status: 'validated' })
  assert.equal(badPublication.error?.code, '23514')
  denied(await actor.db.rpc('record_evaluation', { ...args, p_formula_id: other.rows.formulas.id }))
  const both = await actor.db.rpc('record_evaluation', { ...args, p_publication_id: actor.rows.publications.id })
  assert.equal(both.error?.code, '23514')
  const before = requireData(await actor.db.from('evaluations').select('id').eq('formula_id', id)).length
  const fail = await actor.db.rpc('record_evaluation', { ...args, p_criteria: { version: 0, items: {} } })
  assert.equal(fail.error?.code, '23514')
  assert.equal(requireData(await actor.db.from('evaluations').select('id').eq('formula_id', id)).length, before)
  assert.equal(await status(), 'testing')
  check('real RPC formula transition, publication independence, exclusive target, owner isolation and failed-call atomicity')
  // This proves no changes from a rejected call. Post-INSERT injected UPDATE failure remains a local PG test;
  // do not add triggers or alter production objects to force a failure on the live server.
}

async function cleanup() {
  let failures = 0
  for (const item of [...created].reverse()) {
    try {
      let query = item.actor.db.from(item.table).delete().eq('id', item.id).eq('user_id', item.actor.user.id)
      if (item.marker) query = query.eq('legacy_id', item.marker)
      else if (item.target) query = query.eq('rationale', run)
      const rows = requireData(await query.select('id'))
      assert.equal(rows.length, 1)
    } catch { failures++; console.error(`Cleanup pending: ${item.table}, test record ${item.id}`) }
  }
  for (const actor of actors) await actor.db.auth.signOut({ scope: 'local' })
  assert.equal(failures, 0, 'Some identified test records require cleanup; no broad delete attempted')
  if (created.length) check('own DELETE and exact-ID cleanup of all acknowledged test records')
}

try {
  await anonymous()
  if (!process.argv.includes('--anonymous-only')) {
    if (!env.SECURITY_EMAIL_A || !env.SECURITY_EMAIL_B || !env.SECURITY_PASSWORD_A || !env.SECURITY_PASSWORD_B) {
      console.log('BLOCKED authenticated tests: provision two temporary accounts and configure .env.security.local; never send credentials in chat.')
      process.exitCode = 2
    } else {
      const a = await login('A'); const b = await login('B')
      assert.notEqual(a.user.id, b.user.id)
      await fixtures(a); await fixtures(b)
      await ownership(a, b); await ownership(b, a)
      await transactions(a, b)
    }
  }
} catch {
  console.error('FAIL security checks: validation or access failed; no credentials or raw API responses logged.')
  process.exitCode = 1
} finally {
  try { await cleanup() } catch { process.exitCode = 1 }
  console.log(`Completed check groups: ${checks.length}`)
}
