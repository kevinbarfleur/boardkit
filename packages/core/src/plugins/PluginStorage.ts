import type {
  PluginManifest,
  PluginStorageRecord,
  InstalledPluginInfo,
} from './types'

/**
 * Storage adapter interface.
 * Different platforms (web/desktop) implement this differently.
 */
export interface PluginStorageAdapter {
  /** Check if storage is available */
  isAvailable(): boolean

  /** Read the plugins registry (list of installed plugins) */
  readRegistry(): Promise<PluginStorageRecord[]>

  /** Write the plugins registry */
  writeRegistry(records: PluginStorageRecord[]): Promise<void>

  /** Check if a plugin is installed */
  isPluginInstalled(pluginId: string): Promise<boolean>

  /** Read a plugin's manifest */
  readManifest(pluginId: string): Promise<PluginManifest | null>

  /** Read a plugin's main module code */
  readModuleCode(pluginId: string): Promise<string | null>

  /** Install a plugin's files */
  installPlugin(
    pluginId: string,
    manifest: PluginManifest,
    code: string,
    styles?: string
  ): Promise<void>

  /** Uninstall a plugin (remove files) */
  uninstallPlugin(pluginId: string): Promise<void>
}

/**
 * Web storage adapter using IndexedDB.
 */
export class WebPluginStorageAdapter implements PluginStorageAdapter {
  private dbName = 'boardkit-plugins'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for plugin registry
        if (!db.objectStoreNames.contains('registry')) {
          db.createObjectStore('registry', { keyPath: 'id' })
        }

        // Store for plugin files
        if (!db.objectStoreNames.contains('plugins')) {
          db.createObjectStore('plugins', { keyPath: 'id' })
        }
      }
    })
  }

  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  async readRegistry(): Promise<PluginStorageRecord[]> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('registry', 'readonly')
      const store = transaction.objectStore('registry')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async writeRegistry(records: PluginStorageRecord[]): Promise<void> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('registry', 'readwrite')
      const store = transaction.objectStore('registry')

      // Clear and rewrite all records
      store.clear()

      for (const record of records) {
        store.put(record)
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async isPluginInstalled(pluginId: string): Promise<boolean> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('plugins', 'readonly')
      const store = transaction.objectStore('plugins')
      const request = store.get(pluginId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(!!request.result)
    })
  }

  async readManifest(pluginId: string): Promise<PluginManifest | null> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('plugins', 'readonly')
      const store = transaction.objectStore('plugins')
      const request = store.get(pluginId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result?.manifest || null)
      }
    })
  }

  async readModuleCode(pluginId: string): Promise<string | null> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('plugins', 'readonly')
      const store = transaction.objectStore('plugins')
      const request = store.get(pluginId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result?.code || null)
      }
    })
  }

  async installPlugin(
    pluginId: string,
    manifest: PluginManifest,
    code: string,
    styles?: string
  ): Promise<void> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('plugins', 'readwrite')
      const store = transaction.objectStore('plugins')

      store.put({
        id: pluginId,
        manifest,
        code,
        styles,
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const db = await this.getDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('plugins', 'readwrite')
      const store = transaction.objectStore('plugins')

      store.delete(pluginId)

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

/**
 * Create the appropriate storage adapter for the current platform.
 */
export function createPluginStorageAdapter(): PluginStorageAdapter {
  // For now, only web storage is implemented
  // Desktop storage (filesystem) will be added later via the platform package
  return new WebPluginStorageAdapter()
}

/**
 * Plugin storage singleton.
 */
let storageAdapter: PluginStorageAdapter | null = null

export function getPluginStorageAdapter(): PluginStorageAdapter {
  if (!storageAdapter) {
    storageAdapter = createPluginStorageAdapter()
  }
  return storageAdapter
}

export function setPluginStorageAdapter(adapter: PluginStorageAdapter): void {
  storageAdapter = adapter
}
