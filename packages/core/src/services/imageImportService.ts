import { useAssetStore } from '../stores/assetStore'
import { useBoardStore } from '../stores/boardStore'
import { useToolStore } from '../stores/toolStore'
import { SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE, isSupportedImageType } from '../types/asset'
import type { ImageElement, Point } from '../types/element'

/**
 * Image Import Service
 *
 * Provides high-level functions for importing images into Boardkit.
 * Supports file picker, drag & drop, clipboard paste, and URL import.
 */

// ============================================================================
// Types
// ============================================================================

export interface ImageImportResult {
  assetId: string
  dimensions: { width: number; height: number }
  isNew: boolean
}

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate an image file before import.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!isSupportedImageType(file.type)) {
    const supported = SUPPORTED_IMAGE_TYPES.join(', ')
    return { valid: false, error: `Unsupported image type. Supported: ${supported}` }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const maxMB = MAX_IMAGE_SIZE / 1024 / 1024
    return { valid: false, error: `Image too large. Maximum size: ${maxMB}MB` }
  }

  return { valid: true }
}

/**
 * Validate a blob before import.
 */
export function validateImageBlob(blob: Blob): ImageValidationResult {
  if (!isSupportedImageType(blob.type)) {
    const supported = SUPPORTED_IMAGE_TYPES.join(', ')
    return { valid: false, error: `Unsupported image type. Supported: ${supported}` }
  }

  if (blob.size > MAX_IMAGE_SIZE) {
    const maxMB = MAX_IMAGE_SIZE / 1024 / 1024
    return { valid: false, error: `Image too large. Maximum size: ${maxMB}MB` }
  }

  return { valid: true }
}

// ============================================================================
// Dimension Utilities
// ============================================================================

/**
 * Get image dimensions from a blob.
 */
export function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
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

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import an image file into the current document.
 * Returns the asset ID and image dimensions.
 */
export async function importImageFile(file: File): Promise<ImageImportResult> {
  // Validate first
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const assetStore = useAssetStore()

  // Get dimensions
  const dimensions = await getImageDimensions(file)

  // Register asset
  const { assetId, isNew } = await assetStore.registerAsset(file, file.name)

  return { assetId, dimensions, isNew }
}

/**
 * Import an image from a URL.
 * Returns the asset ID and image dimensions.
 */
export async function importImageFromUrl(url: string): Promise<ImageImportResult> {
  // Fetch the image
  const response = await fetch(url, { mode: 'cors' })

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }

  // Get content type
  const contentType = response.headers.get('content-type') ?? ''
  if (!isSupportedImageType(contentType)) {
    // Try to infer from URL extension
    const urlPath = new URL(url).pathname
    const extension = urlPath.split('.').pop()?.toLowerCase()
    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    }
    if (!extension || !mimeMap[extension]) {
      throw new Error(`Unsupported image type: ${contentType}`)
    }
  }

  const blob = await response.blob()

  // Validate size
  const validation = validateImageBlob(blob)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const assetStore = useAssetStore()

  // Get dimensions
  const dimensions = await getImageDimensions(blob)

  // Extract filename from URL
  const urlPath = new URL(url).pathname
  const filename = urlPath.split('/').pop() || 'image'

  // Register asset
  const { assetId, isNew } = await assetStore.registerAsset(blob, filename)

  return { assetId, dimensions, isNew }
}

/**
 * Import an image from clipboard data.
 * Accepts DataTransferItemList (from paste event clipboardData.items).
 */
export async function importImageFromClipboard(
  items: DataTransferItemList
): Promise<ImageImportResult | null> {
  // Handle DataTransferItemList (from paste event)
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/') && isSupportedImageType(item.type)) {
      const file = item.getAsFile()
      if (file) {
        return await importImageFile(file)
      }
    }
  }

  return null
}

// ============================================================================
// Element Creation
// ============================================================================

/**
 * Create an ImageElement at the specified position.
 * Scales the image to fit within maxDimension while preserving aspect ratio.
 * Returns element data without id and zIndex (boardStore.addElement will assign them).
 */
export function createImageElement(
  assetId: string,
  dimensions: { width: number; height: number },
  position: Point,
  options: {
    maxDimension?: number
  } = {}
): Omit<ImageElement, 'id' | 'zIndex'> {
  const { maxDimension = 400 } = options
  const toolStore = useToolStore()

  // Calculate scaled dimensions
  let { width, height } = dimensions
  const maxSize = Math.max(width, height)
  if (maxSize > maxDimension) {
    const scale = maxDimension / maxSize
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  // Calculate centered position
  const x = position.x - width / 2
  const y = position.y - height / 2

  return {
    type: 'image',
    assetId,
    rect: { x, y, width, height },
    angle: 0,
    style: { ...toolStore.defaultStyle },
    objectFit: 'contain',
    flipX: false,
    flipY: false,
  }
}

/**
 * Import and add an image to the canvas.
 * Combines importing the asset and creating the element.
 * Returns the new element ID.
 */
export async function importAndAddImage(
  file: File,
  position: Point,
  options: { maxDimension?: number } = {}
): Promise<string> {
  const boardStore = useBoardStore()

  // Import the file
  const { assetId, dimensions } = await importImageFile(file)

  // Create and add the element
  const elementData = createImageElement(assetId, dimensions, position, options)
  return boardStore.addElement(elementData)
}

/**
 * Import and add multiple images to the canvas.
 * Positions them in a grid layout.
 * Returns the new element IDs.
 */
export async function importAndAddImages(
  files: File[],
  startPosition: Point,
  options: {
    maxDimension?: number
    spacing?: number
    columns?: number
  } = {}
): Promise<string[]> {
  const { maxDimension = 300, spacing = 20, columns = 3 } = options
  const boardStore = useBoardStore()
  const elementIds: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const col = i % columns
    const row = Math.floor(i / columns)

    const position: Point = {
      x: startPosition.x + col * (maxDimension + spacing),
      y: startPosition.y + row * (maxDimension + spacing),
    }

    try {
      const { assetId, dimensions } = await importImageFile(file)
      const elementData = createImageElement(assetId, dimensions, position, { maxDimension })
      const elementId = boardStore.addElement(elementData)
      elementIds.push(elementId)
    } catch (error) {
      console.warn(`Failed to import image: ${file.name}`, error)
    }
  }

  return elementIds
}
