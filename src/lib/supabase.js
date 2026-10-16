import { createClient } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY } from '../auth/authService.js'

let client

// Auth uses this client; editorial persistence remains explicitly local.
export function getSupabaseClient() {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.')
  }
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('A URL remota do Supabase deve usar HTTPS.')
  }
  // Accept only the public publishable-key format. Legacy JWT/secret keys are rejected.
  if (!key.startsWith('sb_publishable_')) {
    throw new Error('Use uma chave pública sb_publishable_, nunca secret ou service_role.')
  }
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
      flowType: 'pkce', storageKey: AUTH_STORAGE_KEY },
  })
  return client
}
