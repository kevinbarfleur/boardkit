import { ref, watch, onUnmounted } from 'vue'
import { useBoardStore } from '@boardkit/core'
import { mkdir, exists, readDir, remove } from '@tauri-apps/plugin-fs'
import type { BoardkitDocument } from '@boardkit/core'
import { nanoid } from 'nanoid'
import {
  saveToFile,
  openFromFile,
  saveToAutosave,
  loadFromAutosave,
  getAutosaveDir,
} from '../utils/boardkitFile'

const AUTOSAVE_DELAY = 1000 // 1 second debounce
const CURRENT_DOC_KEY = 'boardkit:current-document-id'

// Shared state
const currentDocumentId = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const lastSaved = ref<number | null>(null)

export function usePersistence() {
  const boardStore = useBoardStore()
  let autosaveTimeout: ReturnType<typeof setTimeout> | null = null

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

  // Create a new document
  async function createDocument(title: string): Promise<string> {
    const id = nanoid()
    boardStore.createNewBoard(title)
    currentDocumentId.value = id

    // Save immediately
    await saveDocument()

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

  // Save the current document to autosave
  async function saveDocument(): Promise<boolean> {
    if (!currentDocumentId.value) return false

    const doc = boardStore.getDocument()
    if (!doc) return false

    isSaving.value = true
    try {
      await ensureAutosaveDir()
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

  // Setup autosave watcher
  function setupAutosave() {
    // Watch for dirty state
    const stopWatch = watch(
      () => boardStore.isDirty,
      (isDirty) => {
        if (isDirty && currentDocumentId.value) {
          // Clear existing timeout
          if (autosaveTimeout) {
            clearTimeout(autosaveTimeout)
          }

          // Set new timeout for autosave
          autosaveTimeout = setTimeout(() => {
            saveDocument()
          }, AUTOSAVE_DELAY)
        }
      }
    )

    // Cleanup on unmount
    onUnmounted(() => {
      stopWatch()
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout)
      }
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
      await saveDocument()

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

  return {
    // State
    currentDocumentId,
    isLoading,
    isSaving,
    lastSaved,

    // Actions
    initialize,
    createDocument,
    openDocument,
    saveDocument,
    setupAutosave,
    exportToFile,
    importFromFile,
  }
}
