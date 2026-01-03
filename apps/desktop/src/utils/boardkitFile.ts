import JSZip from 'jszip'
import { save, open } from '@tauri-apps/plugin-dialog'
import { readFile, writeFile, rename, remove, BaseDirectory, exists } from '@tauri-apps/plugin-fs'
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
): Promise<Uint8Array> {
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
      createdWith: 'Boardkit Desktop v0.1.0',
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
          // Convert Blob to ArrayBuffer for JSZip
          const arrayBuffer = await blob.arrayBuffer()
          assetsFolder.file(`${assetId}.${extension}`, arrayBuffer)
        }
      }
    }
  }

  // Generate ZIP as Uint8Array
  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

/**
 * Import a .boardkit file and return the BoardkitDocument with assets.
 */
export async function importBoardkit(data: Uint8Array): Promise<ImportResult> {
  // Check file size before processing
  if (data.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
  }

  const zip = await JSZip.loadAsync(data)

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

  // Process assets using forEach for reliable iteration
  const assetPromises: Promise<void>[] = []
  zip.forEach((relativePath, zipEntry) => {
    if (relativePath.startsWith(`${ASSETS_FOLDER}/`) && !zipEntry.dir) {
      const filename = relativePath.split('/').pop() ?? ''
      const dotIndex = filename.lastIndexOf('.')
      const assetId = dotIndex > 0 ? filename.substring(0, dotIndex) : filename
      const extension = dotIndex > 0 ? filename.substring(dotIndex + 1) : ''

      const mimeType = getMimeTypeForExtension(extension)
      if (mimeType) {
        assetPromises.push(
          zipEntry.async('arraybuffer').then((data) => {
            const blob = new Blob([data], { type: mimeType })
            assets.set(assetId, blob)
          })
        )
      }
    }
  })

  await Promise.all(assetPromises)

  return { document, assets }
}

/**
 * Save a .boardkit file using Tauri's file dialog (uses atomic writes)
 */
export async function saveToFile(document: BoardkitDocument): Promise<boolean> {
  const filename = `${document.meta.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.boardkit`

  const path = await save({
    defaultPath: filename,
    filters: [
      {
        name: 'Boardkit',
        extensions: ['boardkit'],
      },
    ],
  })

  if (!path) return false

  const data = await exportBoardkit(document)
  await writeFileAtomically(path, data)
  return true
}

/**
 * Open a .boardkit file using Tauri's file dialog
 */
export async function openFromFile(): Promise<ImportResult | null> {
  const path = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Boardkit',
        extensions: ['boardkit'],
      },
    ],
  })

  if (!path) return null

  const data = await readFile(path as string)
  return await importBoardkit(data)
}

/**
 * Open image files using Tauri's file dialog.
 */
export async function openImageFiles(): Promise<string[] | null> {
  const paths = await open({
    multiple: true,
    directory: false,
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
      },
    ],
  })

  if (!paths) return null
  return Array.isArray(paths) ? paths : [paths]
}

/**
 * Get the path to the local autosave directory
 */
export function getAutosaveDir(): string {
  return 'boardkit-autosave'
}

/**
 * Atomically write data to a file.
 * Uses a write-then-rename pattern to prevent data corruption if the write is interrupted.
 */
async function writeFileAtomically(
  path: string,
  data: Uint8Array,
  options: { baseDir?: BaseDirectory } = {}
): Promise<void> {
  const tempPath = `${path}.tmp`

  // 1. Write to temporary file
  await writeFile(tempPath, data, options)

  // 2. Remove original file if exists (for rename to work on some systems)
  try {
    const originalExists = await exists(path, options)
    if (originalExists) {
      await remove(path, options)
    }
  } catch {
    // Ignore if original doesn't exist
  }

  // 3. Rename temp to final (atomic on most filesystems)
  // Use options as-is since we've already written with baseDir, rename should respect it
  await rename(tempPath, path, options as Parameters<typeof rename>[2])
}

/**
 * Save document to local autosave (uses atomic writes)
 */
export async function saveToAutosave(documentId: string, document: BoardkitDocument): Promise<void> {
  const dir = getAutosaveDir()
  const data = JSON.stringify(document, null, 2)
  const encoder = new TextEncoder()
  await writeFileAtomically(`${dir}/${documentId}.json`, encoder.encode(data), {
    baseDir: BaseDirectory.AppLocalData,
  })
}

/**
 * Load document from local autosave
 */
export async function loadFromAutosave(documentId: string): Promise<BoardkitDocument | null> {
  try {
    const dir = getAutosaveDir()
    const data = await readFile(`${dir}/${documentId}.json`, { baseDir: BaseDirectory.AppLocalData })
    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(data)) as BoardkitDocument
  } catch {
    return null
  }
}

// ============================================================================
// History System
// ============================================================================

const HISTORY_DIR = 'history'
const MAX_HISTORY_ENTRIES = 100

export interface HistoryEntry {
  id: string
  timestamp: number
  action: string
}

/**
 * Get the history directory path for a document
 */
export function getHistoryDir(documentId: string): string {
  return `${getAutosaveDir()}/${documentId}/${HISTORY_DIR}`
}

/**
 * Save a history snapshot for undo/redo
 */
export async function saveToHistory(
  documentId: string,
  action: string,
  document: BoardkitDocument
): Promise<string> {
  const historyDir = getHistoryDir(documentId)
  const timestamp = Date.now()
  const entryId = `${timestamp}-${action.replace(/\s+/g, '_').toLowerCase()}`
  const filename = `${entryId}.json`

  const data = JSON.stringify(document, null, 2)
  const encoder = new TextEncoder()

  await writeFileAtomically(`${historyDir}/${filename}`, encoder.encode(data), {
    baseDir: BaseDirectory.AppLocalData,
  })

  // Prune old entries if needed
  await pruneHistory(documentId)

  return entryId
}

/**
 * Get list of history entries for a document
 */
export async function getHistoryEntries(documentId: string): Promise<HistoryEntry[]> {
  try {
    const { readDir } = await import('@tauri-apps/plugin-fs')
    const historyDir = getHistoryDir(documentId)

    const dirExists = await exists(historyDir, { baseDir: BaseDirectory.AppLocalData })
    if (!dirExists) {
      return []
    }

    const entries = await readDir(historyDir, { baseDir: BaseDirectory.AppLocalData })

    const historyEntries: HistoryEntry[] = entries
      .filter((entry) => entry.name?.endsWith('.json'))
      .map((entry) => {
        const name = entry.name!.replace('.json', '')
        const parts = name.split('-')
        const timestamp = parseInt(parts[0], 10)
        const action = parts.slice(1).join(' ').replace(/_/g, ' ')

        return {
          id: name,
          timestamp,
          action,
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp) // Newest first

    return historyEntries
  } catch {
    return []
  }
}

/**
 * Load a specific history entry
 */
export async function loadHistoryEntry(
  documentId: string,
  entryId: string
): Promise<BoardkitDocument | null> {
  try {
    const historyDir = getHistoryDir(documentId)
    const data = await readFile(`${historyDir}/${entryId}.json`, {
      baseDir: BaseDirectory.AppLocalData,
    })
    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(data)) as BoardkitDocument
  } catch {
    return null
  }
}

/**
 * Prune old history entries, keeping only the most recent MAX_HISTORY_ENTRIES
 */
export async function pruneHistory(documentId: string): Promise<void> {
  try {
    const entries = await getHistoryEntries(documentId)

    if (entries.length <= MAX_HISTORY_ENTRIES) {
      return
    }

    // Remove oldest entries
    const historyDir = getHistoryDir(documentId)
    const toRemove = entries.slice(MAX_HISTORY_ENTRIES)

    for (const entry of toRemove) {
      try {
        await remove(`${historyDir}/${entry.id}.json`, {
          baseDir: BaseDirectory.AppLocalData,
        })
      } catch {
        // Ignore individual removal errors
      }
    }
  } catch {
    // Ignore pruning errors
  }
}

/**
 * Clear all history for a document
 */
export async function clearHistory(documentId: string): Promise<void> {
  try {
    const entries = await getHistoryEntries(documentId)
    const historyDir = getHistoryDir(documentId)

    for (const entry of entries) {
      try {
        await remove(`${historyDir}/${entry.id}.json`, {
          baseDir: BaseDirectory.AppLocalData,
        })
      } catch {
        // Ignore individual removal errors
      }
    }
  } catch {
    // Ignore clearing errors
  }
}
