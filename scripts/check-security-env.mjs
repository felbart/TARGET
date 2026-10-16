import { loadSecurityCredentials, securityEnvStatus } from './security-env.mjs'

// Offline validation only: does not import Supabase, authenticate or execute tests.
try {
  const status = securityEnvStatus(loadSecurityCredentials())
  for (const [name, result] of Object.entries(status)) {
    console.log(`${name}: carregada=${result.loaded}; não vazia=${result.nonEmpty}`)
  }
  if (Object.values(status).some((result) => !result.nonEmpty)) process.exitCode = 2
} catch {
  console.error('Não foi possível validar o arquivo local. Nenhum valor foi exibido.')
  process.exitCode = 1
}
