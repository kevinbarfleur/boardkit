import type { Component } from 'vue'
import type {
  ModuleDefinition,
  DataContract,
  ConsumerConfig,
  ConfigurationSchema,
  SettingsSchema,
} from '@boardkit/core'

/**
 * Plugin manifest structure.
 * This is the content of the manifest.json file in a plugin repository.
 */
export interface PluginManifest {
  /** Unique plugin identifier (kebab-case) */
  id: string
  /** Human-readable plugin name */
  name: string
  /** Plugin version (semver) */
  version: string
  /** Minimum Boardkit version required */
  minBoardkitVersion: string
  /** Plugin author */
  author: string
  /** Author's website or profile URL */
  authorUrl?: string
  /** Plugin description */
  description: string
  /** GitHub repository URL */
  repository?: string
  /** Whether this plugin only works on desktop */
  isDesktopOnly?: boolean
  /** Data contracts this plugin provides */
  provides?: string[]
  /** Data contracts this plugin consumes */
  consumes?: string[]
  /** Icon name (Lucide icon) */
  icon?: string
}

/**
 * Plugin lifecycle hooks.
 * These are called at specific points in the plugin's lifecycle.
 */
export interface PluginLifecycle {
  /** Called when the plugin is first installed */
  onInstall?: () => Promise<void> | void
  /** Called when the plugin is enabled */
  onEnable?: () => void
  /** Called when the plugin is disabled */
  onDisable?: () => void
  /** Called when the plugin is uninstalled */
  onUninstall?: () => Promise<void> | void
  /** Called when the plugin is updated from a previous version */
  onUpdate?: (previousVersion: string) => Promise<void> | void
}

/**
 * Plugin definition.
 * Extends ModuleDefinition with plugin-specific lifecycle hooks.
 */
export interface PluginDefinition<TState = unknown> extends PluginLifecycle {
  /** Unique plugin identifier (must match manifest.id) */
  pluginId: string
  /** Plugin version (must match manifest.version) */
  version: string
  /** Human-readable display name */
  displayName: string
  /** Lucide icon name */
  icon?: string
  /** Vue component for the widget */
  component: Component
  /** Default state factory */
  defaultState: () => TState
  /** Serialize state for persistence */
  serialize: (state: TState) => unknown
  /** Deserialize state from persistence */
  deserialize: (data: unknown) => TState
  /** Minimum widget width */
  minWidth?: number
  /** Minimum widget height */
  minHeight?: number
  /** Default widget width */
  defaultWidth?: number
  /** Default widget height */
  defaultHeight?: number
  /** Data contracts this plugin consumes */
  consumes?: ConsumerConfig[]
  /** Data contracts this plugin provides */
  provides?: DataContract[]
  /** Configuration schema (required setup) */
  configurationSchema?: ConfigurationSchema
  /** Settings schema (preferences) */
  settingsSchema?: SettingsSchema
  /** Custom Vue components used in configuration sections */
  configurationComponents?: Record<string, Component>
}

/**
 * Information about an installed plugin.
 */
export interface InstalledPlugin {
  /** Plugin ID */
  id: string
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin author */
  author: string
  /** Plugin description */
  description: string
  /** Whether the plugin is enabled */
  enabled: boolean
  /** Source URL (GitHub) */
  source: string
  /** Installation timestamp */
  installedAt: number
  /** Last update timestamp */
  updatedAt: number
  /** Whether an update is available */
  updateAvailable?: string
}

/**
 * Plugin installation source.
 */
export interface PluginSource {
  /** Source type */
  type: 'github' | 'local'
  /** GitHub: owner/repo/path, Local: file path */
  url: string
  /** Specific version or branch (optional) */
  ref?: string
}

/**
 * Parse a GitHub URL into its components.
 */
export function parseGitHubUrl(url: string): {
  owner: string
  repo: string
  path: string
  ref: string
} {
  // Remove protocol and github.com prefix
  let cleanUrl = url
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/^github:/, '')

  // Extract ref if present (e.g., @v1.0.0)
  let ref = 'main'
  const refMatch = cleanUrl.match(/@([^/]+)/)
  if (refMatch) {
    ref = refMatch[1]
    cleanUrl = cleanUrl.replace(/@[^/]+/, '')
  }

  // Split into parts
  const parts = cleanUrl.split('/').filter(Boolean)

  if (parts.length < 2) {
    throw new Error(`Invalid GitHub URL: ${url}`)
  }

  const owner = parts[0]
  const repo = parts[1]
  const path = parts.slice(2).join('/')

  return { owner, repo, path, ref }
}
