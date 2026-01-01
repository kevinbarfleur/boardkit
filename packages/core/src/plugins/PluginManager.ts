import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type {
  PluginManifest,
  PluginStorageRecord,
  InstalledPluginInfo,
  PluginInstallResult,
  PluginUpdateInfo,
  PluginManagerEvent,
  PluginModule,
} from './types'
import { getPluginStorageAdapter } from './PluginStorage'
import { fetchPluginFromGitHub, loadInstalledPlugin, checkForUpdate } from './PluginLoader'
import { moduleRegistry } from '../modules/ModuleRegistry'
import { actionRegistry } from '../actions/ActionRegistry'
import { refreshCoreActions } from '../actions/coreActions'

/**
 * Plugin Manager
 *
 * Manages the installation, loading, enabling/disabling, and updating of plugins.
 *
 * @example
 * ```typescript
 * import { pluginManager } from '@boardkit/core'
 *
 * // Install a plugin from GitHub
 * await pluginManager.installFromGitHub('github.com/author/boardkit-plugin-example')
 *
 * // List installed plugins
 * const plugins = pluginManager.getInstalled()
 *
 * // Enable/disable a plugin
 * await pluginManager.enable('example-plugin')
 * await pluginManager.disable('example-plugin')
 *
 * // Uninstall a plugin
 * await pluginManager.uninstall('example-plugin')
 * ```
 */
export class PluginManager {
  /** Map of loaded plugin modules */
  private loadedModules: Map<string, PluginModule> = new Map()

  /** Reactive list of installed plugins */
  private _installed: Ref<InstalledPluginInfo[]> = ref([])

  /** Event listeners */
  private eventListeners: Map<string, Set<(event: PluginManagerEvent) => void>> = new Map()

  /** Whether the manager has been initialized */
  private initialized = false

  /**
   * Get the list of installed plugins (reactive).
   */
  get installed(): ComputedRef<InstalledPluginInfo[]> {
    return computed(() => this._installed.value)
  }

  /**
   * Get the list of enabled plugins (reactive).
   */
  get enabledPlugins(): ComputedRef<InstalledPluginInfo[]> {
    return computed(() => this._installed.value.filter((p) => p.enabled))
  }

  /**
   * Initialize the plugin manager.
   * This loads the plugin registry and all enabled plugins.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    const storage = getPluginStorageAdapter()
    if (!storage.isAvailable()) {
      console.warn('Plugin storage is not available')
      this.initialized = true
      return
    }

    try {
      // Load the registry
      const records = await storage.readRegistry()

      // Build the installed plugins list
      const installed: InstalledPluginInfo[] = []

      for (const record of records) {
        const manifest = await storage.readManifest(record.id)
        if (manifest) {
          installed.push({
            id: record.id,
            manifest,
            source: record.source,
            enabled: record.enabled,
            installedAt: record.installedAt,
            updatedAt: record.updatedAt,
            path: '', // Web storage doesn't have paths
          })
        }
      }

      this._installed.value = installed

      // Load enabled plugins
      for (const plugin of installed.filter((p) => p.enabled)) {
        try {
          await this.loadPlugin(plugin.id)
        } catch (error) {
          console.error(`Failed to load plugin ${plugin.id}:`, error)
          this.emit({ type: 'error', pluginId: plugin.id, error: String(error) })
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error)
      this.initialized = true
    }
  }

  /**
   * Install a plugin from a GitHub repository.
   */
  async installFromGitHub(url: string): Promise<PluginInstallResult> {
    try {
      // Fetch the plugin files
      const fetched = await fetchPluginFromGitHub(url)

      // Check if already installed
      const existing = this._installed.value.find((p) => p.id === fetched.manifest.id)
      if (existing) {
        return {
          success: false,
          error: `Plugin ${fetched.manifest.id} is already installed`,
        }
      }

      // Store the plugin
      const storage = getPluginStorageAdapter()
      await storage.installPlugin(
        fetched.manifest.id,
        fetched.manifest,
        fetched.code,
        fetched.styles
      )

      // Update the registry
      const now = Date.now()
      const record: PluginStorageRecord = {
        id: fetched.manifest.id,
        source: fetched.source,
        version: fetched.manifest.version,
        enabled: true, // Enable by default
        installedAt: now,
        updatedAt: now,
      }

      const records = await storage.readRegistry()
      records.push(record)
      await storage.writeRegistry(records)

      // Add to installed list
      const pluginInfo: InstalledPluginInfo = {
        id: fetched.manifest.id,
        manifest: fetched.manifest,
        source: fetched.source,
        enabled: true,
        installedAt: now,
        updatedAt: now,
        path: '',
      }
      this._installed.value = [...this._installed.value, pluginInfo]

      // Load the plugin
      await this.loadPlugin(fetched.manifest.id)

      // Call onInstall lifecycle hook
      const module = this.loadedModules.get(fetched.manifest.id)
      if (module?.__pluginMeta?.lifecycle.onInstall) {
        await module.__pluginMeta.lifecycle.onInstall()
      }

      this.emit({ type: 'installed', pluginId: fetched.manifest.id })

      return {
        success: true,
        pluginId: fetched.manifest.id,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.emit({ type: 'error', error: errorMessage })
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Uninstall a plugin.
   */
  async uninstall(pluginId: string): Promise<boolean> {
    const plugin = this._installed.value.find((p) => p.id === pluginId)
    if (!plugin) {
      return false
    }

    try {
      // Call onUninstall lifecycle hook
      const module = this.loadedModules.get(pluginId)
      if (module?.__pluginMeta?.lifecycle.onUninstall) {
        await module.__pluginMeta.lifecycle.onUninstall()
      }

      // Unload the plugin first
      await this.unloadPlugin(pluginId)

      // Remove from storage
      const storage = getPluginStorageAdapter()
      await storage.uninstallPlugin(pluginId)

      // Update the registry
      const records = await storage.readRegistry()
      const updatedRecords = records.filter((r) => r.id !== pluginId)
      await storage.writeRegistry(updatedRecords)

      // Remove from installed list
      this._installed.value = this._installed.value.filter((p) => p.id !== pluginId)

      this.emit({ type: 'uninstalled', pluginId })
      return true
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error)
      this.emit({ type: 'error', pluginId, error: String(error) })
      return false
    }
  }

  /**
   * Enable a plugin.
   */
  async enable(pluginId: string): Promise<boolean> {
    const plugin = this._installed.value.find((p) => p.id === pluginId)
    if (!plugin || plugin.enabled) {
      return false
    }

    try {
      // Load the plugin
      await this.loadPlugin(pluginId)

      // Call onEnable lifecycle hook
      const module = this.loadedModules.get(pluginId)
      if (module?.__pluginMeta?.lifecycle.onEnable) {
        module.__pluginMeta.lifecycle.onEnable()
      }

      // Update the registry
      const storage = getPluginStorageAdapter()
      const records = await storage.readRegistry()
      const record = records.find((r) => r.id === pluginId)
      if (record) {
        record.enabled = true
        await storage.writeRegistry(records)
      }

      // Update the installed list
      this._installed.value = this._installed.value.map((p) =>
        p.id === pluginId ? { ...p, enabled: true } : p
      )

      this.emit({ type: 'enabled', pluginId })
      return true
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error)
      this.emit({ type: 'error', pluginId, error: String(error) })
      return false
    }
  }

  /**
   * Disable a plugin.
   */
  async disable(pluginId: string): Promise<boolean> {
    const plugin = this._installed.value.find((p) => p.id === pluginId)
    if (!plugin || !plugin.enabled) {
      return false
    }

    try {
      // Call onDisable lifecycle hook
      const module = this.loadedModules.get(pluginId)
      if (module?.__pluginMeta?.lifecycle.onDisable) {
        module.__pluginMeta.lifecycle.onDisable()
      }

      // Unload the plugin
      await this.unloadPlugin(pluginId)

      // Update the registry
      const storage = getPluginStorageAdapter()
      const records = await storage.readRegistry()
      const record = records.find((r) => r.id === pluginId)
      if (record) {
        record.enabled = false
        await storage.writeRegistry(records)
      }

      // Update the installed list
      this._installed.value = this._installed.value.map((p) =>
        p.id === pluginId ? { ...p, enabled: false } : p
      )

      this.emit({ type: 'disabled', pluginId })
      return true
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error)
      this.emit({ type: 'error', pluginId, error: String(error) })
      return false
    }
  }

  /**
   * Check for updates for all installed plugins.
   */
  async checkForUpdates(): Promise<PluginUpdateInfo[]> {
    const updates: PluginUpdateInfo[] = []

    for (const plugin of this._installed.value) {
      const result = await checkForUpdate(
        plugin.id,
        plugin.manifest.version,
        plugin.source
      )

      if (result.hasUpdate && result.latestVersion) {
        updates.push({
          pluginId: plugin.id,
          currentVersion: plugin.manifest.version,
          latestVersion: result.latestVersion,
          source: plugin.source,
        })
      }
    }

    return updates
  }

  /**
   * Update a plugin to the latest version.
   */
  async update(pluginId: string): Promise<boolean> {
    const plugin = this._installed.value.find((p) => p.id === pluginId)
    if (!plugin) {
      return false
    }

    try {
      const previousVersion = plugin.manifest.version

      // Fetch the latest version
      const fetched = await fetchPluginFromGitHub(plugin.source)

      // Check if this is actually an update
      if (fetched.manifest.version === previousVersion) {
        return false
      }

      // Unload the current version
      await this.unloadPlugin(pluginId)

      // Store the new version
      const storage = getPluginStorageAdapter()
      await storage.installPlugin(
        pluginId,
        fetched.manifest,
        fetched.code,
        fetched.styles
      )

      // Update the registry
      const now = Date.now()
      const records = await storage.readRegistry()
      const record = records.find((r) => r.id === pluginId)
      if (record) {
        record.version = fetched.manifest.version
        record.updatedAt = now
        await storage.writeRegistry(records)
      }

      // Update the installed list
      this._installed.value = this._installed.value.map((p) =>
        p.id === pluginId
          ? { ...p, manifest: fetched.manifest, updatedAt: now }
          : p
      )

      // Load the new version if it was enabled
      if (plugin.enabled) {
        await this.loadPlugin(pluginId)

        // Call onUpdate lifecycle hook
        const module = this.loadedModules.get(pluginId)
        if (module?.__pluginMeta?.lifecycle.onUpdate) {
          await module.__pluginMeta.lifecycle.onUpdate(previousVersion)
        }
      }

      this.emit({
        type: 'updated',
        pluginId,
        fromVersion: previousVersion,
        toVersion: fetched.manifest.version,
      })

      return true
    } catch (error) {
      console.error(`Failed to update plugin ${pluginId}:`, error)
      this.emit({ type: 'error', pluginId, error: String(error) })
      return false
    }
  }

  /**
   * Get information about an installed plugin.
   */
  getPlugin(pluginId: string): InstalledPluginInfo | undefined {
    return this._installed.value.find((p) => p.id === pluginId)
  }

  /**
   * Check if a plugin is installed.
   */
  isInstalled(pluginId: string): boolean {
    return this._installed.value.some((p) => p.id === pluginId)
  }

  /**
   * Check if a plugin is enabled.
   */
  isEnabled(pluginId: string): boolean {
    const plugin = this._installed.value.find((p) => p.id === pluginId)
    return plugin?.enabled ?? false
  }

  /**
   * Subscribe to plugin manager events.
   */
  on(
    eventType: PluginManagerEvent['type'],
    callback: (event: PluginManagerEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(callback)
    }
  }

  /**
   * Load a plugin's module and register it.
   */
  private async loadPlugin(pluginId: string): Promise<void> {
    // Check if already loaded
    if (this.loadedModules.has(pluginId)) {
      return
    }

    // Load the module
    const module = await loadInstalledPlugin(pluginId)
    if (!module) {
      throw new Error(`Failed to load module for plugin ${pluginId}`)
    }

    // Register with the module registry
    moduleRegistry.register(module)

    // Register actions if any
    if ('actions' in module && Array.isArray((module as any).actions)) {
      actionRegistry.registerModuleActions(module.moduleId, (module as any).actions)
    }

    // Refresh core actions to include the new "Add X" action for this module
    refreshCoreActions()

    // Store the loaded module
    this.loadedModules.set(pluginId, module)
  }

  /**
   * Unload a plugin's module and unregister it.
   */
  private async unloadPlugin(pluginId: string): Promise<void> {
    const module = this.loadedModules.get(pluginId)
    if (!module) {
      return
    }

    // Unregister from the module registry
    moduleRegistry.unregister(module.moduleId)

    // Unregister actions
    actionRegistry.unregisterModule(module.moduleId)

    // Refresh core actions to remove the "Add X" action for this module
    refreshCoreActions()

    // Remove from loaded modules
    this.loadedModules.delete(pluginId)
  }

  /**
   * Emit an event to all listeners.
   */
  private emit(event: PluginManagerEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in plugin manager event listener:', error)
        }
      }
    }
  }
}

/**
 * Plugin manager singleton.
 */
export const pluginManager = new PluginManager()
