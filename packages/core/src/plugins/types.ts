import type { ModuleDefinition } from '../types'

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
  /** Whether this plugin has a styles.css file (default: false) */
  hasStyles?: boolean
}

/**
 * Information about an installed plugin.
 */
export interface InstalledPluginInfo {
  /** Plugin ID */
  id: string
  /** Plugin manifest */
  manifest: PluginManifest
  /** Source URL (GitHub) */
  source: string
  /** Whether the plugin is enabled */
  enabled: boolean
  /** Installation timestamp */
  installedAt: number
  /** Last update timestamp */
  updatedAt: number
  /** Path to the plugin files */
  path: string
}

/**
 * Plugin storage record (persisted to plugins.json).
 */
export interface PluginStorageRecord {
  id: string
  source: string
  version: string
  enabled: boolean
  installedAt: number
  updatedAt: number
}

/**
 * Plugin installation result.
 */
export interface PluginInstallResult {
  success: boolean
  pluginId?: string
  error?: string
}

/**
 * Plugin update information.
 */
export interface PluginUpdateInfo {
  pluginId: string
  currentVersion: string
  latestVersion: string
  source: string
}

/**
 * Events emitted by the PluginManager.
 */
export type PluginManagerEvent =
  | { type: 'installed'; pluginId: string }
  | { type: 'uninstalled'; pluginId: string }
  | { type: 'enabled'; pluginId: string }
  | { type: 'disabled'; pluginId: string }
  | { type: 'updated'; pluginId: string; fromVersion: string; toVersion: string }
  | { type: 'error'; pluginId?: string; error: string }

/**
 * Plugin module with metadata.
 */
export interface PluginModule extends ModuleDefinition {
  __pluginMeta?: {
    pluginId: string
    version: string
    lifecycle: {
      onInstall?: () => Promise<void> | void
      onEnable?: () => void
      onDisable?: () => void
      onUninstall?: () => Promise<void> | void
      onUpdate?: (previousVersion: string) => Promise<void> | void
    }
  }
}

/**
 * Parsed GitHub URL components.
 */
export interface ParsedGitHubUrl {
  owner: string
  repo: string
  path: string
  ref: string
}

/**
 * Parse a GitHub URL into its components.
 * Supports multiple formats:
 * - github.com/owner/repo
 * - github.com/owner/repo/path/to/plugin
 * - github.com/owner/repo@v1.0.0
 * - github.com/owner/repo@v1.0.0/path/to/plugin
 * - github:owner/repo/path
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
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

/**
 * Build a raw GitHub URL for fetching files.
 */
export function buildRawGitHubUrl(
  parsed: ParsedGitHubUrl,
  filename: string
): string {
  const basePath = parsed.path ? `${parsed.path}/` : ''
  return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.ref}/${basePath}${filename}`
}
