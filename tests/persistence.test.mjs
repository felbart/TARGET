import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalStorageRepository } from '../src/data-access/localStorageRepository.js'
import { positioningDefaults, pillarsDefaults, offerDefaults, formulaOptions, formulasDefaults } from '../src/data/defaults.js'

function memoryStorage(initial = {}) {
  const storage = { ...initial }
  Object.defineProperties(storage, {
    length: { get: () => Object.keys(storage).length },
    key: { value: (index) => Object.keys(storage)[index] },
    getItem: { value: (key) => storage[key] ?? null },
    setItem: { value: (key, value) => { storage[key] = value } },
    removeItem: { value: (key) => { delete storage[key] } },
  })
  return storage
}

test('existing namespace, references and false test values survive the repository boundary', () => {
  const initial = { 'ms-hq:formulas': '[{"id":"f1","tests":{"leads":false}}]', 'other:key': 'keep' }
  const storage = memoryStorage(initial)
  const repository = createLocalStorageRepository(() => storage)
  assert.deepEqual({ ...storage }, initial, 'constructing the repository must not write')
  const formulas = repository.read('formulas', [])
  repository.write('sprint', { posts: [{ id: 'p1', formulaId: formulas[0].id }] })
  const backup = repository.exportAll()
  assert.equal(backup.formulas[0].tests.leads, false)
  assert.equal(backup.sprint.posts[0].formulaId, 'f1')
  const restored = createLocalStorageRepository(() => storage).read('sprint', null)
  assert.deepEqual(restored, backup.sprint)
  repository.importAll({ activeTab: 'sprint' })
  assert.equal(repository.read('activeTab'), 'sprint')
  assert.deepEqual(repository.read('formulas'), formulas)
  repository.clearAll()
  assert.deepEqual({ ...storage }, { 'other:key': 'keep' })
})

test('legacy fallback behavior is unchanged for missing, malformed or blocked storage', () => {
  const repository = createLocalStorageRepository(() => memoryStorage({ 'ms-hq:bad': '{' }))
  assert.equal(repository.read('missing', 'fallback'), 'fallback')
  assert.equal(repository.read('bad', 'fallback'), 'fallback')
  const blocked = createLocalStorageRepository(() => { throw new Error('blocked') })
  assert.equal(blocked.read('formulas', 'fallback'), 'fallback')
  assert.throws(() => blocked.write('formulas', []), /blocked/)
})

test('all seven local documents remain untouched, including IDs, order, draft and legacy false values', () => {
  const snapshot = {
    activeTab: 'formulas',
    positioning: { ...positioningDefaults, gateTopic: 'Draft', gateLog: [{ id: 'g1', topic: 'Legacy topic', pass: false, at: '2026-10-15T12:00:00Z' }] },
    pillars: pillarsDefaults, offer: offerDefaults, formulaOptions,
    formulas: formulasDefaults,
    sprint: { startDate: '2026-10-15', goal: 50, posts: [{ id: 'p1', formulaId: 'f1', title: 'Post', date: '2026-10-15', link: '', leads: 0 }] },
  }
  const raw = Object.fromEntries(Object.entries(snapshot).map(([key, value]) => ['ms-hq:' + key, JSON.stringify(value)]))
  const storage = memoryStorage(raw)
  const repository = createLocalStorageRepository(() => storage)
  assert.deepEqual(repository.exportAll(), snapshot)
  for (const [key, value] of Object.entries(snapshot)) assert.deepEqual(repository.read(key), value)
  assert.deepEqual({ ...storage }, raw)
})
