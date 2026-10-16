import { useEffect, useState } from 'react'
import { localRepository } from '../data-access'
export { STORAGE_PREFIX } from '../data-access/localStorageRepository'

// Novo namespace após o reposicionamento para identidade visual + sites (os dados antigos ficam em `b2c-hq:`).

/** useState persistido no localStorage (namespace `ms-hq:`). */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() =>
    localRepository.read(key, typeof initialValue === 'function' ? initialValue() : initialValue),
  )

  useEffect(() => {
    try {
      localRepository.write(key, value)
    } catch {
      /* quota cheia ou storage bloqueado: segue só em memória */
    }
  }, [key, value])

  return [value, setValue]
}

/** Atualiza um campo de um objeto de estado: patch(setState)('campo', valor). */
export const patch = (setState) => (field, val) =>
  setState((prev) => ({ ...prev, [field]: val }))

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function exportAll() {
  return localRepository.exportAll()
}

export function importAll(data) {
  localRepository.importAll(data)
}

export function clearAll() {
  localRepository.clearAll()
}
