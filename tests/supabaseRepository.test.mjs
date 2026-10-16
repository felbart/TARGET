import test from 'node:test'
import assert from 'node:assert/strict'
import { createSupabaseRepository, REMOTE_TABLES } from '../src/data-access/supabaseRepository.js'

test('remote repository is lazy and refuses unknown tables, invalid pagination and identity updates', () => {
  let calls = 0
  const repository = createSupabaseRepository(() => { calls++; throw new Error('unexpected connection') })
  assert.equal(calls, 0)
  assert.equal(REMOTE_TABLES.length, 10)
  assert.throws(() => repository.list('auth.users'), /permitida/)
  assert.throws(() => repository.list('positionings'), /permitida/)
  assert.throws(() => repository.list('formulas', { limit: 1001 }), /Paginação/)
  assert.throws(() => repository.update('formulas', 'id', { user_id: 'other-user' }), /Identidade/)
  assert.throws(() => repository.update('formulas', 'id', { status: 'validated' }), /recordEvaluation/)
  assert.throws(() => repository.insert('evaluations', {}), /recordEvaluation/)
  assert.throws(() => repository.recordEvaluation({}), /exclusivamente/)
  assert.throws(() => repository.recordEvaluation({ publicationId: 'p', formulaId: 'f' }), /exclusivamente/)
  assert.throws(() => repository.recordEvaluation({ publicationId: 'p', newFormulaStatus: 'validated' }), /não altera/)
  assert.equal(calls, 0)
})

test('evaluation and explicit formula status are sent in one RPC, with no implicit timestamp or status', async () => {
  const calls = []
  const repository = createSupabaseRepository(() => ({
    rpc: async (name, args) => { calls.push({ name, args }); return { data: args, error: null } },
  }))
  const criteria = { version: 1, items: { performance: { passed: null } } }
  const result = await repository.recordEvaluation({ formulaId: 'f', criteria,
    decision: 'adjust', rationale: 'Why', learning: 'Learned', nextAdjustment: 'Next',
    newFormulaStatus: 'testing' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'record_evaluation')
  assert.equal(result.p_formula_id, 'f')
  assert.equal(result.p_new_formula_status, 'testing')
  assert.equal(result.p_learning, 'Learned')
  assert.deepEqual(result.p_criteria, criteria)
  assert.ok(!('p_evaluated_at' in result))
  const publication = await repository.recordEvaluation({ publicationId: 'p', criteria })
  assert.equal(publication.p_new_formula_status, null)
  assert.equal(publication.p_formula_id, null)
})

test('list honors editorial ordering and deterministic pagination', async () => {
  const calls = []
  const query = {
    select() { return this },
    order(column, options) { calls.push([column, options]); return this },
    async range(start, end) { calls.push([start, end]); return { data: [], error: null } },
  }
  const repository = createSupabaseRepository(() => ({ from: () => query }))
  assert.deepEqual(await repository.list('formulas', { offset: 20, limit: 10 }), [])
  assert.deepEqual(calls, [['sort_order', { ascending: true, nullsFirst: false }], ['id', undefined], [20, 29]])
})

test('remote repository returns rows and propagates API errors instead of hiding failures', async () => {
  const failure = { message: 'RLS denied', code: '42501' }
  const repository = createSupabaseRepository(() => ({
    from: () => ({
      select: () => ({
        eq: (_, id) => ({ maybeSingle: async () => id === 'own'
          ? { data: { id }, error: null }
          : { data: null, error: failure } }),
      }),
    }),
  }))
  assert.deepEqual(await repository.get('formulas', 'own'), { id: 'own' })
  await assert.rejects(repository.get('formulas', 'other'), (error) => error === failure)
})
