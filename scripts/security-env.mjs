import { readFileSync } from 'node:fs'

export const SECURITY_VARIABLES = Object.freeze([
  'SECURITY_EMAIL_A', 'SECURITY_PASSWORD_A', 'SECURITY_EMAIL_B', 'SECURITY_PASSWORD_B',
])

// Dedicated literal format, NOT dotenv: # is a comment only on a full comment line.
// No interpolation, inline comments, unescaping or password trimming.
export function parseSecurityEnv(text) {
  const values = {}
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue
    const match = line.match(/^\s*([A-Z_]+)\s*=(.*)$/)
    if (!match || !SECURITY_VARIABLES.includes(match[1])) continue
    const [, name, raw] = match
    if (Object.hasOwn(values, name)) throw new Error(`Variável duplicada: ${name}.`)
    // Optional matching outer quotes act as delimiters; interior characters remain literal.
    const quoted = raw.length >= 2 && ['"', "'"].includes(raw[0]) && raw.at(-1) === raw[0]
    const value = quoted ? raw.slice(1, -1) : raw
    values[name] = name.startsWith('SECURITY_EMAIL_') ? value.trim() : value
  }
  return values
}

export function loadSecurityCredentials(path = '.env.security.local') {
  let text
  try { text = readFileSync(path, 'utf8') }
  catch (error) {
    if (error.code === 'ENOENT') return {}
    throw new Error('Não foi possível ler o arquivo local de credenciais.')
  }
  return parseSecurityEnv(text)
}

export function securityEnvStatus(values) {
  return Object.fromEntries(SECURITY_VARIABLES.map((name) => [name, {
    loaded: Object.hasOwn(values, name),
    nonEmpty: typeof values[name] === 'string' && values[name].trim().length > 0,
  }]))
}
