/**
 * Asset Types for Boardkit
 *
 * Assets are binary files (images, etc.) stored alongside the document.
 * They are referenced by elements via assetId.
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported image MIME types for import.
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number]

/**
 * Maximum image file size in bytes (10 MB).
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

/**
 * File extensions for each MIME type.
 */
export const MIME_TO_EXTENSION: Record<SupportedImageType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

/**
 * Extension to MIME type mapping.
 */
export const EXTENSION_TO_MIME: Record<string, SupportedImageType> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

// ============================================================================
// Asset Types
// ============================================================================

/**
 * Metadata for an asset stored in the document.
 */
export interface Asset {
  /** Unique identifier (nanoid) */
  id: string
  /** Original filename */
  filename: string
  /** MIME type */
  mimeType: SupportedImageType
  /** File size in bytes */
  size: number
  /** Content hash for deduplication (SHA-256 hex) */
  hash: string
  /** Creation timestamp */
  createdAt: number
}

/**
 * Asset registry stored in the document.
 * Maps assetId -> Asset metadata.
 */
export interface AssetRegistry {
  /** Map of assetId to asset metadata */
  assets: Record<string, Asset>
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an empty asset registry.
 */
export function createEmptyAssetRegistry(): AssetRegistry {
  return {
    assets: {},
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a MIME type is a supported image type.
 */
export function isSupportedImageType(mimeType: string): mimeType is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as SupportedImageType)
}

/**
 * Get file extension for a MIME type.
 */
export function getExtensionForMimeType(mimeType: SupportedImageType): string {
  return MIME_TO_EXTENSION[mimeType]
}

/**
 * Get MIME type for a file extension.
 */
export function getMimeTypeForExtension(extension: string): SupportedImageType | null {
  const ext = extension.toLowerCase().replace(/^\./, '')
  return EXTENSION_TO_MIME[ext] ?? null
}
