import JSZip from 'jszip'
import {
  type BoardkitDocument,
  type ImageElement,
  type Asset,
  validateDocument,
  DocumentValidationError,
  getExtensionForMimeType,
  getMimeTypeForExtension,
} from '@boardkit/core'

const PACKAGE_JSON_NAME = 'package.json'
const BOARD_JSON_NAME = 'board.json'
const ASSETS_FOLDER = 'assets'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface PackageJson {
  name: string
  version: string
  boardkit: {
    formatVersion: number
    createdWith: string
  }
}

/**
 * Result of importing a .boardkit file.
 * Includes the document and any embedded assets.
 */
export interface ImportResult {
  document: BoardkitDocument
  assets: Map<string, Blob>
}

/**
 * Get referenced asset IDs from a document (those used by image elements).
 */
function getReferencedAssetIds(document: BoardkitDocument): Set<string> {
  const ids = new Set<string>()
  for (const element of document.board.elements) {
    if (element.type === 'image') {
      ids.add((element as ImageElement).assetId)
    }
  }
  return ids
}

/**
 * Clean up orphan assets from a document.
 * Returns a new document with only referenced assets.
 */
function cleanupOrphanAssets(document: BoardkitDocument): BoardkitDocument {
  if (!document.assets) {
    return document
  }

  const referencedIds = getReferencedAssetIds(document)
  const cleanedAssets: Record<string, Asset> = {}

  for (const [id, asset] of Object.entries(document.assets.assets)) {
    if (referencedIds.has(id)) {
      cleanedAssets[id] = asset
    }
  }

  return {
    ...document,
    assets: { assets: cleanedAssets },
  }
}

/**
 * Export a BoardkitDocument to a .boardkit file (ZIP container)
 *
 * @param document - The document to export
 * @param assetBlobs - Map of assetId -> Blob for embedded assets
 */
export async function exportBoardkit(
  document: BoardkitDocument,
  assetBlobs?: Map<string, Blob>
): Promise<Blob> {
  const zip = new JSZip()

  // Clean up orphan assets before export
  const cleanedDocument = cleanupOrphanAssets(document)
  const referencedIds = getReferencedAssetIds(cleanedDocument)

  // Create package.json
  const packageJson: PackageJson = {
    name: cleanedDocument.meta.title.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    boardkit: {
      formatVersion: cleanedDocument.version,
      createdWith: 'Boardkit Web v0.1.0',
    },
  }

  zip.file(PACKAGE_JSON_NAME, JSON.stringify(packageJson, null, 2))
  zip.file(BOARD_JSON_NAME, JSON.stringify(cleanedDocument, null, 2))

  // Add assets folder if there are assets
  if (assetBlobs && cleanedDocument.assets) {
    const assetsFolder = zip.folder(ASSETS_FOLDER)
    if (assetsFolder) {
      for (const [assetId, blob] of assetBlobs) {
        // Only include referenced assets
        if (!referencedIds.has(assetId)) {
          continue
        }

        const asset = cleanedDocument.assets.assets[assetId]
        if (asset) {
          const extension = getExtensionForMimeType(asset.mimeType)
          assetsFolder.file(`${assetId}.${extension}`, blob)
        }
      }
    }
  }

  // Generate ZIP blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

/**
 * Import a .boardkit file and return the BoardkitDocument with assets.
 */
export async function importBoardkit(file: File): Promise<ImportResult> {
  // Check file size before processing
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
  }

  const zip = await JSZip.loadAsync(file)

  // Check for board.json
  const boardJsonFile = zip.file(BOARD_JSON_NAME)
  if (!boardJsonFile) {
    throw new Error('Invalid .boardkit file: missing board.json')
  }

  // Parse board.json
  const boardJsonContent = await boardJsonFile.async('string')
  let parsedData: unknown

  try {
    parsedData = JSON.parse(boardJsonContent)
  } catch {
    throw new Error('Invalid .boardkit file: corrupted JSON')
  }

  // Validate document structure
  let document: BoardkitDocument
  try {
    document = validateDocument(parsedData)
  } catch (error) {
    if (error instanceof DocumentValidationError) {
      throw new Error(`Invalid .boardkit file: ${error.message}`)
    }
    throw error
  }

  // Extract assets from assets/ folder
  const assets = new Map<string, Blob>()
  const assetsFolder = zip.folder(ASSETS_FOLDER)

  if (assetsFolder) {
    const assetFiles = assetsFolder.filter((_, file) => !file.dir)

    for (const relativePath in assetFiles) {
      const file = assetsFolder.file(relativePath)
      if (file) {
        // Extract assetId from filename (e.g., "abc123.png" -> "abc123")
        const filename = file.name.split('/').pop() ?? ''
        const dotIndex = filename.lastIndexOf('.')
        const assetId = dotIndex > 0 ? filename.substring(0, dotIndex) : filename
        const extension = dotIndex > 0 ? filename.substring(dotIndex + 1) : ''

        // Get MIME type from extension
        const mimeType = getMimeTypeForExtension(extension)
        if (mimeType) {
          const data = await file.async('blob')
          const typedBlob = new Blob([data], { type: mimeType })
          assets.set(assetId, typedBlob)
        }
      }
    }
  }

  // Also check for files directly in assets folder using different method
  zip.forEach((relativePath, zipEntry) => {
    if (relativePath.startsWith(`${ASSETS_FOLDER}/`) && !zipEntry.dir) {
      // Already processed above, skip
    }
  })

  // Process assets using forEach for more reliable iteration
  const assetPromises: Promise<void>[] = []
  zip.forEach((relativePath, zipEntry) => {
    if (relativePath.startsWith(`${ASSETS_FOLDER}/`) && !zipEntry.dir) {
      const filename = relativePath.split('/').pop() ?? ''
      const dotIndex = filename.lastIndexOf('.')
      const assetId = dotIndex > 0 ? filename.substring(0, dotIndex) : filename
      const extension = dotIndex > 0 ? filename.substring(dotIndex + 1) : ''

      const mimeType = getMimeTypeForExtension(extension)
      if (mimeType && !assets.has(assetId)) {
        assetPromises.push(
          zipEntry.async('blob').then((data) => {
            const typedBlob = new Blob([data], { type: mimeType })
            assets.set(assetId, typedBlob)
          })
        )
      }
    }
  })

  await Promise.all(assetPromises)

  return { document, assets }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Trigger file picker for importing .boardkit files
 */
export function openFilePicker(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.boardkit'

    input.onchange = () => {
      const file = input.files?.[0] ?? null
      resolve(file)
    }

    input.oncancel = () => {
      resolve(null)
    }

    input.click()
  })
}

/**
 * Trigger file picker for importing image files.
 * Supports multiple selection.
 */
export function openImagePicker(multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
    input.multiple = multiple

    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : []
      resolve(files)
    }

    input.oncancel = () => {
      resolve([])
    }

    input.click()
  })
}
