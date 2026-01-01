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
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be an object'], warnings: [] }
  }

  const m = manifest as Record<string, unknown>

  // Required fields
  if (!m.id || typeof m.id !== 'string') {
    errors.push('Missing or invalid "id" field (must be a string)')
  } else if (!/^[a-z0-9-]+$/.test(m.id)) {
    errors.push('"id" must be kebab-case (lowercase letters, numbers, and hyphens only)')
  }

  if (!m.name || typeof m.name !== 'string') {
    errors.push('Missing or invalid "name" field (must be a string)')
  }

  if (!m.version || typeof m.version !== 'string') {
    errors.push('Missing or invalid "version" field (must be a string)')
  } else if (!/^\d+\.\d+\.\d+/.test(m.version)) {
    warnings.push('"version" should follow semver format (e.g., 1.0.0)')
  }

  if (!m.minBoardkitVersion || typeof m.minBoardkitVersion !== 'string') {
    errors.push('Missing or invalid "minBoardkitVersion" field (must be a string)')
  }

  if (!m.author || typeof m.author !== 'string') {
    errors.push('Missing or invalid "author" field (must be a string)')
  }

  if (!m.description || typeof m.description !== 'string') {
    errors.push('Missing or invalid "description" field (must be a string)')
  }

  // Optional fields validation
  if (m.authorUrl !== undefined && typeof m.authorUrl !== 'string') {
    errors.push('"authorUrl" must be a string if provided')
  }

  if (m.repository !== undefined && typeof m.repository !== 'string') {
    errors.push('"repository" must be a string if provided')
  }

  if (m.isDesktopOnly !== undefined && typeof m.isDesktopOnly !== 'boolean') {
    errors.push('"isDesktopOnly" must be a boolean if provided')
  }

  if (m.provides !== undefined) {
    if (!Array.isArray(m.provides)) {
      errors.push('"provides" must be an array if provided')
    } else if (!m.provides.every((p: unknown) => typeof p === 'string')) {
      errors.push('"provides" must be an array of strings')
    }
  }

  if (m.consumes !== undefined) {
    if (!Array.isArray(m.consumes)) {
      errors.push('"consumes" must be an array if provided')
    } else if (!m.consumes.every((c: unknown) => typeof c === 'string')) {
      errors.push('"consumes" must be an array of strings')
    }
  }

  if (m.icon !== undefined && typeof m.icon !== 'string') {
    errors.push('"icon" must be a string if provided')
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
    if (current.major < required.major) {
      return {
        compatible: false,
        message: `Plugin requires Boardkit ${minVersion}, but current version is ${BOARDKIT_VERSION}`,
      }
    }

    if (current.major === required.major && current.minor < required.minor) {
      return {
        compatible: false,
        message: `Plugin requires Boardkit ${minVersion}, but current version is ${BOARDKIT_VERSION}`,
      }
    }

    if (
      current.major === required.major &&
      current.minor === required.minor &&
      current.patch < required.patch
    ) {
      return {
        compatible: false,
        message: `Plugin requires Boardkit ${minVersion}, but current version is ${BOARDKIT_VERSION}`,
      }
    }

    return { compatible: true }
  } catch {
    return {
      compatible: false,
      message: `Invalid version format: ${minVersion}`,
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
