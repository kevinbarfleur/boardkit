import { ref, computed, shallowRef } from 'vue'
import { useStorage } from '@vueuse/core'
import { open } from '@tauri-apps/plugin-dialog'
import {
  readDir,
  readFile,
  writeFile,
  rename,
  remove,
  exists,
  mkdir,
  stat,
} from '@tauri-apps/plugin-fs'
import {
  type BoardkitDocument,
  validateDocument,
  DocumentValidationError,
} from '@boardkit/core'
import { exportBoardkit, importBoardkit } from '../utils/boardkitFile'

const VAULT_PATH_KEY = 'boardkit:vault-path'
const WATCH_INTERVAL = 2000 // 2 seconds

export interface VaultFile {
  name: string           // filename without extension
  path: string           // full path
  modifiedAt: number     // mtime timestamp
}

// Shared state across all composable instances
const vaultPath = useStorage<string | null>(VAULT_PATH_KEY, null)
const files = shallowRef<VaultFile[]>([])
const activeFilePath = ref<string | null>(null)
const isWatching = ref(false)
const lastKnownMtime = ref<number | null>(null)
let watchInterval: ReturnType<typeof setInterval> | null = null

export function useVault() {
  // ============================================================================
  // Computed State
  // ============================================================================

  const isConfigured = computed(() => vaultPath.value !== null)

  const vaultName = computed(() => {
    if (!vaultPath.value) return null
    const parts = vaultPath.value.split('/')
    return parts[parts.length - 1] || 'Vault'
  })

  const activeFile = computed(() => {
    if (!activeFilePath.value) return null
    return files.value.find((f) => f.path === activeFilePath.value) || null
  })

  // ============================================================================
  // Vault Setup
  // ============================================================================

  /**
   * Open folder dialog to select vault folder
   */
  async function selectVaultFolder(): Promise<string | null> {
    const path = await open({
      directory: true,
      multiple: false,
      title: 'Select Vault Folder',
    })

    if (!path || typeof path !== 'string') return null

    vaultPath.value = path
    await scanVaultFiles()

    return path
  }

  /**
   * Create a new vault folder
   */
  async function createVaultFolder(path: string): Promise<boolean> {
    try {
      const folderExists = await exists(path)
      if (!folderExists) {
        await mkdir(path, { recursive: true })
      }
      vaultPath.value = path
      files.value = []
      return true
    } catch (error) {
      console.error('Failed to create vault folder:', error)
      return false
    }
  }

  /**
   * Clear vault configuration
   */
  function clearVault(): void {
    stopWatching()
    vaultPath.value = null
    files.value = []
    activeFilePath.value = null
    lastKnownMtime.value = null
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  /**
   * Scan vault folder for .boardkit files
   */
  async function scanVaultFiles(): Promise<void> {
    if (!vaultPath.value) {
      files.value = []
      return
    }

    try {
      const entries = await readDir(vaultPath.value)
      const vaultFiles: VaultFile[] = []

      for (const entry of entries) {
        // Check for .boardkit files - isFile might be undefined in some Tauri versions
        const name = entry.name
        if (name?.endsWith('.boardkit')) {
          const filePath = `${vaultPath.value}/${name}`
          try {
            const fileStat = await stat(filePath)
            // Only add if it's actually a file (not a directory)
            if (fileStat.isFile) {
              vaultFiles.push({
                name: name.replace('.boardkit', ''),
                path: filePath,
                modifiedAt: fileStat.mtime?.getTime() ?? Date.now(),
              })
            }
          } catch (e) {
            console.warn('Failed to stat file:', filePath, e)
          }
        }
      }

      // Sort by modification time, newest first
      vaultFiles.sort((a, b) => b.modifiedAt - a.modifiedAt)
      files.value = vaultFiles
    } catch (error) {
      console.error('Failed to scan vault:', error)
      files.value = []
    }
  }

  /**
   * Create a new .boardkit file in the vault
   */
  async function createFile(name: string, document: BoardkitDocument): Promise<string | null> {
    if (!vaultPath.value) {
      console.error('createFile: No vault path configured')
      return null
    }

    const safeName = name.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'Untitled'
    let finalName = safeName
    let counter = 1

    // Ensure unique filename
    while (files.value.some((f) => f.name === finalName)) {
      finalName = `${safeName} ${counter}`
      counter++
    }

    const filePath = `${vaultPath.value}/${finalName}.boardkit`

    try {
      console.log('Creating file:', filePath)
      const data = await exportBoardkit(document)
      console.log('Exported boardkit, size:', data.length)
      await writeFileAtomically(filePath, data)
      console.log('File written successfully')
      await scanVaultFiles()
      console.log('Scan complete, files:', files.value.length)

      activeFilePath.value = filePath
      lastKnownMtime.value = Date.now()

      return filePath
    } catch (error) {
      console.error('Failed to create file:', error)
      throw error // Re-throw so caller knows it failed
    }
  }

  /**
   * Save document to a specific file path
   */
  async function saveFile(filePath: string, document: BoardkitDocument): Promise<boolean> {
    try {
      const data = await exportBoardkit(document)
      await writeFileAtomically(filePath, data)

      // Update mtime tracking
      const fileStat = await stat(filePath)
      lastKnownMtime.value = fileStat.mtime?.getTime() ?? Date.now()

      // Refresh file list to update modified times
      await scanVaultFiles()

      return true
    } catch (error) {
      console.error('Failed to save file:', error)
      return false
    }
  }

  /**
   * Load document from a file path
   */
  async function loadFile(filePath: string): Promise<BoardkitDocument | null> {
    try {
      const data = await readFile(filePath)
      const document = await importBoardkit(data)

      activeFilePath.value = filePath

      // Track file modification time
      const fileStat = await stat(filePath)
      lastKnownMtime.value = fileStat.mtime?.getTime() ?? Date.now()

      return document
    } catch (error) {
      console.error('Failed to load file:', error)
      if (error instanceof DocumentValidationError) {
        throw error
      }
      return null
    }
  }

  /**
   * Delete a file from the vault
   */
  async function deleteFile(filePath: string): Promise<boolean> {
    try {
      await remove(filePath)

      // If this was the active file, clear it
      if (activeFilePath.value === filePath) {
        activeFilePath.value = null
        lastKnownMtime.value = null
      }

      await scanVaultFiles()
      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  /**
   * Rename a file in the vault
   */
  async function renameFile(oldPath: string, newName: string): Promise<string | null> {
    if (!vaultPath.value) return null

    const safeName = newName.replace(/[^a-zA-Z0-9-_\s]/g, '').trim()
    if (!safeName) return null

    const newPath = `${vaultPath.value}/${safeName}.boardkit`

    // Check if new name already exists (and is not the same file)
    if (oldPath !== newPath && (await exists(newPath))) {
      console.error('File with that name already exists')
      return null
    }

    try {
      await rename(oldPath, newPath)

      // Update active file reference if needed
      if (activeFilePath.value === oldPath) {
        activeFilePath.value = newPath
      }

      await scanVaultFiles()
      return newPath
    } catch (error) {
      console.error('Failed to rename file:', error)
      return null
    }
  }

  /**
   * Duplicate a file in the vault
   */
  async function duplicateFile(filePath: string): Promise<string | null> {
    if (!vaultPath.value) return null

    try {
      // Load the original document
      const data = await readFile(filePath)
      const document = await importBoardkit(data)

      // Find the original name and create a new name
      const originalFile = files.value.find((f) => f.path === filePath)
      const baseName = originalFile?.name || 'Untitled'

      // Generate a unique name with "Copy" suffix
      let copyName = `${baseName} Copy`
      let counter = 2
      while (files.value.some((f) => f.name === copyName)) {
        copyName = `${baseName} Copy ${counter}`
        counter++
      }

      // Update document title
      document.meta.title = copyName
      document.meta.createdAt = Date.now()
      document.meta.updatedAt = Date.now()

      // Save as new file
      const newPath = `${vaultPath.value}/${copyName}.boardkit`
      const newData = await exportBoardkit(document)
      await writeFileAtomically(newPath, newData)

      await scanVaultFiles()

      return newPath
    } catch (error) {
      console.error('Failed to duplicate file:', error)
      return null
    }
  }

  // ============================================================================
  // File Watching
  // ============================================================================

  /**
   * Check if the active file was modified externally
   * Returns the new document if modified, null otherwise
   */
  async function checkForExternalChanges(): Promise<{
    changed: boolean
    document: BoardkitDocument | null
    mtime: number
  }> {
    if (!activeFilePath.value || lastKnownMtime.value === null) {
      return { changed: false, document: null, mtime: 0 }
    }

    try {
      const fileStat = await stat(activeFilePath.value)
      const currentMtime = fileStat.mtime?.getTime() ?? 0

      if (currentMtime > lastKnownMtime.value) {
        // File was modified externally
        const data = await readFile(activeFilePath.value)
        const document = await importBoardkit(data)
        return { changed: true, document, mtime: currentMtime }
      }

      return { changed: false, document: null, mtime: currentMtime }
    } catch {
      return { changed: false, document: null, mtime: 0 }
    }
  }

  /**
   * Start watching for file changes
   */
  function startWatching(onExternalChange: (document: BoardkitDocument) => void): void {
    if (isWatching.value) return

    isWatching.value = true

    watchInterval = setInterval(async () => {
      // Refresh file list (detect new/deleted files)
      await scanVaultFiles()

      // Check for external changes to active file
      const result = await checkForExternalChanges()
      if (result.changed && result.document) {
        lastKnownMtime.value = result.mtime
        onExternalChange(result.document)
      }
    }, WATCH_INTERVAL)
  }

  /**
   * Stop watching for file changes
   */
  function stopWatching(): void {
    if (watchInterval) {
      clearInterval(watchInterval)
      watchInterval = null
    }
    isWatching.value = false
  }

  /**
   * Update the known mtime (call after saving)
   */
  function updateLastKnownMtime(mtime: number): void {
    lastKnownMtime.value = mtime
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Atomically write data to a file
   */
  async function writeFileAtomically(path: string, data: Uint8Array): Promise<void> {
    const tempPath = `${path}.tmp`

    // 1. Write to temporary file
    await writeFile(tempPath, data)

    // 2. Remove original file if exists
    try {
      const originalExists = await exists(path)
      if (originalExists) {
        await remove(path)
      }
    } catch {
      // Ignore if original doesn't exist
    }

    // 3. Rename temp to final (atomic on most filesystems)
    await rename(tempPath, path)
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    vaultPath,
    files,
    activeFilePath,
    isWatching,
    lastKnownMtime,

    // Computed
    isConfigured,
    vaultName,
    activeFile,

    // Vault Setup
    selectVaultFolder,
    createVaultFolder,
    clearVault,

    // File Operations
    scanVaultFiles,
    createFile,
    saveFile,
    loadFile,
    deleteFile,
    renameFile,
    duplicateFile,

    // File Watching
    startWatching,
    stopWatching,
    checkForExternalChanges,
    updateLastKnownMtime,
  }
}
