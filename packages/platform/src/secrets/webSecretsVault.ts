/**
 * Web Secrets Vault Implementation
 *
 * Stores secrets in IndexedDB, separate from document storage.
 * Secrets are stored as key-value pairs in a dedicated object store.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { SecretsVault } from '@boardkit/core'

const DB_NAME = 'boardkit-secrets'
const DB_VERSION = 1
const STORE_NAME = 'secrets'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

/**
 * Web implementation of SecretsVault using IndexedDB.
 */
export const webSecretsVault: SecretsVault = {
  async get(key: string): Promise<string | null> {
    const db = await getDB()
    const value = await db.get(STORE_NAME, key)
    return value ?? null
  },

  async set(key: string, value: string): Promise<void> {
    const db = await getDB()
    await db.put(STORE_NAME, value, key)
  },

  async delete(key: string): Promise<void> {
    const db = await getDB()
    await db.delete(STORE_NAME, key)
  },

  async listKeys(): Promise<string[]> {
    const db = await getDB()
    const keys = await db.getAllKeys(STORE_NAME)
    return keys as string[]
  },

  async has(key: string): Promise<boolean> {
    const db = await getDB()
    const value = await db.get(STORE_NAME, key)
    return value !== undefined
  },

  async clear(): Promise<void> {
    const db = await getDB()
    await db.clear(STORE_NAME)
  },
}
