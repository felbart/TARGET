import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase'
import { createAuthService, clearAuthCallback } from './authService'
import { watchSession } from './sessionMonitor'
import { Button, Card, Field, Input } from '../components/ui'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
let service
function getService() {
  return service ??= createAuthService(getSupabaseClient())
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let monitor
    const visible = () => { if (document.visibilityState === 'visible') void monitor?.recheck() }
    try {
      monitor = watchSession(getService(), (state) => {
        setSession(state.session)
        setLoading(state.loading)
        setError(state.error)
        if (!state.loading && clearAuthCallback(window.location, window.history)) {
          setError('O link expirou ou é inválido. Solicite outro link.')
        }
      })
      document.addEventListener('visibilitychange', visible)
    } catch {
      setError('Configure as variáveis públicas do Supabase para habilitar o login.')
      setLoading(false)
    }
    return () => { monitor?.stop(); document.removeEventListener('visibilitychange', visible) }
  }, [retry])

  const send = async (event) => {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      await getService().sendLink(email, window.location.origin)
      setMessage('Se o e-mail estiver autorizado, você receberá um link. Abra-o neste navegador. Confira também o spam.')
    } catch { setError('Não foi possível enviar o link. Confira o e-mail ou tente novamente mais tarde.') }
    finally { setBusy(false) }
  }
  const logout = async () => {
    setBusy(true); setError('')
    try { await getService().logout(); setSession(null) }
    catch { setError('Não foi possível sair. Tente novamente.') }
    finally { setBusy(false) }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-zinc-400" role="status">Verificando sessão…</main>
  if (session) return (
    <AuthContext.Provider value={{ user: session.user, logout, busy }}>
      {error && <p role="alert" className="bg-rose-950 p-3 text-center text-sm text-rose-200">{error}</p>}
      {children}
    </AuthContext.Provider>
  )
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
      <Card className="w-full" title="Entrar no TargetFB" subtitle="Estratégia, repertório e experimentação editorial.">
        <div className="mb-6 font-mono text-xs uppercase tracking-widest text-emerald-400">M+S · Acesso pessoal</div>
        <form onSubmit={send} className="grid gap-4">
          <Field label="E-mail autorizado">
            <Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" disabled={busy} />
          </Field>
          <Button type="submit" variant="primary" disabled={busy} className="justify-center">{busy ? 'Enviando…' : 'Receber link de acesso'}</Button>
          {message && <p role="status" className="text-sm text-emerald-200">{message}</p>}
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {error && <Button variant="ghost" disabled={busy} onClick={() => setRetry((value) => value + 1)}>Verificar sessão novamente</Button>}
        </form>
        <p className="mt-6 text-xs leading-relaxed text-zinc-500">Acesso sem senha, somente para a conta autorizada. Seus dados editoriais continuam neste navegador.</p>
      </Card>
    </main>
  )
}
