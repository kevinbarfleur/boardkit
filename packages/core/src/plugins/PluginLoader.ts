import type { PluginManifest, PluginModule } from './types'
import { parseGitHubUrl, buildRawGitHubUrl } from './types'
import { getPluginStorageAdapter } from './PluginStorage'
import { validateManifest, checkCompatibility, isValidManifest } from './PluginValidator'

// Import modules that plugins depend on - these will be exposed to plugins
import * as Vue from 'vue'
import * as BoardkitCore from '../index'

/**
 * Result of fetching plugin files from GitHub.
 */
export interface FetchedPlugin {
  manifest: PluginManifest
  code: string
  styles?: string
  source: string
}

/**
 * Fetch a plugin from a GitHub repository.
 *
 * @param url - GitHub URL (e.g., "github.com/author/repo/path/to/plugin")
 */
export async function fetchPluginFromGitHub(url: string): Promise<FetchedPlugin> {
  const parsed = parseGitHubUrl(url)

  // Fetch manifest.json
  const manifestUrl = buildRawGitHubUrl(parsed, 'manifest.json')
  const manifestResponse = await fetch(manifestUrl)

  if (!manifestResponse.ok) {
    throw new Error(`Failed to fetch manifest from ${manifestUrl}: ${manifestResponse.status}`)
  }

  const manifestData = await manifestResponse.json()

  // Validate manifest
  const validation = validateManifest(manifestData)
  if (!validation.valid) {
    throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`)
  }

  // Check compatibility
  const compatibility = checkCompatibility(manifestData.minBoardkitVersion)
  if (!compatibility.compatible) {
    throw new Error(compatibility.message || 'Plugin is not compatible with this version of Boardkit')
  }

  const manifest = manifestData as PluginManifest

  // Fetch main.js
  const codeUrl = buildRawGitHubUrl(parsed, 'main.js')
  const codeResponse = await fetch(codeUrl)

  if (!codeResponse.ok) {
    throw new Error(`Failed to fetch code from ${codeUrl}: ${codeResponse.status}`)
  }

  const code = await codeResponse.text()

  // Fetch styles.css only if declared in manifest (avoids 404 console errors)
  let styles: string | undefined
  if (manifest.hasStyles) {
    try {
      const stylesUrl = buildRawGitHubUrl(parsed, 'styles.css')
      const stylesResponse = await fetch(stylesUrl)
      if (stylesResponse.ok) {
        styles = await stylesResponse.text()
      }
    } catch {
      // Styles fetch failed, continue without styles
      console.warn(`Failed to fetch styles for plugin ${manifest.id}`)
    }
  }

  return {
    manifest,
    code,
    styles,
    source: url,
  }
}

/**
 * Boardkit global object exposed to plugins.
 * Plugins access dependencies via window.__BOARDKIT__
 */
interface BoardkitGlobal {
  vue: typeof Vue
  core: typeof BoardkitCore
  ui: unknown
  pluginApi: unknown
  registerPlugin: (module: PluginModule | null) => void
}

// Flag to track if runtime is initialized
let runtimeInitialized = false

/**
 * Setup the plugin runtime by providing the UI and Plugin API modules.
 * This must be called by the app before loading any plugins.
 *
 * @param deps - The dependencies to inject
 */
export function setupPluginRuntime(deps: {
  ui: unknown
  pluginApi: unknown
}): void {
  // Create the global Boardkit object for plugins
  const boardkitGlobal: BoardkitGlobal = {
    vue: Vue,
    core: BoardkitCore,
    ui: deps.ui,
    pluginApi: deps.pluginApi,
    // registerPlugin is set dynamically during loadPluginModule
    registerPlugin: () => {
      console.warn('registerPlugin called outside of plugin loading context')
    },
  }

  // Expose globally
  const win = window as unknown as { __BOARDKIT__: BoardkitGlobal }
  win.__BOARDKIT__ = boardkitGlobal

  runtimeInitialized = true
}

/**
 * Load a plugin's module code.
 *
 * The plugin code should be an IIFE that:
 * 1. Accesses dependencies via window.__BOARDKIT__ (vue, core, ui, pluginApi)
 * 2. Calls window.__BOARDKIT__.registerPlugin(module) with the plugin module
 *
 * SECURITY NOTE: This executes arbitrary JavaScript code.
 * Users should only install plugins from trusted sources.
 */
export async function loadPluginModule(code: string): Promise<PluginModule> {
  // Check if runtime is set up
  if (!runtimeInitialized) {
    throw new Error('Plugin runtime not initialized. Call setupPluginRuntime() first.')
  }

  const win = window as unknown as { __BOARDKIT__: BoardkitGlobal }

  // Create a promise that will be resolved when the plugin registers itself
  let resolvePlugin: (module: PluginModule) => void
  let rejectPlugin: (error: Error) => void

  const pluginPromise = new Promise<PluginModule>((resolve, reject) => {
    resolvePlugin = resolve
    rejectPlugin = reject
  })

  // Set up the registerPlugin callback
  win.__BOARDKIT__.registerPlugin = (module: PluginModule | null) => {
    if (module && typeof module === 'object') {
      // Handle both direct exports and { default: ... } wrapper
      const unwrapped = 'default' in module ? (module as { default: PluginModule }).default : module
      if (unwrapped && typeof unwrapped === 'object') {
        resolvePlugin(unwrapped)
      } else {
        rejectPlugin(new Error('Plugin did not export a valid module'))
      }
    } else {
      rejectPlugin(new Error('Plugin did not export a valid module'))
    }
  }

  try {
    // Execute the plugin code
    // The IIFE will call window.__BOARDKIT__.registerPlugin() with the module
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const execute = new Function(code)
    execute()

    // Wait for the plugin to register (with timeout)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Plugin registration timeout')), 5000)
    })

    const module = await Promise.race([pluginPromise, timeoutPromise])

    return module
  } catch (error) {
    console.error('Failed to load plugin module:', error)
    throw error
  } finally {
    // Reset the registerPlugin callback
    win.__BOARDKIT__.registerPlugin = () => {
      console.warn('registerPlugin called outside of plugin loading context')
    }
  }
}

/**
 * Load an installed plugin from storage.
 */
export async function loadInstalledPlugin(pluginId: string): Promise<PluginModule | null> {
  const storage = getPluginStorageAdapter()

  // Read the plugin code
  const code = await storage.readModuleCode(pluginId)
  if (!code) {
    console.warn(`Plugin ${pluginId} not found in storage`)
    return null
  }

  // Load the module
  return loadPluginModule(code)
}

/**
 * Check if a newer version is available for a plugin.
 */
export async function checkForUpdate(
  pluginId: string,
  currentVersion: string,
  source: string
): Promise<{ hasUpdate: boolean; latestVersion?: string }> {
  try {
    const parsed = parseGitHubUrl(source)

    // Fetch the latest manifest
    const manifestUrl = buildRawGitHubUrl({ ...parsed, ref: 'main' }, 'manifest.json')
    const response = await fetch(manifestUrl)

    if (!response.ok) {
      return { hasUpdate: false }
    }

    const manifest = await response.json()

    if (!isValidManifest(manifest)) {
      return { hasUpdate: false }
    }

    // Compare versions
    const current = parseVersion(currentVersion)
    const latest = parseVersion(manifest.version)

    const hasUpdate =
      latest.major > current.major ||
      (latest.major === current.major && latest.minor > current.minor) ||
      (latest.major === current.major &&
        latest.minor === current.minor &&
        latest.patch > current.patch)

    return {
      hasUpdate,
      latestVersion: hasUpdate ? manifest.version : undefined,
    }
  } catch (error) {
    console.warn(`Failed to check for updates for ${pluginId}:`, error)
    return { hasUpdate: false }
  }
}

/**
 * Parse a semver version string.
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    return { major: 0, minor: 0, patch: 0 }
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  }
}
