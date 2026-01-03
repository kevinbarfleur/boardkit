import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { nanoid } from 'nanoid'
import { useBoardStore } from './boardStore'
import type { Asset, SupportedImageType } from '../types/asset'
import {
  SUPPORTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  isSupportedImageType,
  getExtensionForMimeType,
} from '../types/asset'
import type { ImageElement } from '../types/element'

/**
 * Asset Store
 *
 * Manages binary assets (images) for the current document.
 * Assets are stored in memory and synced to the document's asset registry.
 *
 * Key responsibilities:
 * - Store and retrieve asset blobs
 * - Generate and manage blob URLs for rendering
 * - Content-based deduplication via SHA-256 hashing
 * - Orphan detection (assets not referenced by any element)
 */
export const useAssetStore = defineStore('assets', () => {
  const boardStore = useBoardStore()

  // ============================================================================
  // State
  // ============================================================================

  /** Map of assetId -> Blob (in-memory storage during session) */
  const blobs = shallowRef<Map<string, Blob>>(new Map())

  /** Map of assetId -> blob URL (for rendering) */
  const blobUrls = shallowRef<Map<string, string>>(new Map())

  /** Map of content hash -> assetId (for deduplication) */
  const hashIndex = shallowRef<Map<string, string>>(new Map())

  /** Loading state for async operations */
  const isLoading = ref(false)

  /** Version counter for reactivity (incremented on every change) */
  const version = ref(0)

  // ============================================================================
  // Computed
  // ============================================================================

  /** Asset registry from document */
  const registry = computed(() => boardStore.document?.assets ?? { assets: {} })

  /** All asset IDs in the registry */
  const assetIds = computed(() => Object.keys(registry.value.assets))

  /** Number of assets */
  const assetCount = computed(() => assetIds.value.length)

  // ============================================================================
  // Core Operations
  // ============================================================================

  /**
   * Compute SHA-256 hash of a blob for deduplication.
   */
  async function hashBlob(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Register a new asset from a blob.
   * Returns the assetId (existing if duplicate, new if unique).
   */
  async function registerAsset(
    blob: Blob,
    filename: string
  ): Promise<{ assetId: string; isNew: boolean }> {
    // Validate MIME type
    if (!isSupportedImageType(blob.type)) {
      throw new Error(`Unsupported image type: ${blob.type}`)
    }

    // Validate size
    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`)
    }

    // Compute hash for deduplication
    const hash = await hashBlob(blob)

    // Check for existing asset with same content
    const existingId = hashIndex.value.get(hash)
    if (existingId && blobs.value.has(existingId)) {
      return { assetId: existingId, isNew: false }
    }

    // Create new asset
    const assetId = nanoid()

    const asset: Asset = {
      id: assetId,
      filename,
      mimeType: blob.type as SupportedImageType,
      size: blob.size,
      hash,
      createdAt: Date.now(),
    }

    // Store blob in memory
    const newBlobs = new Map(blobs.value)
    newBlobs.set(assetId, blob)
    blobs.value = newBlobs

    // Update hash index
    const newHashIndex = new Map(hashIndex.value)
    newHashIndex.set(hash, assetId)
    hashIndex.value = newHashIndex

    // Increment version for reactivity
    version.value++

    // Add to document registry
    const doc = boardStore.document
    if (doc) {
      if (!doc.assets) {
        doc.assets = { assets: {} }
      }
      doc.assets.assets[assetId] = asset
      boardStore.markDirty('Added asset')
    }

    return { assetId, isNew: true }
  }

  /**
   * Get a blob by asset ID.
   */
  function getBlob(assetId: string): Blob | null {
    return blobs.value.get(assetId) ?? null
  }

  /**
   * Get or create a blob URL for an asset.
   * URLs are cached and reused for performance.
   */
  function getBlobUrl(assetId: string): string | null {
    // Check cache first
    const cached = blobUrls.value.get(assetId)
    if (cached) {
      return cached
    }

    // Get blob
    const blob = getBlob(assetId)
    if (!blob) {
      return null
    }

    // Create and cache URL
    const url = URL.createObjectURL(blob)
    const newUrls = new Map(blobUrls.value)
    newUrls.set(assetId, url)
    blobUrls.value = newUrls

    return url
  }

  /**
   * Get asset metadata by ID.
   */
  function getAsset(assetId: string): Asset | null {
    return registry.value.assets[assetId] ?? null
  }

  /**
   * Remove an asset by ID.
   * Also cleans up blob URL and hash index.
   */
  function removeAsset(assetId: string): boolean {
    const asset = getAsset(assetId)
    if (!asset) {
      return false
    }

    // Revoke blob URL if exists
    const url = blobUrls.value.get(assetId)
    if (url) {
      URL.revokeObjectURL(url)
      const newUrls = new Map(blobUrls.value)
      newUrls.delete(assetId)
      blobUrls.value = newUrls
    }

    // Remove from blobs
    const newBlobs = new Map(blobs.value)
    newBlobs.delete(assetId)
    blobs.value = newBlobs

    // Remove from hash index
    const newHashIndex = new Map(hashIndex.value)
    newHashIndex.delete(asset.hash)
    hashIndex.value = newHashIndex

    // Remove from document registry
    const doc = boardStore.document
    if (doc?.assets) {
      delete doc.assets.assets[assetId]
      boardStore.markDirty('Removed asset')
    }

    return true
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Load assets from blobs (for import/restore).
   * Used when importing a .boardkit file.
   */
  async function loadAssets(assetBlobs: Map<string, Blob>): Promise<void> {
    isLoading.value = true
    try {
      // Clear existing state
      revokeAllUrls()
      blobs.value = new Map()
      hashIndex.value = new Map()

      // Rebuild hash index from registry
      const newBlobs = new Map<string, Blob>()
      const newHashIndex = new Map<string, string>()

      for (const [assetId, blob] of assetBlobs) {
        const asset = registry.value.assets[assetId]
        if (asset) {
          newBlobs.set(assetId, blob)
          newHashIndex.set(asset.hash, assetId)
        }
      }

      blobs.value = newBlobs
      hashIndex.value = newHashIndex

      // Increment version for reactivity
      version.value++
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get all asset blobs for export.
   */
  function getAllBlobs(): Map<string, Blob> {
    return new Map(blobs.value)
  }

  /**
   * Revoke all blob URLs (cleanup on document close).
   */
  function revokeAllUrls(): void {
    for (const url of blobUrls.value.values()) {
      URL.revokeObjectURL(url)
    }
    blobUrls.value = new Map()
  }

  /**
   * Clear all assets (for document close/reset).
   */
  function clear(): void {
    revokeAllUrls()
    blobs.value = new Map()
    hashIndex.value = new Map()
  }

  // ============================================================================
  // Orphan Detection
  // ============================================================================

  /**
   * Get all asset IDs that are not referenced by any image element.
   */
  function getOrphanAssetIds(): string[] {
    const doc = boardStore.document
    if (!doc) {
      return []
    }

    // Collect all referenced asset IDs from image elements
    const referencedIds = new Set<string>()
    for (const element of doc.board.elements) {
      if (element.type === 'image') {
        referencedIds.add((element as ImageElement).assetId)
      }
    }

    // Find orphans
    return assetIds.value.filter((id) => !referencedIds.has(id))
  }

  /**
   * Remove all orphan assets.
   * Returns the number of removed assets.
   */
  function cleanupOrphans(): number {
    const orphanIds = getOrphanAssetIds()
    for (const id of orphanIds) {
      removeAsset(id)
    }
    return orphanIds.length
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Validate an image file before import.
   */
  function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!isSupportedImageType(file.type)) {
      const supported = SUPPORTED_IMAGE_TYPES.join(', ')
      return { valid: false, error: `Unsupported type. Supported: ${supported}` }
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const maxMB = MAX_IMAGE_SIZE / 1024 / 1024
      return { valid: false, error: `File too large. Maximum: ${maxMB}MB` }
    }

    return { valid: true }
  }

  /**
   * Get image dimensions from a blob.
   */
  async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Get file extension for an asset.
   */
  function getAssetExtension(assetId: string): string | null {
    const asset = getAsset(assetId)
    if (!asset) {
      return null
    }
    return getExtensionForMimeType(asset.mimeType)
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State (read-only)
    registry,
    assetIds,
    assetCount,
    isLoading,
    version,

    // Core operations
    registerAsset,
    getBlob,
    getBlobUrl,
    getAsset,
    removeAsset,

    // Batch operations
    loadAssets,
    getAllBlobs,
    revokeAllUrls,
    clear,

    // Orphan detection
    getOrphanAssetIds,
    cleanupOrphans,

    // Utilities
    validateImageFile,
    getImageDimensions,
    getAssetExtension,
    hashBlob,
  }
})
