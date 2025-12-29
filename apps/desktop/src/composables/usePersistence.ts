import { ref, computed, watch, onUnmounted } from 'vue'
import { useBoardStore } from '@boardkit/core'
import { mkdir, exists } from '@tauri-apps/plugin-fs'
import type { BoardkitDocument } from '@boardkit/core'
import { nanoid } from 'nanoid'
import {
  saveToFile,
  openFromFile,
  saveToAutosave,
  loadFromAutosave,
  getAutosaveDir,
  getHistoryDir,
  saveToHistory,
  getHistoryEntries,
  loadHistoryEntry,
  clearHistory,
  type HistoryEntry,
} from '../utils/boardkitFile'

const AUTOSAVE_DELAY = 500 // 500ms debounce for fast saving
const CURRENT_DOC_KEY = 'boardkit:current-document-id'

// Shared state
const currentDocumentId = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const lastSaved = ref<number | null>(null)

// History state
const historyEntries = ref<HistoryEntry[]>([])
const currentHistoryIndex = ref<number>(-1) // -1 means we're at the latest version

export function usePersistence() {
  const boardStore = useBoardStore()
  let autosaveTimeout: ReturnType<typeof setTimeout> | null = null
  let stopWatch: (() => void) | null = null

  // Actions to hide from history display (low-value, high-frequency)
  const hiddenActions = ['initial state', 'moved widget', 'resized widget']

  // Filter out hidden actions from entries
  const filterEntries = (entries: HistoryEntry[]) =>
    entries.filter((e) => !hiddenActions.includes(e.action.toLowerCase()))

  // Computed: can we undo/redo?
  const canUndo = computed(() => filterEntries(historyEntries.value).length > 0)
  const canRedo = computed(() => currentHistoryIndex.value >= 0)

  // Get entries for undo (past versions)
  const undoEntries = computed(() => {
    if (currentHistoryIndex.value === -1) {
      // At latest version, all history is undoable
      return filterEntries(historyEntries.value)
    }
    // Show entries older than current position
    return filterEntries(historyEntries.value.slice(currentHistoryIndex.value + 1))
  })

  // Get entries for redo (future versions)
  const redoEntries = computed(() => {
    if (currentHistoryIndex.value === -1) return []
    return filterEntries(historyEntries.value.slice(0, currentHistoryIndex.value + 1).reverse())
  })

  // Ensure autosave directory exists
  async function ensureAutosaveDir(): Promise<void> {
    const dir = getAutosaveDir()
    try {
      const dirExists = await exists(dir, { baseDir: 12 }) // AppLocalData = 12
      if (!dirExists) {
        await mkdir(dir, { baseDir: 12, recursive: true })
      }
    } catch {
      // Directory might already exist
    }
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
    if (!currentDocumentId.value) {
      historyEntries.value = []
      return
    }

    try {
      historyEntries.value = await getHistoryEntries(currentDocumentId.value)
    } catch {
      historyEntries.value = []
    }
  }

  // Add current state to history
  async function addToHistory(action: string): Promise<void> {
    const doc = boardStore.getDocument()
    if (!doc || !currentDocumentId.value) return

    // If we're not at the latest (user went back in history),
    // we would normally clear future entries, but for simplicity
    // we just add new entries at the top
    if (currentHistoryIndex.value >= 0) {
      // Clear the "future" entries by resetting to latest
      currentHistoryIndex.value = -1
    }

    try {
      await ensureHistoryDir(currentDocumentId.value)
      await saveToHistory(currentDocumentId.value, action, doc)
      await refreshHistoryEntries()
    } catch (error) {
      console.error('Failed to add to history:', error)
    }
  }

  // Go to a specific history entry
  async function goToHistoryEntry(entryId: string): Promise<boolean> {
    if (!currentDocumentId.value) return false

    const index = historyEntries.value.findIndex((e) => e.id === entryId)
    if (index === -1) return false

    isLoading.value = true
    try {
      const doc = await loadHistoryEntry(currentDocumentId.value, entryId)
      if (!doc) return false

      boardStore.loadDocument(doc)
      currentHistoryIndex.value = index

      // Save this as the current document state (without adding to history)
      await saveDocumentInternal()

      return true
    } catch (error) {
      console.error('Failed to go to history entry:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Undo to previous version
  async function undo(): Promise<boolean> {
    if (!canUndo.value || !currentDocumentId.value) return false

    const targetIndex = currentHistoryIndex.value === -1 ? 0 : currentHistoryIndex.value + 1
    if (targetIndex >= historyEntries.value.length) return false

    const entry = historyEntries.value[targetIndex]

    isLoading.value = true
    try {
      const doc = await loadHistoryEntry(currentDocumentId.value, entry.id)
      if (!doc) return false

      boardStore.loadDocument(doc)
      currentHistoryIndex.value = targetIndex

      await saveDocumentInternal()
      return true
    } catch (error) {
      console.error('Failed to undo:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Redo to next version
  async function redo(): Promise<boolean> {
    if (!canRedo.value || currentHistoryIndex.value <= 0 || !currentDocumentId.value) return false

    const targetIndex = currentHistoryIndex.value - 1
    const entry = historyEntries.value[targetIndex]

    isLoading.value = true
    try {
      const doc = await loadHistoryEntry(currentDocumentId.value, entry.id)
      if (!doc) return false

      boardStore.loadDocument(doc)
      currentHistoryIndex.value = targetIndex

      await saveDocumentInternal()
      return true
    } catch (error) {
      console.error('Failed to redo:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Go to latest version
  async function goToLatest(): Promise<boolean> {
    if (currentHistoryIndex.value === -1 || !currentDocumentId.value) return false

    const entry = historyEntries.value[0]
    if (!entry) return false

    isLoading.value = true
    try {
      const doc = await loadHistoryEntry(currentDocumentId.value, entry.id)
      if (!doc) return false

      boardStore.loadDocument(doc)
      currentHistoryIndex.value = -1

      await saveDocumentInternal()
      return true
    } catch (error) {
      console.error('Failed to go to latest:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Create a new document
  async function createDocument(title: string): Promise<string> {
    const id = nanoid()
    boardStore.createNewBoard(title)
    currentDocumentId.value = id

    // Save immediately
    await saveDocument(true)
    await refreshHistoryEntries()

    // Remember current document
    localStorage.setItem(CURRENT_DOC_KEY, id)

    return id
  }

  // Open an existing document from autosave
  async function openDocument(id: string): Promise<boolean> {
    isLoading.value = true
    try {
      const data = await loadFromAutosave(id)
      if (!data) {
        isLoading.value = false
        return false
      }

      boardStore.loadDocument(data as BoardkitDocument)
      currentDocumentId.value = id
      lastSaved.value = (data as BoardkitDocument).meta.updatedAt
      boardStore.markClean()

      // Load history for this document
      await refreshHistoryEntries()
      currentHistoryIndex.value = -1 // Reset to latest

      // Remember current document
      localStorage.setItem(CURRENT_DOC_KEY, id)

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
    if (!currentDocumentId.value) return false

    const doc = boardStore.getDocument()
    if (!doc) return false

    isSaving.value = true
    try {
      await ensureAutosaveDir()
      doc.meta.updatedAt = Date.now()
      await saveToAutosave(currentDocumentId.value, doc)
      boardStore.markClean()
      lastSaved.value = doc.meta.updatedAt
      return true
    } catch (error) {
      console.error('Failed to save document:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Save the current document to autosave (with optional history)
  async function saveDocument(addHistory = true): Promise<boolean> {
    if (!currentDocumentId.value) return false

    const doc = boardStore.getDocument()
    if (!doc) return false

    isSaving.value = true
    try {
      await ensureAutosaveDir()
      doc.meta.updatedAt = Date.now()
      await saveToAutosave(currentDocumentId.value, doc)
      boardStore.markClean()
      lastSaved.value = doc.meta.updatedAt

      // Add to history if requested
      // Skip: "Initial state", moves, and resizes (low-value, high-frequency actions)
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

  // Initialize: load last document or create new
  async function initialize(): Promise<void> {
    isLoading.value = true

    try {
      await ensureAutosaveDir()

      // Try to restore last document
      const lastDocId = localStorage.getItem(CURRENT_DOC_KEY)
      if (lastDocId) {
        const loaded = await openDocument(lastDocId)
        if (loaded) return
      }

      // No last document or failed to load, create a new one
      await createDocument('Untitled Board')
    } finally {
      isLoading.value = false
    }
  }

  // Schedule autosave
  function scheduleAutosave() {
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout)
    }

    autosaveTimeout = setTimeout(async () => {
      if (boardStore.isDirty && currentDocumentId.value) {
        await saveDocument(true)
      }
    }, AUTOSAVE_DELAY)
  }

  // Setup autosave watcher
  function setupAutosave() {
    if (stopWatch) {
      stopWatch()
    }

    // Watch dirty state instead of deep watching the entire document (performance)
    stopWatch = watch(
      () => boardStore.isDirty,
      (isDirty) => {
        if (isDirty && currentDocumentId.value) {
          scheduleAutosave()
        }
      }
    )

    // Save immediately if already dirty
    if (boardStore.isDirty && currentDocumentId.value) {
      scheduleAutosave()
    }

    onUnmounted(() => {
      if (stopWatch) stopWatch()
      if (autosaveTimeout) clearTimeout(autosaveTimeout)
    })
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
    try {
      isLoading.value = true
      const doc = await openFromFile()
      if (!doc) return false

      // Create a new document ID and load the imported content
      const id = nanoid()
      boardStore.loadDocument(doc)
      currentDocumentId.value = id

      // Save to autosave
      await saveDocument(true)
      await refreshHistoryEntries()

      // Remember current document
      localStorage.setItem(CURRENT_DOC_KEY, id)

      return true
    } catch (error) {
      console.error('Failed to import document:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Clear all history for current document
  async function clearDocumentHistory(): Promise<void> {
    if (!currentDocumentId.value) return

    try {
      await clearHistory(currentDocumentId.value)
      historyEntries.value = []
      currentHistoryIndex.value = -1
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  return {
    // State
    currentDocumentId,
    isLoading,
    isSaving,
    lastSaved,
    historyEntries,
    currentHistoryIndex,

    // Computed
    canUndo,
    canRedo,
    undoEntries,
    redoEntries,

    // Document Actions
    initialize,
    createDocument,
    openDocument,
    saveDocument,
    setupAutosave,
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
