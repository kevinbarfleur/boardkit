import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter, DocumentInfo } from './types'

const DB_NAME = 'boardkit'
const DB_VERSION = 1
const STORE_NAME = 'documents'

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

export const indexedDBStorage: StorageAdapter = {
  async save(id: string, data: unknown): Promise<void> {
    const db = await getDB()
    await db.put(STORE_NAME, data, id)
  },

  async load(id: string): Promise<unknown | null> {
    const db = await getDB()
    const data = await db.get(STORE_NAME, id)
    return data ?? null
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
  },

  async list(): Promise<string[]> {
    const db = await getDB()
    const keys = await db.getAllKeys(STORE_NAME)
    return keys as string[]
  },

  async exists(id: string): Promise<boolean> {
    const db = await getDB()
    const data = await db.get(STORE_NAME, id)
    return data !== undefined
  },
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  const db = await getDB()
  const keys = await db.getAllKeys(STORE_NAME)
  const docs: DocumentInfo[] = []

  for (const key of keys) {
    const data = await db.get(STORE_NAME, key)
    if (data && typeof data === 'object' && 'meta' in data) {
      const meta = (data as { meta: { title: string; updatedAt: number } }).meta
      docs.push({
        id: key as string,
        title: meta.title,
        updatedAt: meta.updatedAt,
      })
    }
  }

  return docs.sort((a, b) => b.updatedAt - a.updatedAt)
}
