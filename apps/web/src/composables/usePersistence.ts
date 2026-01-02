import { ref, watch, computed, toRaw } from 'vue'
import { useDebounceFn, useDocumentVisibility, useStorage } from '@vueuse/core'
import { useBoardStore } from '@boardkit/core'
import {
  indexedDBStorage,
  listDocuments,
  historyStorage,
  type DocumentInfo,
  type HistoryEntry,
} from '@boardkit/platform'
import type { BoardkitDocument } from '@boardkit/core'
import { nanoid } from 'nanoid'
import {
  exportBoardkit,
  importBoardkit,
  downloadBlob,
  openFilePicker,
} from '../utils/boardkitFile'

const AUTOSAVE_DELAY = 500 // 500ms debounce for fast saving

/**
 * Deep clone an object, handling Vue reactive proxies.
 * Uses structuredClone (2-3x faster than JSON.parse/stringify).
 * Falls back to JSON.parse/stringify if structuredClone fails
 * (e.g., when Vue proxies are deeply nested).
 */
function deepClone<T>(obj: T): T {
  try {
    return structuredClone(toRaw(obj))
  } catch {
    // Fallback for cases where structuredClone can't handle nested proxies
    return JSON.parse(JSON.stringify(obj))
  }
}
const CURRENT_DOC_KEY = 'boardkit:current-document-id'
const MAX_HISTORY_ENTRIES = 100

// Shared state - using VueUse's useStorage for localStorage persistence
const currentDocumentId = useStorage<string | null>(CURRENT_DOC_KEY, null)
const documents = ref<DocumentInfo[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const lastSaved = ref<number | null>(null)

// History state
const historyEntries = ref<HistoryEntry[]>([])
const currentHistoryIndex = ref<number>(-1) // -1 means we're at the latest version

export function usePersistence() {
  const boardStore = useBoardStore()
  let stopWatch: (() => void) | null = null

  // Track document visibility to pause autosave when tab is hidden
  const visibility = useDocumentVisibility()

  // Debounced autosave function using VueUse
  const debouncedSave = useDebounceFn(async () => {
    if (boardStore.isDirty && currentDocumentId.value && visibility.value === 'visible') {
      await saveDocument(true)
    }
  }, AUTOSAVE_DELAY)

  // Actions to hide from history display (low-value, high-frequency)
  const hiddenActions = ['Initial state', 'Moved widget', 'Resized widget']

  // Filter out hidden actions from entries
  const filterEntries = (entries: HistoryEntry[]) =>
    entries.filter((e) => !hiddenActions.includes(e.action))

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
        documentId: currentDocumentId.value ?? '',
        timestamp: entry.timestamp,
        action: entry.label,
        snapshot: entry.snapshot,
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
          documentId: currentDocumentId.value ?? '',
          timestamp: entry.timestamp,
          action: entry.label,
          snapshot: entry.snapshot,
        })
      }
    }

    // Add "live state" as the final redo target
    entries.push({
      id: 'live',
      documentId: currentDocumentId.value ?? '',
      timestamp: Date.now(),
      action: 'Current state',
      snapshot: {} as BoardkitDocument,
    })

    return entries
  })

  // Load the list of documents
  async function refreshDocumentList() {
    documents.value = await listDocuments()
  }

  // Load history for current document
  async function loadHistory() {
    if (!currentDocumentId.value) {
      historyEntries.value = []
      return
    }
    historyEntries.value = await historyStorage.getByDocument(currentDocumentId.value)
    currentHistoryIndex.value = -1 // Reset to latest
  }

  // Add current state to history
  async function addToHistory(action: string) {
    const doc = boardStore.getDocument()
    if (!doc || !currentDocumentId.value) return

    // If we're not at the latest (user went back in history),
    // we need to clear the "future" entries before adding new one
    if (currentHistoryIndex.value >= 0) {
      // Delete future entries
      const toDelete = historyEntries.value.slice(0, currentHistoryIndex.value + 1)
      for (const entry of toDelete) {
        await historyStorage.delete(entry.id)
      }
      historyEntries.value = historyEntries.value.slice(currentHistoryIndex.value + 1)
      currentHistoryIndex.value = -1
    }

    const entry: HistoryEntry = {
      id: nanoid(),
      documentId: currentDocumentId.value,
      timestamp: Date.now(),
      action,
      snapshot: deepClone(doc),
    }

    await historyStorage.save(entry)
    historyEntries.value.unshift(entry)

    // Prune old entries
    if (historyEntries.value.length > MAX_HISTORY_ENTRIES) {
      await historyStorage.pruneOldEntries(currentDocumentId.value, MAX_HISTORY_ENTRIES)
      historyEntries.value = historyEntries.value.slice(0, MAX_HISTORY_ENTRIES)
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
      await saveDocument(false)
    }
    return success
  }

  // Undo to previous version (delegated to boardStore)
  async function undo(): Promise<boolean> {
    const success = boardStore.undo()
    if (success) {
      await saveDocument(false)
    }
    return success
  }

  // Redo to next version (delegated to boardStore)
  async function redo(): Promise<boolean> {
    const success = boardStore.redo()
    if (success) {
      await saveDocument(false)
    }
    return success
  }

  // Return to the live (most recent) state
  async function goToLatest(): Promise<boolean> {
    const success = boardStore.goToLiveState()
    if (success) {
      await saveDocument(false)
    }
    return success
  }

  // Create a new document
  async function createDocument(title: string): Promise<string> {
    const id = nanoid()
    boardStore.createNewBoard(title)
    currentDocumentId.value = id

    // Save immediately
    await saveDocument(true)
    await refreshDocumentList()
    await loadHistory()

    // currentDocumentId is already synced to localStorage via useStorage

    return id
  }

  // Open an existing document
  async function openDocument(id: string): Promise<boolean> {
    isLoading.value = true
    try {
      const data = await indexedDBStorage.load(id)
      if (!data) {
        console.warn('Document not found:', id)
        return false
      }

      boardStore.loadDocument(data as BoardkitDocument)
      currentDocumentId.value = id
      lastSaved.value = (data as BoardkitDocument).meta.updatedAt
      boardStore.markClean()

      // Load history for this document
      await loadHistory()

      // currentDocumentId is already synced to localStorage via useStorage
      return true
    } catch (error) {
      console.error('Failed to open document:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Save the current document
  async function saveDocument(addHistory = true): Promise<boolean> {
    if (!currentDocumentId.value) {
      console.warn('Cannot save: no current document ID')
      return false
    }

    const doc = boardStore.getDocument()
    if (!doc) {
      console.warn('Cannot save: no document in store')
      return false
    }

    isSaving.value = true
    try {
      // Update timestamp
      doc.meta.updatedAt = Date.now()

      // Serialize to plain object (Vue reactive proxies can't be cloned by IndexedDB)
      const plainDoc = deepClone(doc)

      await indexedDBStorage.save(currentDocumentId.value, plainDoc)
      boardStore.markClean()
      lastSaved.value = doc.meta.updatedAt

      // Add to history if requested
      // Skip: "Initial state", moves, and resizes (low-value, high-frequency actions)
      const skipActions = ['Initial state', 'Moved widget', 'Resized widget']
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

  // Delete a document
  async function deleteDocument(id: string): Promise<boolean> {
    try {
      await indexedDBStorage.delete(id)
      await historyStorage.deleteByDocument(id)
      await refreshDocumentList()

      if (currentDocumentId.value === id) {
        currentDocumentId.value = null
        // useStorage will automatically remove from localStorage when set to null
      }

      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      return false
    }
  }

  // Initialize: load last document or create new
  async function initialize(): Promise<void> {
    isLoading.value = true

    try {
      await refreshDocumentList()

      // Try to restore last document (currentDocumentId is synced from localStorage via useStorage)
      if (currentDocumentId.value) {
        const exists = await indexedDBStorage.exists(currentDocumentId.value)
        if (exists) {
          const opened = await openDocument(currentDocumentId.value)
          if (opened) {
            return
          }
        }
      }

      // No last document, check if there are any documents
      if (documents.value.length > 0) {
        const opened = await openDocument(documents.value[0].id)
        if (opened) {
          return
        }
      }

      // No documents at all, create a new one
      await createDocument('Untitled Board')
    } finally {
      isLoading.value = false
    }
  }

  // Setup autosave watcher
  function setupAutosave() {
    if (stopWatch) {
      stopWatch()
    }

    // Watch dirty state instead of deep watching the entire document (performance)
    // Using VueUse's useDebounceFn for automatic debouncing
    stopWatch = watch(
      () => boardStore.isDirty,
      (isDirty) => {
        if (isDirty && currentDocumentId.value) {
          debouncedSave()
        }
      }
    )

    // Save immediately if already dirty
    if (boardStore.isDirty && currentDocumentId.value) {
      debouncedSave()
    }
  }

  // Export current document as .boardkit file
  async function exportToFile(): Promise<boolean> {
    const doc = boardStore.getDocument()
    if (!doc) return false

    try {
      const blob = await exportBoardkit(doc)
      const filename = `${doc.meta.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.boardkit`
      downloadBlob(blob, filename)
      return true
    } catch (error) {
      console.error('Failed to export document:', error)
      return false
    }
  }

  // Import a .boardkit file
  async function importFromFile(): Promise<boolean> {
    try {
      const file = await openFilePicker()
      if (!file) return false

      isLoading.value = true
      const doc = await importBoardkit(file)

      const id = nanoid()
      boardStore.loadDocument(doc)
      currentDocumentId.value = id

      await saveDocument(true)
      await refreshDocumentList()
      await loadHistory()

      // currentDocumentId is already synced to localStorage via useStorage

      return true
    } catch (error) {
      console.error('Failed to import document:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    currentDocumentId,
    documents,
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

    // Actions
    initialize,
    createDocument,
    openDocument,
    saveDocument,
    deleteDocument,
    refreshDocumentList,
    setupAutosave,
    exportToFile,
    importFromFile,

    // History
    undo,
    redo,
    goToHistoryEntry,
    goToLatest,
  }
}
