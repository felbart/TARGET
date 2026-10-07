import { useEffect, useState } from 'react'

// Novo namespace após o reposicionamento para identidade visual + sites (os dados antigos ficam em `b2c-hq:`).
export const STORAGE_PREFIX = 'ms-hq:'

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** useState persistido no localStorage (namespace `ms-hq:`). */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() =>
    read(key, typeof initialValue === 'function' ? initialValue() : initialValue),
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
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
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k.startsWith(STORAGE_PREFIX)) data[k.slice(STORAGE_PREFIX.length)] = JSON.parse(localStorage.getItem(k))
  }
  return data
}

export function importAll(data) {
  Object.entries(data).forEach(([k, v]) => localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)))
}

export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}
