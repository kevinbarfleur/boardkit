import { ref, watch, onUnmounted, computed } from 'vue'
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
const CURRENT_DOC_KEY = 'boardkit:current-document-id'
const MAX_HISTORY_ENTRIES = 100

// Shared state
const currentDocumentId = ref<string | null>(null)
const documents = ref<DocumentInfo[]>([])
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

  // Computed: can we undo/redo?
  const canUndo = computed(() => historyEntries.value.length > 0)
  const canRedo = computed(() => currentHistoryIndex.value >= 0)

  // Get entries for undo (past versions)
  const undoEntries = computed(() => {
    if (currentHistoryIndex.value === -1) {
      // At latest version, all history is undoable
      return historyEntries.value
    }
    // Show entries older than current position
    return historyEntries.value.slice(currentHistoryIndex.value + 1)
  })

  // Get entries for redo (future versions)
  const redoEntries = computed(() => {
    if (currentHistoryIndex.value === -1) return []
    return historyEntries.value.slice(0, currentHistoryIndex.value + 1).reverse()
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
      snapshot: JSON.parse(JSON.stringify(doc)),
    }

    await historyStorage.save(entry)
    historyEntries.value.unshift(entry)

    // Prune old entries
    if (historyEntries.value.length > MAX_HISTORY_ENTRIES) {
      await historyStorage.pruneOldEntries(currentDocumentId.value, MAX_HISTORY_ENTRIES)
      historyEntries.value = historyEntries.value.slice(0, MAX_HISTORY_ENTRIES)
    }
  }

  // Go to a specific history entry
  async function goToHistoryEntry(entryId: string): Promise<boolean> {
    const index = historyEntries.value.findIndex((e) => e.id === entryId)
    if (index === -1) return false

    const entry = historyEntries.value[index]
    boardStore.loadDocument(entry.snapshot as BoardkitDocument)
    currentHistoryIndex.value = index

    // Save this as the current document state
    await saveDocument(false) // Don't add to history

    return true
  }

  // Undo to previous version
  async function undo(): Promise<boolean> {
    if (!canUndo.value) return false

    const targetIndex = currentHistoryIndex.value === -1 ? 0 : currentHistoryIndex.value + 1
    if (targetIndex >= historyEntries.value.length) return false

    const entry = historyEntries.value[targetIndex]
    boardStore.loadDocument(entry.snapshot as BoardkitDocument)
    currentHistoryIndex.value = targetIndex

    await saveDocument(false)
    return true
  }

  // Redo to next version
  async function redo(): Promise<boolean> {
    if (!canRedo.value || currentHistoryIndex.value <= 0) return false

    const targetIndex = currentHistoryIndex.value - 1
    const entry = historyEntries.value[targetIndex]
    boardStore.loadDocument(entry.snapshot as BoardkitDocument)
    currentHistoryIndex.value = targetIndex

    await saveDocument(false)
    return true
  }

  // Go to latest version
  async function goToLatest(): Promise<boolean> {
    if (currentHistoryIndex.value === -1) return false

    const entry = historyEntries.value[0]
    if (!entry) return false

    boardStore.loadDocument(entry.snapshot as BoardkitDocument)
    currentHistoryIndex.value = -1

    await saveDocument(false)
    return true
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

    // Remember current document
    localStorage.setItem(CURRENT_DOC_KEY, id)

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

      // Remember current document
      localStorage.setItem(CURRENT_DOC_KEY, id)

      console.log('Opened document:', id)
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
      const plainDoc = JSON.parse(JSON.stringify(doc))

      await indexedDBStorage.save(currentDocumentId.value, plainDoc)
      boardStore.markClean()
      lastSaved.value = doc.meta.updatedAt

      // Add to history if requested (skip "Initial state" which is the default)
      if (addHistory && boardStore.lastAction !== 'Initial state') {
        await addToHistory(boardStore.lastAction)
      }

      console.log('Document saved:', currentDocumentId.value)
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
        localStorage.removeItem(CURRENT_DOC_KEY)
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

      // Try to restore last document
      const lastDocId = localStorage.getItem(CURRENT_DOC_KEY)
      if (lastDocId) {
        const exists = await indexedDBStorage.exists(lastDocId)
        if (exists) {
          const opened = await openDocument(lastDocId)
          if (opened) {
            console.log('Restored document:', lastDocId)
            return
          }
        }
      }

      // No last document, check if there are any documents
      if (documents.value.length > 0) {
        const opened = await openDocument(documents.value[0].id)
        if (opened) {
          console.log('Opened most recent document:', documents.value[0].id)
          return
        }
      }

      // No documents at all, create a new one
      console.log('Creating new document')
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

    console.log('Setting up autosave, currentDocumentId:', currentDocumentId.value)

    // Watch the document for any changes
    stopWatch = watch(
      () => boardStore.document,
      () => {
        if (boardStore.isDirty && currentDocumentId.value) {
          scheduleAutosave()
        }
      },
      { deep: true }
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

      localStorage.setItem(CURRENT_DOC_KEY, id)

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
