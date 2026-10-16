// Auth depends only on the Auth client, never on editorial repositories.
export const AUTH_STORAGE_KEY = 'targetfb-auth-v1'

export function createAuthService(client) {
  return {
    subscribe(callback) {
      return client.auth.onAuthStateChange(callback).data.subscription
    },
    async restore() {
      const { data, error } = await client.auth.getSession()
      if (error) throw new Error('Não foi possível restaurar a sessão. Tente entrar novamente.')
      if (!data.session) return null
      const verified = await client.auth.getUser()
      if (verified.error || !verified.data.user) {
        throw new Error('Não foi possível verificar a sessão. Entre novamente ou confira sua conexão.')
      }
      if (!Number.isFinite(data.session.expires_at) || data.session.expires_at * 1000 <= Date.now()) {
        throw new Error('Sua sessão expirou. Solicite um novo link de acesso.')
      }
      return { ...data.session, user: verified.data.user }
    },
    async sendLink(email, origin) {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: new URL('/auth/callback', origin).href },
      })
      // Do not disclose whether an address is registered, or render raw Auth responses.
      if (error) throw new Error('Não foi possível enviar o link. Verifique o e-mail e tente novamente mais tarde.')
    },
    async logout() {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw new Error('Não foi possível sair. Tente novamente.')
    },
  }
}

export function clearAuthCallback(location, history) {
  const url = new URL(location.href)
  const failed = url.searchParams.has('error') || url.hash.includes('error=')
  if (url.pathname === '/auth/callback') {
    // Remove one-time codes, token fragments and provider errors from the address bar.
    history.replaceState(null, '', '/')
  }
  return failed
}
