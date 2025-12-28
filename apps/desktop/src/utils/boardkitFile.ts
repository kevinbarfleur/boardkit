import JSZip from 'jszip'
import { save, open } from '@tauri-apps/plugin-dialog'
import { readFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import type { BoardkitDocument } from '@boardkit/core'

const PACKAGE_JSON_NAME = 'package.json'
const BOARD_JSON_NAME = 'board.json'

interface PackageJson {
  name: string
  version: string
  boardkit: {
    formatVersion: number
    createdWith: string
  }
}

/**
 * Export a BoardkitDocument to a .boardkit file (ZIP container)
 */
export async function exportBoardkit(document: BoardkitDocument): Promise<Uint8Array> {
  const zip = new JSZip()

  // Create package.json
  const packageJson: PackageJson = {
    name: document.meta.title.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    boardkit: {
      formatVersion: document.version,
      createdWith: 'Boardkit Desktop v0.1.0',
    },
  }

  zip.file(PACKAGE_JSON_NAME, JSON.stringify(packageJson, null, 2))
  zip.file(BOARD_JSON_NAME, JSON.stringify(document, null, 2))

  // Generate ZIP as Uint8Array
  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

/**
 * Import a .boardkit file and return the BoardkitDocument
 */
export async function importBoardkit(data: Uint8Array): Promise<BoardkitDocument> {
  const zip = await JSZip.loadAsync(data)

  // Check for board.json
  const boardJsonFile = zip.file(BOARD_JSON_NAME)
  if (!boardJsonFile) {
    throw new Error('Invalid .boardkit file: missing board.json')
  }

  // Parse board.json
  const boardJsonContent = await boardJsonFile.async('string')
  const document = JSON.parse(boardJsonContent) as BoardkitDocument

  // Validate basic structure
  if (typeof document.version !== 'number') {
    throw new Error('Invalid .boardkit file: missing version')
  }
  if (!document.meta || !document.board || !document.modules) {
    throw new Error('Invalid .boardkit file: incomplete structure')
  }

  return document
}

/**
 * Save a .boardkit file using Tauri's file dialog
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
  await writeFile(path, data)
  return true
}

/**
 * Open a .boardkit file using Tauri's file dialog
 */
export async function openFromFile(): Promise<BoardkitDocument | null> {
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
 * Get the path to the local autosave directory
 */
export function getAutosaveDir(): string {
  return 'boardkit-autosave'
}

/**
 * Save document to local autosave
 */
export async function saveToAutosave(documentId: string, document: BoardkitDocument): Promise<void> {
  const dir = getAutosaveDir()
  const data = JSON.stringify(document, null, 2)
  const encoder = new TextEncoder()
  await writeFile(`${dir}/${documentId}.json`, encoder.encode(data), { baseDir: BaseDirectory.AppLocalData })
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
