import { createLocalStorageRepository } from './localStorageRepository'

// Intentionally fixed to localStorage. Environment configuration never switches providers.
export const localRepository = createLocalStorageRepository()
