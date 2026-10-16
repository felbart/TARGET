export const STORAGE_PREFIX = 'ms-hq:'

// Synchronous document repository used by the existing React hook.
// Browser storage is resolved only on use, so importing this module has no side effects.
export function createLocalStorageRepository(getStorage = () => window.localStorage) {
  return {
    read(key, fallback) {
      try {
        const raw = getStorage().getItem(STORAGE_PREFIX + key)
        return raw === null ? fallback : JSON.parse(raw)
      } catch {
        return fallback
      }
    },
    write(key, value) {
      getStorage().setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    },
    exportAll() {
      const storage = getStorage()
      const data = {}
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key.startsWith(STORAGE_PREFIX)) {
          data[key.slice(STORAGE_PREFIX.length)] = JSON.parse(storage.getItem(key))
        }
      }
      return data
    },
    importAll(data) {
      // Retains current explicit backup-import behavior; not a Supabase migration.
      Object.entries(data).forEach(([key, value]) => this.write(key, value))
    },
    clearAll() {
      const storage = getStorage()
      Object.keys(storage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .forEach((key) => storage.removeItem(key))
    },
  }
}
