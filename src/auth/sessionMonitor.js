const SESSION_ERROR = 'Sua sessão expirou ou não pôde ser verificada. Entre novamente ou confira sua conexão.'

// No storage access here: session lifecycle is independent from editorial persistence.
export function watchSession(service, onChange, {
  now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout,
} = {}) {
  let active = true
  let revision = 0
  let timer
  let deferred
  let state = { session: null, loading: true, error: '' }
  const emit = (next) => { state = next; if (active) onChange(next) }
  const expired = (session) => session && session.expires_at * 1000 <= now()
  const schedule = () => {
    clearTimer(timer)
    if (state.session) {
      const delay = Math.min(2147483647, Math.max(0, state.session.expires_at * 1000 - now()))
      timer = setTimer(() => { if (active) void recheck() }, delay)
    }
  }
  async function recheck() {
    if (!active) return
    const current = ++revision
    if (!state.session || expired(state.session)) {
      emit({ session: null, loading: true, error: '' })
    }
    try {
      const session = await service.restore()
      if (!active || current !== revision) return
      if (session && (!Number.isFinite(session.expires_at) || expired(session))) throw new Error(SESSION_ERROR)
      emit({ session, loading: false, error: '' })
      schedule()
    } catch {
      if (active && current === revision) {
        clearTimer(timer)
        emit({ session: null, loading: false, error: SESSION_ERROR })
      }
    }
  }
  const subscription = service.subscribe((event) => {
    if (!active) return
    if (event === 'SIGNED_OUT') {
      revision++
      clearTimer(timer)
      clearTimer(deferred)
      emit({ session: null, loading: false, error: '' })
    } else if (event !== 'INITIAL_SESSION') {
      // Leave Supabase Auth's internal lock before calling getSession/getUser.
      clearTimer(deferred)
      deferred = setTimer(() => { if (active) void recheck() }, 0)
    }
  })
  void recheck()
  return {
    recheck,
    stop() {
      active = false
      revision++
      clearTimer(timer)
      clearTimer(deferred)
      subscription.unsubscribe()
    },
  }
}
