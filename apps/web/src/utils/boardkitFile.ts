import JSZip from 'jszip'
import type { BoardkitDocument } from '@boardkit/core'

const PACKAGE_JSON_NAME = 'package.json'
const BOARD_JSON_NAME = 'board.json'
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
 * Export a BoardkitDocument to a .boardkit file (ZIP container)
 */
export async function exportBoardkit(document: BoardkitDocument): Promise<Blob> {
  const zip = new JSZip()

  // Create package.json
  const packageJson: PackageJson = {
    name: document.meta.title.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    boardkit: {
      formatVersion: document.version,
      createdWith: 'Boardkit Web v0.1.0',
    },
  }

  zip.file(PACKAGE_JSON_NAME, JSON.stringify(packageJson, null, 2))
  zip.file(BOARD_JSON_NAME, JSON.stringify(document, null, 2))

  // Generate ZIP blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

/**
 * Import a .boardkit file and return the BoardkitDocument
 */
export async function importBoardkit(file: File): Promise<BoardkitDocument> {
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
