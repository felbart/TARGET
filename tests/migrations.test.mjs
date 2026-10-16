import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { REMOTE_TABLES } from '../src/data-access/supabaseRepository.js'
import { pillarsDefaults, offerDefaults, formulaOptions } from '../src/data/defaults.js'

// Real ephemeral PostgreSQL; auth roles/claims are simulated, not remote Supabase.
const A = '00000000-0000-4000-8000-000000000001'
const B = '00000000-0000-4000-8000-000000000002'
const criteria = { version: 1, items: {
  performance: { passed: false }, leads: { passed: false },
  sustainability: { passed: false }, aesthetics: { passed: false },
} }
const sqlError = (code) => (error) => error.code === code

test('hybrid migrations, RLS, references, JSONB and transactional evaluations', async (t) => {
  const db = new PGlite()
  const ids = {}
  const as = async (user) => db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${user ?? ''}', false);`)
  const insert = async (table, values) => {
    const keys = Object.keys(values)
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(',')
    return (await db.query(`insert into public.${table} (${keys.join(',')}) values (${placeholders}) returning *`, Object.values(values))).rows[0]
  }
  const countEvaluations = async () => Number((await db.query('select count(*) as n from public.evaluations')).rows[0].n)
  const rpc = (formulaId, publicationId, newStatus = null, extra = {}) => db.query(
    'select * from public.record_evaluation(p_criteria => $1, p_formula_id => $2, p_publication_id => $3, p_new_formula_status => $4, p_decision => $5, p_learning => $6)',
    [JSON.stringify(extra.criteria ?? criteria), formulaId, publicationId, newStatus, extra.decision ?? 'repeat', 'Aprendizado'],
  )
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${A}'), ('${B}');
    `)
    const directory = new URL('../supabase/migrations/', import.meta.url)
    for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
      await db.exec(await readFile(new URL(file, directory), 'utf8'))
    }
    const { rows: tables } = await db.query("select tablename from pg_tables where schemaname = 'public'")
    assert.deepEqual(tables.map((row) => row.tablename).sort(), [...REMOTE_TABLES].sort())
    assert.equal(tables.length, 10)
    const security = await db.query("select relrowsecurity, relforcerowsecurity from pg_class join pg_namespace n on n.oid = relnamespace where n.nspname = 'public' and relkind = 'r'")
    assert.ok(security.rows.every((row) => row.relrowsecurity && row.relforcerowsecurity))
    for (const user of [A, B]) {
      await as(user)
      const own = ids[user] = {}
      for (const [table, values] of [
        ['user_settings', { formula_options: JSON.stringify(formulaOptions) }],
        ['strategy', { pillars: JSON.stringify(pillarsDefaults), gate_draft: JSON.stringify({ gateTopic: 'Draft', gateDecider: false, gateAuthority: false }) }],
        ['offers', { name: 'Test', is_core: true, deliverables: JSON.stringify(offerDefaults.deliverables), ctas: JSON.stringify(offerDefaults.ctas), funnel_assumptions: JSON.stringify(offerDefaults.funnel) }],
        ['formulas', { topic: 'Test', format: 'Test', layout: 'Test' }],
      ]) own[table] = (await insert(table, values)).id
      own.content_topics = (await insert('content_topics', { topic: 'Test', objective: 'authority', editorial_approach: 'educational', strategy_id: own.strategy, suggested_formula_id: own.formulas })).id
      own.sprints = (await insert('sprints', { start_date: '2026-10-15', goal: 50, offer_id: own.offers })).id
      own.publications = (await insert('publications', { sprint_id: own.sprints, formula_id: own.formulas, topic_id: own.content_topics, published_on: '2026-10-15', title: 'Test', channel: 'unknown', leads: 0 })).id
      own.evidence = (await insert('evidence', { publication_id: own.publications, observation: 'Qualitative evidence' })).id
      own.evaluations = (await insert('evaluations', { formula_id: own.formulas, criteria: JSON.stringify(criteria), origin: 'legacy_import', evaluated_at: null, legacy_payload: JSON.stringify({ status: 'testing', notes: '' }) })).id
      own.migration_imports = (await insert('migration_imports', { dataset_id: A, snapshot_sha256: 'a'.repeat(64), source_snapshot: '{}' })).id
    }
    await as(A)
    await t.test('CRUD owner isolation on every table, including ownership transfer and forged inserts', async () => {
      for (const { tablename: name } of tables) {
        assert.deepEqual((await db.query(`select user_id from public.${name}`)).rows.map((row) => row.user_id), [A])
        assert.equal((await db.query(`update public.${name} set updated_at = now() where id = $1 returning id`, [ids[A][name]])).rows.length, 1)
        assert.equal((await db.query(`update public.${name} set updated_at = now() where id = $1 returning id`, [ids[B][name]])).rows.length, 0)
        assert.equal((await db.query(`delete from public.${name} where id = $1 returning id`, [ids[B][name]])).rows.length, 0)
        await assert.rejects(db.query(`update public.${name} set user_id = $1 where id = $2`, [B, ids[A][name]]), sqlError('42501'))
        await assert.rejects(db.query(`insert into public.${name} select * from jsonb_populate_record(null::public.${name}, (select to_jsonb(t) from public.${name} t limit 1) || jsonb_build_object('id', gen_random_uuid(), 'user_id', $1::uuid))`, [B]), sqlError('42501'))
      }
    })
    await t.test('all relationship paths enforce owner and prevent accidental referenced deletion', async () => {
      for (const [table, column, parent] of [
        ['content_topics', 'strategy_id', 'strategy'], ['content_topics', 'suggested_formula_id', 'formulas'],
        ['sprints', 'offer_id', 'offers'], ['publications', 'formula_id', 'formulas'],
        ['publications', 'sprint_id', 'sprints'], ['publications', 'topic_id', 'content_topics'],
        ['evidence', 'publication_id', 'publications'], ['evaluations', 'formula_id', 'formulas'],
      ]) await assert.rejects(db.query(`update public.${table} set ${column} = $1 where id = $2`, [ids[B][parent], ids[A][table]]), sqlError('23503'))
      await assert.rejects(insert('evaluations', { publication_id: ids[B].publications, criteria: JSON.stringify(criteria) }), sqlError('23503'))
      for (const name of ['strategy', 'offers', 'formulas', 'content_topics', 'sprints', 'publications']) {
        await assert.rejects(db.query(`delete from public.${name} where id = $1`, [ids[A][name]]), sqlError('23503'))
      }
      const another = await insert('formulas', { topic: 'Different', format: 'F', layout: 'L' })
      await db.query('update public.publications set formula_id = $1 where id = $2', [another.id, ids[A].publications])
      assert.equal((await db.query('select suggested_formula_id from public.content_topics where id = $1', [ids[A].content_topics])).rows[0].suggested_formula_id, ids[A].formulas)
      await db.query('update public.publications set formula_id = $1 where id = $2', [ids[A].formulas, ids[A].publications])
      await db.query('delete from public.formulas where id = $1', [another.id])
    })
    await t.test('exclusive evaluation target, editorial objectives, channel and versioned criteria', async () => {
      const values = { criteria: JSON.stringify(criteria) }
      await assert.rejects(insert('evaluations', values), sqlError('23514'))
      await assert.rejects(insert('evaluations', { ...values, publication_id: ids[A].publications, formula_id: ids[A].formulas }), sqlError('23514'))
      await assert.rejects(insert('evaluations', { ...values, formula_id: ids[A].formulas, evaluated_at: null }), sqlError('23514'))
      for (const objective of ['discovery', 'authority', 'conversion']) await insert('content_topics', { topic: objective, objective })
      await assert.rejects(insert('content_topics', { topic: 'Missing objective' }), sqlError('23502'))
      await assert.rejects(insert('content_topics', { topic: 'Test', objective: 'educational' }), sqlError('23514'))
      await assert.rejects(db.query("update public.publications set channel = '   ' where id = $1", [ids[A].publications]), sqlError('23514'))
      await assert.rejects(db.query('update public.publications set channel = null where id = $1', [ids[A].publications]), sqlError('23502'))
      for (const invalid of [{}, { version: 0, items: {} }, { version: '1', items: {} }, { version: 1, items: [] }, { version: 1, items: { x: { passed: 'yes' } } }]) {
        await assert.rejects(insert('evaluations', { formula_id: ids[A].formulas, criteria: JSON.stringify(invalid) }), sqlError('23514'))
      }
      await insert('evaluations', { formula_id: ids[A].formulas, criteria: JSON.stringify({ version: 2, items: { new_criterion: { passed: null, rationale: 'Not yet assessed' } } }) })
    })
    await t.test('legacy JSON collections, false values, dates and missing metrics are preserved', async () => {
      assert.deepEqual((await db.query('select pillars from public.strategy')).rows[0].pillars, pillarsDefaults)
      assert.deepEqual((await db.query('select formula_options from public.user_settings')).rows[0].formula_options, formulaOptions)
      const offer = (await db.query('select deliverables, ctas, funnel_assumptions from public.offers')).rows[0]
      assert.deepEqual(offer.deliverables, offerDefaults.deliverables)
      assert.deepEqual(offer.ctas, offerDefaults.ctas)
      assert.deepEqual(offer.funnel_assumptions, offerDefaults.funnel)
      const legacy = (await db.query('select * from public.evaluations where id = $1', [ids[A].evaluations])).rows[0]
      assert.equal(legacy.evaluated_at, null)
      assert.deepEqual(legacy.criteria, criteria)
      assert.equal((await db.query('select leads from public.publications where id = $1', [ids[A].publications])).rows[0].leads, 0)
      const pub = await insert('publications', { title: 'No metrics', channel: 'newsletter', published_on: '2026-10-15', formula_id: ids[A].formulas })
      assert.equal(pub.leads, null)
      assert.deepEqual((await db.query('select metrics from public.evidence where id = $1', [ids[A].evidence])).rows[0].metrics, {})
      const measured = await insert('evidence', { publication_id: pub.id, metrics: JSON.stringify({ views: { value: 0, unit: 'count' } }) })
      assert.equal(measured.metrics.views.value, 0)
      assert.ok(!('retention' in measured.metrics))
      await assert.rejects(insert('evidence', { publication_id: pub.id, metrics: '[]' }), sqlError('23514'))
      await assert.rejects(db.query("update public.strategy set pillars = '[]' where id = $1", [ids[A].strategy]), sqlError('23514'))
    })
    await t.test('import history identifies user + dataset + snapshot and preserves retry uniqueness', async () => {
      await insert('migration_imports', { dataset_id: A, snapshot_sha256: 'b'.repeat(64), source_snapshot: '{}' })
      await assert.rejects(insert('migration_imports', { dataset_id: A, snapshot_sha256: 'a'.repeat(64), source_snapshot: '{}' }), sqlError('23505'))
      await assert.rejects(insert('migration_imports', { dataset_id: A, snapshot_sha256: 'c'.repeat(64), source_snapshot: '{}', state: 'verified' }), sqlError('23514'))
      await db.query('update public.formulas set legacy_id = $1 where id = $2', ['stable-source-id', ids[A].formulas])
      await assert.rejects(insert('formulas', { topic: 'T', format: 'F', layout: 'L', legacy_id: 'stable-source-id' }), sqlError('23505'))
    })
    await t.test('RPC records dated history, changes status explicitly, and never validates from a publication', async () => {
      const evaluation = (await rpc(ids[A].formulas, null, 'validated')).rows[0]
      assert.equal(evaluation.formula_status_before, 'testing')
      assert.equal(evaluation.formula_status_after, 'validated')
      assert.ok(evaluation.evaluated_at)
      assert.equal(evaluation.learning, 'Aprendizado')
      assert.equal((await db.query('select status from public.formulas where id = $1', [ids[A].formulas])).rows[0].status, 'validated')
      await rpc(ids[A].formulas, null, 'testing')
      await rpc(null, ids[A].publications)
      assert.equal((await db.query('select status from public.formulas where id = $1', [ids[A].formulas])).rows[0].status, 'testing')
      const before = await countEvaluations()
      await assert.rejects(rpc(null, ids[A].publications, 'validated'), sqlError('23514'))
      await assert.rejects(rpc(ids[B].formulas, null, 'validated'), sqlError('42501'))
      await assert.rejects(rpc(null, ids[B].publications), sqlError('42501'))
      await assert.rejects(rpc(ids[A].formulas, ids[A].publications), sqlError('23514'))
      await assert.rejects(rpc(null, null), sqlError('23514'))
      await assert.rejects(rpc(ids[A].formulas, null, 'invalid'), sqlError('23514'))
      assert.equal(await countEvaluations(), before)
    })
    await t.test('a failure during status UPDATE rolls back the already inserted evaluation', async () => {
      const before = await countEvaluations()
      await db.exec(`reset role;
        create function public.test_reject_update() returns trigger language plpgsql as $$ begin raise exception 'Injected update failure'; end $$;
        create trigger test_failure before update on public.formulas for each row execute function public.test_reject_update();`)
      await as(A)
      await assert.rejects(rpc(ids[A].formulas, null, 'validated'), /Injected update failure/)
      assert.equal(await countEvaluations(), before)
      assert.equal((await db.query('select status from public.formulas where id = $1', [ids[A].formulas])).rows[0].status, 'testing')
      await db.exec('reset role; drop trigger test_failure on public.formulas; drop function public.test_reject_update();')
    })
    await t.test('no session and anon have no data or RPC access', async () => {
      await as(null)
      for (const { tablename: name } of tables) assert.equal((await db.query(`select * from public.${name}`)).rows.length, 0)
      await assert.rejects(rpc(ids[A].formulas, null), sqlError('42501'))
      await db.exec('reset role; set role anon;')
      for (const { tablename: name } of tables) {
        await assert.rejects(db.query(`select * from public.${name}`), sqlError('42501'))
        await assert.rejects(db.query(`update public.${name} set updated_at = now()`), sqlError('42501'))
        await assert.rejects(db.query(`delete from public.${name}`), sqlError('42501'))
      }
      await assert.rejects(rpc(ids[A].formulas, null), sqlError('42501'))
    })
  } finally { await db.close() }
})
