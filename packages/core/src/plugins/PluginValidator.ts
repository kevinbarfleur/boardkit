import type { PluginManifest } from './types'

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Current Boardkit version.
 * This should be updated when releasing new versions.
 */
export const BOARDKIT_VERSION = '0.1.0'

/**
 * Validate a plugin manifest.
 *
 * Returns detailed, actionable error messages to help plugin developers
 * quickly identify and fix issues in their manifest.json files.
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!manifest || typeof manifest !== 'object') {
    return {
      valid: false,
      errors: [
        'manifest.json must be a valid JSON object.\n' +
          '  Hint: Check for syntax errors (missing commas, quotes, etc.)',
      ],
      warnings: [],
    }
  }

  const m = manifest as Record<string, unknown>

  // Required fields with helpful examples
  if (!m.id || typeof m.id !== 'string') {
    errors.push(
      'Missing required field "id".\n' +
        '  Add: "id": "my-plugin"\n' +
        '  Format: kebab-case (lowercase letters, numbers, hyphens)'
    )
  } else if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(m.id)) {
    errors.push(
      `Invalid "id" format: "${m.id}"\n` +
        '  Must be kebab-case: lowercase letters, numbers, and hyphens.\n' +
        '  Must start with a letter.\n' +
        '  Valid examples: my-plugin, timer-pro, data-viz'
    )
  }

  if (!m.name || typeof m.name !== 'string') {
    errors.push(
      'Missing required field "name".\n' + '  Add: "name": "My Plugin"\n' + '  This is shown in the UI.'
    )
  }

  if (!m.version || typeof m.version !== 'string') {
    errors.push(
      'Missing required field "version".\n' +
        '  Add: "version": "0.1.0"\n' +
        '  Format: MAJOR.MINOR.PATCH (semantic versioning)'
    )
  } else if (!/^\d+\.\d+\.\d+$/.test(m.version)) {
    warnings.push(
      `Version "${m.version}" should follow semver format.\n` +
        '  Expected: MAJOR.MINOR.PATCH (e.g., 1.0.0, 0.2.1)\n' +
        '  See: https://semver.org'
    )
  }

  if (!m.minBoardkitVersion || typeof m.minBoardkitVersion !== 'string') {
    errors.push(
      'Missing required field "minBoardkitVersion".\n' +
        `  Add: "minBoardkitVersion": "${BOARDKIT_VERSION}"\n` +
        '  This specifies the minimum Boardkit version required.'
    )
  }

  if (!m.author || typeof m.author !== 'string') {
    errors.push(
      'Missing required field "author".\n' +
        '  Add: "author": "Your Name"\n' +
        '  This is shown in the plugin list.'
    )
  }

  if (!m.description || typeof m.description !== 'string') {
    errors.push(
      'Missing required field "description".\n' +
        '  Add: "description": "What your plugin does"\n' +
        '  Keep it under 200 characters.'
    )
  }

  // Optional fields validation with helpful hints
  if (m.authorUrl !== undefined && typeof m.authorUrl !== 'string') {
    errors.push(
      '"authorUrl" must be a string.\n' + '  Example: "authorUrl": "https://github.com/yourname"'
    )
  }

  if (m.repository !== undefined && typeof m.repository !== 'string') {
    errors.push(
      '"repository" must be a string.\n' + '  Example: "repository": "https://github.com/yourname/my-plugin"'
    )
  }

  if (m.isDesktopOnly !== undefined && typeof m.isDesktopOnly !== 'boolean') {
    errors.push('"isDesktopOnly" must be true or false (not a string).')
  }

  if (m.provides !== undefined) {
    if (!Array.isArray(m.provides)) {
      errors.push(
        '"provides" must be an array.\n' + '  Example: "provides": ["boardkit.mydata.v1"]'
      )
    } else if (!m.provides.every((p: unknown) => typeof p === 'string')) {
      errors.push('"provides" must be an array of strings (contract IDs).')
    }
  }

  if (m.consumes !== undefined) {
    if (!Array.isArray(m.consumes)) {
      errors.push(
        '"consumes" must be an array.\n' + '  Example: "consumes": ["boardkit.todo.v1"]'
      )
    } else if (!m.consumes.every((c: unknown) => typeof c === 'string')) {
      errors.push('"consumes" must be an array of strings (contract IDs).')
    }
  }

  if (m.icon !== undefined && typeof m.icon !== 'string') {
    errors.push(
      '"icon" must be a string (Lucide icon name).\n' +
        '  Example: "icon": "calendar-check"\n' +
        '  Browse icons: https://lucide.dev/icons'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check if a plugin is compatible with the current Boardkit version.
 */
export function checkCompatibility(minVersion: string): {
  compatible: boolean
  message?: string
} {
  try {
    const current = parseVersion(BOARDKIT_VERSION)
    const required = parseVersion(minVersion)

    // Simple comparison: major.minor.patch
    const isIncompatible =
      current.major < required.major ||
      (current.major === required.major && current.minor < required.minor) ||
      (current.major === required.major &&
        current.minor === required.minor &&
        current.patch < required.patch)

    if (isIncompatible) {
      return {
        compatible: false,
        message:
          `Plugin requires Boardkit ${minVersion}, but you have ${BOARDKIT_VERSION}.\n\n` +
          'Solutions:\n' +
          '  1. Update Boardkit to the latest version\n' +
          '  2. Use an older version of this plugin\n' +
          `  3. Ask the plugin author to lower minBoardkitVersion`,
      }
    }

    return { compatible: true }
  } catch {
    return {
      compatible: false,
      message:
        `Invalid version format in manifest: "${minVersion}"\n` +
        '  Expected format: MAJOR.MINOR.PATCH (e.g., 0.1.0, 1.0.0)\n' +
        '  Fix the "minBoardkitVersion" field in manifest.json',
    }
  }
}

/**
 * Parse a semver version string.
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    throw new Error(`Invalid version format: ${version}`)
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  }
}

/**
 * Type guard to check if an object is a valid PluginManifest.
 */
export function isValidManifest(manifest: unknown): manifest is PluginManifest {
  return validateManifest(manifest).valid
}
