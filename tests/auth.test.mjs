import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTH_STORAGE_KEY, createAuthService, clearAuthCallback } from '../src/auth/authService.js'

test('magic links never create users and use a fixed same-origin callback', async () => {
  let sent
  const service = createAuthService({ auth: { signInWithOtp: async (args) => { sent = args; return {} } } })
  await service.sendLink(' user@example.com ', 'https://targetfb.netlify.app')
  assert.deepEqual(sent, { email: 'user@example.com', options: { shouldCreateUser: false, emailRedirectTo: 'https://targetfb.netlify.app/auth/callback' } })
  assert.ok(!AUTH_STORAGE_KEY.startsWith('ms-hq:'))
})

test('restoration validates the user with Auth and logout only clears the local Auth session', async () => {
  let verification = 0
  let scope
  const service = createAuthService({ auth: {
    getSession: async () => ({ data: { session: { user: { id: 'stored' }, expires_at: Date.now() / 1000 + 3600 } } }),
    getUser: async () => { verification++; return { data: { user: { id: 'verified' } } } },
    signOut: async (args) => { scope = args; return {} },
  } })
  assert.equal((await service.restore()).user.id, 'verified')
  assert.equal(verification, 1)
  await service.logout()
  assert.deepEqual(scope, { scope: 'local' })
})

test('invalid sessions and provider errors are sanitized', async () => {
  const service = createAuthService({ auth: {
    getSession: async () => ({ data: { session: {} } }),
    getUser: async () => ({ data: {}, error: { message: 'sensitive-provider-response' } }),
    signInWithOtp: async () => ({ error: { message: 'sensitive-provider-response' } }),
  } })
  await assert.rejects(service.restore(), (error) => !error.message.includes('sensitive'))
  await assert.rejects(service.sendLink('x@example.com', 'http://localhost:5173'), (error) => !error.message.includes('sensitive'))
})

test('callback clears codes/fragments, and normal URLs are preserved', () => {
  const writes = []
  const history = { replaceState: (...args) => writes.push(args) }
  assert.equal(clearAuthCallback({ href: 'https://targetfb.netlify.app/auth/callback?code=one-time' }, history), false)
  assert.deepEqual(writes[0], [null, '', '/'])
  assert.equal(clearAuthCallback({ href: 'http://localhost:5173/auth/callback#error=expired' }, history), true)
  clearAuthCallback({ href: 'http://localhost:5173/' }, history)
  assert.equal(writes.length, 2)
})
