import { ref, computed, watch } from 'vue'
import { useDebounceFn, useDocumentVisibility, useStorage } from '@vueuse/core'
import { useBoardStore, useAssetStore, type BoardkitDocument } from '@boardkit/core'
import { mkdir, exists } from '@tauri-apps/plugin-fs'
import { useVault } from './useVault'
import {
  saveToFile,
  openFromFile,
  getHistoryDir,
  saveToHistory,
  getHistoryEntries,
  loadHistoryEntry,
  clearHistory,
  type HistoryEntry,
} from '../utils/boardkitFile'

const AUTOSAVE_DELAY = 500 // 500ms debounce for fast saving
const CURRENT_FILE_KEY = 'boardkit:current-file-path'

// Shared state
const currentFilePath = useStorage<string | null>(CURRENT_FILE_KEY, null)
const isLoading = ref(false)
const isSaving = ref(false)
const lastSaved = ref<number | null>(null)

// History state
const historyEntries = ref<HistoryEntry[]>([])
const currentHistoryIndex = ref<number>(-1) // -1 means we're at the latest version

export function usePersistence() {
  const boardStore = useBoardStore()
  const vault = useVault()
  let stopWatch: (() => void) | null = null

  // Track document visibility to pause autosave when window is not visible
  const visibility = useDocumentVisibility()

  // Debounced autosave function using VueUse
  const debouncedSave = useDebounceFn(async () => {
    if (boardStore.isDirty && currentFilePath.value && visibility.value === 'visible') {
      await saveDocument(true)
    }
  }, AUTOSAVE_DELAY)

  // Actions to hide from history display (low-value, high-frequency)
  const hiddenActions = ['initial state', 'moved widget', 'resized widget']

  // Filter out hidden actions from entries
  const filterEntries = (entries: HistoryEntry[]) =>
    entries.filter((e) => !hiddenActions.includes(e.action.toLowerCase()))

  // ==========================================================================
  // History - Now delegated to boardStore's useHistory
  // ==========================================================================

  // Computed: can we undo/redo? (delegated to boardStore)
  const canUndo = computed(() => boardStore.canUndo)
  const canRedo = computed(() => boardStore.canRedo)
  const isAtLive = computed(() => boardStore.isAtLive)

  // Undo entries: entries OLDER than current position (what we can go back to)
  // Timeline: [oldest] A → B → C → [current] → D → E [newest/live]
  // If at index 2 (viewing C), undo shows: B, A (indices 3, 4, ...)
  const undoEntries = computed<HistoryEntry[]>(() => {
    const historyIndex = boardStore.historyIndex
    const stack = boardStore.historyStack

    // If at live state (index -1), show all stack entries
    // If at index N, show entries from N+1 onwards (older entries)
    const startIndex = historyIndex < 0 ? 0 : historyIndex + 1

    const entries: HistoryEntry[] = []
    for (let i = startIndex; i < stack.length; i++) {
      const entry = stack[i]
      entries.push({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.label,
      })
    }
    return entries
  })

  // Redo entries: entries NEWER than current position (what we can go forward to)
  // If at index 2, redo shows: D (index 1), E (index 0), then live
  const redoEntries = computed<HistoryEntry[]>(() => {
    const historyIndex = boardStore.historyIndex
    const stack = boardStore.historyStack

    // If at live state (index -1), nothing to redo
    if (historyIndex < 0) return []

    // Get entries from currentIndex-1 down to 0 (newer entries)
    const entries: HistoryEntry[] = []
    for (let i = historyIndex - 1; i >= 0; i--) {
      const entry = stack[i]
      if (entry) {
        entries.push({
          id: entry.id,
          timestamp: entry.timestamp,
          action: entry.label,
        })
      }
    }

    // Add "live state" as the final redo target
    entries.push({
      id: 'live',
      timestamp: Date.now(),
      action: 'Current state',
    })

    return entries
  })

  // Get document ID from file path for history storage
  function getDocumentId(filePath: string): string {
    // Use a hash of the file path as document ID
    const parts = filePath.split('/')
    const filename = parts[parts.length - 1]?.replace('.boardkit', '') || 'unknown'
    return filename.replace(/[^a-zA-Z0-9-_]/g, '_')
  }

  // Ensure history directory exists for a document
  async function ensureHistoryDir(documentId: string): Promise<void> {
    const dir = getHistoryDir(documentId)
    try {
      const dirExists = await exists(dir, { baseDir: 12 }) // AppLocalData = 12
      if (!dirExists) {
        await mkdir(dir, { baseDir: 12, recursive: true })
      }
    } catch {
      // Directory might already exist
    }
  }

  // Refresh the list of history entries
  async function refreshHistoryEntries(): Promise<void> {
    if (!currentFilePath.value) {
      historyEntries.value = []
      return
    }

    const docId = getDocumentId(currentFilePath.value)

    try {
      historyEntries.value = await getHistoryEntries(docId)
    } catch {
      historyEntries.value = []
    }
  }

  // Add current state to history
  async function addToHistory(action: string): Promise<void> {
    const doc = boardStore.getDocument()
    if (!doc || !currentFilePath.value) return

    const docId = getDocumentId(currentFilePath.value)

    // If we're not at the latest (user went back in history),
    // we reset to latest
    if (currentHistoryIndex.value >= 0) {
      currentHistoryIndex.value = -1
    }

    try {
      await ensureHistoryDir(docId)
      await saveToHistory(docId, action, doc)
      await refreshHistoryEntries()
    } catch (error) {
      console.error('Failed to add to history:', error)
    }
  }

  // Go to a specific history entry (from the UI dropdown)
  async function goToHistoryEntry(entryId: string): Promise<boolean> {
    // Special case: 'live' means return to current state
    if (entryId === 'live') {
      return goToLatest()
    }

    const success = boardStore.goToHistoryEntry(entryId)
    if (success) {
      await saveDocumentInternal()
    }
    return success
  }

  // Undo to previous version (delegated to boardStore)
  async function undo(): Promise<boolean> {
    const success = boardStore.undo()
    if (success) {
      await saveDocumentInternal()
    }
    return success
  }

  // Redo to next version (delegated to boardStore)
  async function redo(): Promise<boolean> {
    const success = boardStore.redo()
    if (success) {
      await saveDocumentInternal()
    }
    return success
  }

  // Return to the live (most recent) state
  async function goToLatest(): Promise<boolean> {
    const success = boardStore.goToLiveState()
    if (success) {
      await saveDocumentInternal()
    }
    return success
  }


  // Create a new document in the vault
  async function createDocument(title: string): Promise<string | null> {
    console.log('createDocument called, vault configured:', vault.isConfigured.value)

    if (!vault.isConfigured.value) {
      console.error('createDocument: Vault not configured')
      return null
    }

    // Create the document in memory first
    boardStore.createNewBoard(title)
    const doc = boardStore.getDocument()
    if (!doc) {
      console.error('createDocument: Failed to create document in store')
      return null
    }

    console.log('Document created in store:', doc.meta.title)

    try {
      // Try to save to vault
      const filePath = await vault.createFile(title, doc)
      if (!filePath) {
        console.error('createDocument: createFile returned null')
        return null
      }

      currentFilePath.value = filePath
      lastSaved.value = Date.now()
      boardStore.markClean()

      await refreshHistoryEntries()

      console.log('Document saved to vault:', filePath)
      return filePath
    } catch (error) {
      console.error('createDocument: Failed to save to vault', error)
      // Document is still in memory, user can use it
      // but autosave won't work until we have a file path
      return null
    }
  }

  // Open a document from the vault
  async function openDocument(filePath: string): Promise<boolean> {
    isLoading.value = true
    try {
      const doc = await vault.loadFile(filePath)
      if (!doc) {
        isLoading.value = false
        return false
      }

      boardStore.loadDocument(doc)
      currentFilePath.value = filePath
      lastSaved.value = doc.meta.updatedAt
      boardStore.markClean()

      // Load history for this document
      await refreshHistoryEntries()
      currentHistoryIndex.value = -1 // Reset to latest

      return true
    } catch (error) {
      console.error('Failed to open document:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Internal save (doesn't add to history)
  async function saveDocumentInternal(): Promise<boolean> {
    if (!currentFilePath.value || !vault.isConfigured.value) return false

    const doc = boardStore.getDocument()
    if (!doc) return false

    isSaving.value = true
    try {
      doc.meta.updatedAt = Date.now()
      const success = await vault.saveFile(currentFilePath.value, doc)
      if (success) {
        boardStore.markClean()
        lastSaved.value = doc.meta.updatedAt
      }
      return success
    } catch (error) {
      console.error('Failed to save document:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Save the current document (with optional history)
  async function saveDocument(addHistory = true): Promise<boolean> {
    if (!currentFilePath.value || !vault.isConfigured.value) return false

    const doc = boardStore.getDocument()
    if (!doc) return false

    isSaving.value = true
    try {
      doc.meta.updatedAt = Date.now()
      const success = await vault.saveFile(currentFilePath.value, doc)
      if (!success) return false

      boardStore.markClean()
      lastSaved.value = doc.meta.updatedAt

      // Add to history if requested
      const skipActions = ['Initial state', 'Moved widget', 'Resized widget', 'Moved element', 'Resized element']
      if (addHistory && !skipActions.includes(boardStore.lastAction)) {
        await addToHistory(boardStore.lastAction)
      }

      return true
    } catch (error) {
      console.error('Failed to save document:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Initialize: load last document or wait for vault setup
  async function initialize(): Promise<boolean> {
    // If vault is not configured, return false to show setup modal
    if (!vault.isConfigured.value) {
      return false
    }

    isLoading.value = true

    try {
      // Scan vault files
      await vault.scanVaultFiles()

      // Try to restore last document
      if (currentFilePath.value) {
        // Verify the file still exists
        const fileExists = vault.files.value.some((f) => f.path === currentFilePath.value)
        if (fileExists) {
          const loaded = await openDocument(currentFilePath.value)
          if (loaded) return true
        }
      }

      // Try to open the most recently modified file
      if (vault.files.value.length > 0) {
        const mostRecent = vault.files.value[0]
        const loaded = await openDocument(mostRecent.path)
        if (loaded) return true
      }

      // No files exist, create a new one
      await createDocument('Untitled Board')
      return true
    } finally {
      isLoading.value = false
    }
  }

  // Handle vault setup completion
  async function onVaultSetup(): Promise<void> {
    console.log('onVaultSetup called')
    isLoading.value = true

    try {
      await vault.scanVaultFiles()
      console.log('Vault scanned, files found:', vault.files.value.length)

      // If there are existing files, open the most recent
      if (vault.files.value.length > 0) {
        console.log('Opening existing file:', vault.files.value[0].path)
        const success = await openDocument(vault.files.value[0].path)
        if (!success) {
          console.warn('Failed to open existing file, creating new one')
          await createDocument('Untitled Board')
        }
      } else {
        // Create a new document
        console.log('No files in vault, creating new document')
        const path = await createDocument('Untitled Board')
        if (!path) {
          console.error('Failed to create initial document')
          // Still create a board in memory so the user has something
          boardStore.createNewBoard('Untitled Board')
        }
      }

      console.log('onVaultSetup complete, currentFilePath:', currentFilePath.value)
    } catch (error) {
      console.error('onVaultSetup error:', error)
      // Ensure user has at least an in-memory document
      boardStore.createNewBoard('Untitled Board')
    } finally {
      isLoading.value = false
    }
  }

  // Setup autosave watcher
  function setupAutosave() {
    if (stopWatch) {
      stopWatch()
    }

    // Watch dirty state
    stopWatch = watch(
      () => boardStore.isDirty,
      (isDirty) => {
        if (isDirty && currentFilePath.value && vault.isConfigured.value) {
          debouncedSave()
        }
      }
    )

    // Save immediately if already dirty
    if (boardStore.isDirty && currentFilePath.value && vault.isConfigured.value) {
      debouncedSave()
    }
  }

  // Setup file watching for external changes
  function setupFileWatching(onExternalChange: (doc: BoardkitDocument) => void): void {
    vault.startWatching(onExternalChange)
  }

  // Stop file watching
  function stopFileWatching(): void {
    vault.stopWatching()
  }

  // Export current document as .boardkit file using native dialog
  async function exportToFile(): Promise<boolean> {
    const doc = boardStore.getDocument()
    if (!doc) return false

    try {
      return await saveToFile(doc)
    } catch (error) {
      console.error('Failed to export document:', error)
      return false
    }
  }

  // Import a .boardkit file using native dialog
  async function importFromFile(): Promise<boolean> {
    if (!vault.isConfigured.value) return false

    try {
      isLoading.value = true
      const result = await openFromFile()
      if (!result) return false

      // Load imported assets into the asset store
      const assetStore = useAssetStore()
      await assetStore.loadAssets(result.assets)

      // Create a new file in the vault with the imported content
      const filePath = await vault.createFile(result.document.meta.title, result.document)
      if (!filePath) return false

      boardStore.loadDocument(result.document)
      currentFilePath.value = filePath
      lastSaved.value = Date.now()
      boardStore.markClean()

      await refreshHistoryEntries()

      return true
    } catch (error) {
      console.error('Failed to import document:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Delete a document from the vault
  async function deleteDocument(filePath: string): Promise<boolean> {
    const success = await vault.deleteFile(filePath)
    if (!success) return false

    // If we deleted the current file, open another one or create new
    if (currentFilePath.value === filePath) {
      currentFilePath.value = null

      if (vault.files.value.length > 0) {
        await openDocument(vault.files.value[0].path)
      } else {
        await createDocument('Untitled Board')
      }
    }

    return true
  }

  // Rename a document in the vault
  async function renameDocument(oldPath: string, newName: string): Promise<boolean> {
    const newPath = await vault.renameFile(oldPath, newName)
    if (!newPath) return false

    // Update current file path if this was the active file
    if (currentFilePath.value === oldPath) {
      currentFilePath.value = newPath

      // Also update the document title
      boardStore.setTitle(newName)
      await saveDocumentInternal()
    }

    return true
  }

  // Duplicate a document in the vault
  async function duplicateDocument(filePath: string): Promise<string | null> {
    try {
      const newPath = await vault.duplicateFile(filePath)
      if (!newPath) return null

      // Open the duplicated file
      await openDocument(newPath)

      return newPath
    } catch (error) {
      console.error('Failed to duplicate document:', error)
      return null
    }
  }

  // Clear all history for current document
  async function clearDocumentHistory(): Promise<void> {
    if (!currentFilePath.value) return

    const docId = getDocumentId(currentFilePath.value)

    try {
      await clearHistory(docId)
      historyEntries.value = []
      currentHistoryIndex.value = -1
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  return {
    // State
    currentFilePath,
    isLoading,
    isSaving,
    lastSaved,
    historyEntries,
    currentHistoryIndex,

    // Computed
    canUndo,
    canRedo,
    isAtLive,
    undoEntries,
    redoEntries,

    // Document Actions
    initialize,
    onVaultSetup,
    createDocument,
    openDocument,
    saveDocument,
    deleteDocument,
    renameDocument,
    duplicateDocument,
    setupAutosave,
    setupFileWatching,
    stopFileWatching,
    exportToFile,
    importFromFile,

    // History Actions
    undo,
    redo,
    goToHistoryEntry,
    goToLatest,
    clearDocumentHistory,
  }
}
