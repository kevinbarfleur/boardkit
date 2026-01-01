import { ref, computed, onMounted } from 'vue'
import {
  pluginManager,
  type InstalledPluginInfo,
  type PluginUpdateInfo,
} from '@boardkit/core'
import type { PluginInfo } from '@boardkit/ui'

/**
 * Composable for managing plugins.
 * Provides a reactive interface to the PluginManager.
 */
export function usePlugins() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const updates = ref<PluginUpdateInfo[]>([])

  // Convert InstalledPluginInfo to PluginInfo for the UI
  const plugins = computed<PluginInfo[]>(() => {
    return pluginManager.installed.value.map((p) => ({
      id: p.id,
      name: p.manifest.name,
      version: p.manifest.version,
      author: p.manifest.author,
      description: p.manifest.description,
      icon: p.manifest.icon,
      enabled: p.enabled,
      source: p.source,
      updateAvailable: updates.value.find((u) => u.pluginId === p.id)?.latestVersion,
    }))
  })

  /**
   * Initialize the plugin manager.
   */
  async function initialize() {
    try {
      await pluginManager.initialize()
    } catch (e) {
      console.error('Failed to initialize plugins:', e)
      error.value = e instanceof Error ? e.message : 'Failed to initialize plugins'
    }
  }

  /**
   * Install a plugin from a GitHub URL.
   */
  async function installPlugin(url: string) {
    loading.value = true
    error.value = null

    try {
      const result = await pluginManager.installFromGitHub(url)
      if (!result.success) {
        error.value = result.error || 'Failed to install plugin'
      }
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to install plugin'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle a plugin's enabled state.
   */
  async function togglePlugin(pluginId: string, enabled: boolean) {
    loading.value = true
    error.value = null

    try {
      if (enabled) {
        await pluginManager.enable(pluginId)
      } else {
        await pluginManager.disable(pluginId)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to toggle plugin'
    } finally {
      loading.value = false
    }
  }

  /**
   * Uninstall a plugin.
   */
  async function uninstallPlugin(pluginId: string) {
    loading.value = true
    error.value = null

    try {
      await pluginManager.uninstall(pluginId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to uninstall plugin'
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a plugin to the latest version.
   */
  async function updatePlugin(pluginId: string) {
    loading.value = true
    error.value = null

    try {
      await pluginManager.update(pluginId)
      // Remove from updates list
      updates.value = updates.value.filter((u) => u.pluginId !== pluginId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update plugin'
    } finally {
      loading.value = false
    }
  }

  /**
   * Check for updates for all installed plugins.
   */
  async function checkForUpdates() {
    loading.value = true
    error.value = null

    try {
      updates.value = await pluginManager.checkForUpdates()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to check for updates'
    } finally {
      loading.value = false
    }
  }

  // Initialize on mount
  onMounted(() => {
    initialize()
  })

  return {
    plugins,
    loading,
    error,
    updates,
    installPlugin,
    togglePlugin,
    uninstallPlugin,
    updatePlugin,
    checkForUpdates,
  }
}
