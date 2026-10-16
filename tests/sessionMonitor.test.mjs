import test from 'node:test'
import assert from 'node:assert/strict'
import { watchSession } from '../src/auth/sessionMonitor.js'
import { AUTH_STORAGE_KEY, createAuthService } from '../src/auth/authService.js'

const flush = () => new Promise((resolve) => setImmediate(resolve))
function fixture() {
  let clock = 1000000
  let sequence = 0
  let listener
  let restore = async () => null
  const states = []
  const timers = new Map()
  const service = {
    restore: () => restore(),
    subscribe(callback) { listener = callback; return { unsubscribe() { listener = null } } },
  }
  const monitor = watchSession(service, (state) => states.push(state), {
    now: () => clock,
    setTimer(callback, delay) { const id = ++sequence; timers.set(id, { callback, at: clock + delay }); return id },
    clearTimer(id) { timers.delete(id) },
  })
  return { monitor, states, setRestore(callback) { restore = callback },
    event(name) { listener?.(name) },
    async advance(ms) {
      clock += ms
      const due = [...timers].filter(([, item]) => item.at <= clock)
      for (const [id, item] of due) { timers.delete(id); item.callback() }
      await flush()
    },
    session(seconds = 10) { return { user: { id: 'test-user' }, expires_at: clock / 1000 + seconds } },
    latest() { return states.at(-1) },
  }
}

test('no session blocks internal screens; sign-in and remount restore verified session', async () => {
  const f = fixture()
  await flush()
  assert.deepEqual(f.latest(), { session: null, loading: false, error: '' })
  const session = f.session()
  f.setRestore(async () => session)
  f.event('SIGNED_IN')
  await f.advance(0)
  assert.equal(f.latest().session, session)
  f.monitor.stop()
  const restored = []
  const monitor = watchSession({ restore: async () => session, subscribe: () => ({ unsubscribe() {} }) }, (state) => restored.push(state), { now: () => 1000000 })
  await flush()
  assert.equal(restored.at(-1).session, session)
  monitor.stop()
})

test('expired session closes access when refresh fails; valid refresh reschedules expiry', async () => {
  const f = fixture()
  await flush()
  f.setRestore(async () => f.session(2))
  await f.monitor.recheck()
  const renewed = f.session(20)
  f.setRestore(async () => renewed)
  f.event('TOKEN_REFRESHED')
  await f.advance(0)
  await f.advance(2000)
  assert.equal(f.latest().session, renewed)
  f.setRestore(async () => { throw new Error('private upstream detail') })
  await f.advance(18000)
  assert.equal(f.latest().session, null)
  assert.equal(f.latest().loading, false)
  assert.ok(f.latest().error.includes('sessão'))
  assert.ok(!f.latest().error.includes('private'))
  f.monitor.stop()
})

test('sign-out wins over in-flight restoration; stopped monitor ignores late results', async () => {
  const f = fixture()
  await flush()
  const session = f.session()
  let resolve
  f.setRestore(() => new Promise((done) => { resolve = done }))
  const pending = f.monitor.recheck()
  f.event('SIGNED_OUT')
  resolve(session)
  await pending
  assert.equal(f.latest().session, null)
  const stopped = f.monitor.recheck()
  f.monitor.stop()
  const count = f.states.length
  resolve(session)
  await stopped
  assert.equal(f.states.length, count)
})

test('login, reload, expiry and logout preserve all seven editorial storage documents', async () => {
  const keys = ['activeTab', 'positioning', 'pillars', 'offer', 'formulaOptions', 'formulas', 'sprint']
  const storage = new Map(keys.map((key) => [`ms-hq:${key}`, JSON.stringify({ sentinel: key })]))
  const before = [...storage]
  let event
  const client = { auth: {
    getSession: async () => ({ data: { session: JSON.parse(storage.get(AUTH_STORAGE_KEY) ?? 'null') } }),
    getUser: async () => ({ data: { user: { id: 'test-user' } } }),
    onAuthStateChange(callback) { event = callback; return { data: { subscription: { unsubscribe() {} } } } },
    async signOut() { storage.delete(AUTH_STORAGE_KEY); event('SIGNED_OUT'); return {} },
  } }
  const service = createAuthService(client)
  const states = []
  const monitor = watchSession(service, (state) => states.push(state))
  await flush()
  assert.equal(states.at(-1).session, null)
  storage.set(AUTH_STORAGE_KEY, JSON.stringify({ user: { id: 'test-user' }, expires_at: Date.now() / 1000 + 3600 }))
  await monitor.recheck()
  assert.equal(states.at(-1).session.user.id, 'test-user')
  assert.ok(await service.restore(), 'session survives another restoration')
  storage.set(AUTH_STORAGE_KEY, JSON.stringify({ user: { id: 'test-user' }, expires_at: 1 }))
  await monitor.recheck()
  assert.equal(states.at(-1).session, null)
  await service.logout()
  assert.equal(states.at(-1).session, null)
  assert.deepEqual([...storage], before)
  monitor.stop()
})
