import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter, DocumentInfo } from './types'

const DB_NAME = 'boardkit'
const DB_VERSION = 3
const STORE_NAME = 'documents'
const HISTORY_STORE = 'history'
const ASSETS_STORE = 'assets'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' })
          historyStore.createIndex('documentId', 'documentId')
          historyStore.createIndex('timestamp', 'timestamp')
        }
        // v3: Add assets store for binary files (images)
        if (oldVersion < 3 && !db.objectStoreNames.contains(ASSETS_STORE)) {
          const assetsStore = db.createObjectStore(ASSETS_STORE, { keyPath: 'id' })
          assetsStore.createIndex('documentId', 'documentId')
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

// History entry type
export interface HistoryEntry {
  id: string
  documentId: string
  timestamp: number
  action: string
  snapshot: unknown
}

// History storage functions
export const historyStorage = {
  async save(entry: HistoryEntry): Promise<void> {
    const db = await getDB()
    await db.put(HISTORY_STORE, entry)
  },

  async getByDocument(documentId: string): Promise<HistoryEntry[]> {
    const db = await getDB()
    const index = db.transaction(HISTORY_STORE).store.index('documentId')
    const entries = await index.getAll(documentId)
    return entries.sort((a, b) => b.timestamp - a.timestamp)
  },

  async get(id: string): Promise<HistoryEntry | null> {
    const db = await getDB()
    const entry = await db.get(HISTORY_STORE, id)
    return entry ?? null
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(HISTORY_STORE, id)
  },

  async deleteByDocument(documentId: string): Promise<void> {
    const db = await getDB()
    const index = db.transaction(HISTORY_STORE, 'readwrite').store.index('documentId')
    const keys = await index.getAllKeys(documentId)
    const tx = db.transaction(HISTORY_STORE, 'readwrite')
    for (const key of keys) {
      await tx.store.delete(key)
    }
    await tx.done
  },

  async pruneOldEntries(documentId: string, keepCount: number): Promise<void> {
    const entries = await this.getByDocument(documentId)
    if (entries.length <= keepCount) return

    const db = await getDB()
    const toDelete = entries.slice(keepCount)
    const tx = db.transaction(HISTORY_STORE, 'readwrite')
    for (const entry of toDelete) {
      await tx.store.delete(entry.id)
    }
    await tx.done
  },
}

// ============================================================================
// Asset Storage (for images and other binary files)
// ============================================================================

/** Asset entry stored in IndexedDB */
export interface AssetEntry {
  /** Composite key: documentId:assetId */
  id: string
  /** Document this asset belongs to */
  documentId: string
  /** Asset ID (from document's asset registry) */
  assetId: string
  /** Binary data */
  blob: Blob
}

/** Asset storage functions */
export const assetStorage = {
  /**
   * Save an asset blob for a document.
   */
  async save(documentId: string, assetId: string, blob: Blob): Promise<void> {
    const db = await getDB()
    const entry: AssetEntry = {
      id: `${documentId}:${assetId}`,
      documentId,
      assetId,
      blob,
    }
    await db.put(ASSETS_STORE, entry)
  },

  /**
   * Load an asset blob by document and asset ID.
   */
  async load(documentId: string, assetId: string): Promise<Blob | null> {
    const db = await getDB()
    const entry = await db.get(ASSETS_STORE, `${documentId}:${assetId}`)
    return entry?.blob ?? null
  },

  /**
   * Delete an asset by document and asset ID.
   */
  async delete(documentId: string, assetId: string): Promise<void> {
    const db = await getDB()
    await db.delete(ASSETS_STORE, `${documentId}:${assetId}`)
  },

  /**
   * Get all asset IDs for a document.
   */
  async listByDocument(documentId: string): Promise<string[]> {
    const db = await getDB()
    const index = db.transaction(ASSETS_STORE).store.index('documentId')
    const entries = await index.getAll(documentId)
    return entries.map((e) => e.assetId)
  },

  /**
   * Get all assets for a document as a Map.
   */
  async loadAllByDocument(documentId: string): Promise<Map<string, Blob>> {
    const db = await getDB()
    const index = db.transaction(ASSETS_STORE).store.index('documentId')
    const entries = await index.getAll(documentId)
    const map = new Map<string, Blob>()
    for (const entry of entries) {
      map.set(entry.assetId, entry.blob)
    }
    return map
  },

  /**
   * Delete all assets for a document.
   */
  async deleteByDocument(documentId: string): Promise<void> {
    const db = await getDB()
    const index = db.transaction(ASSETS_STORE, 'readwrite').store.index('documentId')
    const keys = await index.getAllKeys(documentId)
    const tx = db.transaction(ASSETS_STORE, 'readwrite')
    for (const key of keys) {
      await tx.store.delete(key)
    }
    await tx.done
  },

  /**
   * Check if an asset exists.
   */
  async exists(documentId: string, assetId: string): Promise<boolean> {
    const db = await getDB()
    const entry = await db.get(ASSETS_STORE, `${documentId}:${assetId}`)
    return entry !== undefined
  },
}
