/**
 * Plugin System
 *
 * This module provides the infrastructure for loading and managing plugins.
 */

// Main manager
export { PluginManager, pluginManager } from './PluginManager'

// Storage
export {
  type PluginStorageAdapter,
  WebPluginStorageAdapter,
  createPluginStorageAdapter,
  getPluginStorageAdapter,
  setPluginStorageAdapter,
} from './PluginStorage'

// Loader
export {
  fetchPluginFromGitHub,
  loadPluginModule,
  loadInstalledPlugin,
  checkForUpdate,
  setupPluginRuntime,
  type FetchedPlugin,
} from './PluginLoader'

// Validator
export {
  validateManifest,
  checkCompatibility,
  isValidManifest,
  BOARDKIT_VERSION,
  type ValidationResult,
} from './PluginValidator'

// Types
export type {
  PluginManifest,
  InstalledPluginInfo,
  PluginStorageRecord,
  PluginInstallResult,
  PluginUpdateInfo,
  PluginManagerEvent,
  PluginModule,
  ParsedGitHubUrl,
} from './types'

export { parseGitHubUrl, buildRawGitHubUrl } from './types'
