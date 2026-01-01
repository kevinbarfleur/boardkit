import { ref, computed, shallowRef } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  indexedDBStorage,
  listDocuments,
  historyStorage,
  type DocumentInfo,
} from '@boardkit/platform'
import {
  type BoardkitDocument,
  createEmptyDocument,
} from '@boardkit/core'
import { nanoid } from 'nanoid'

const CURRENT_DOC_KEY = 'boardkit:current-document-id'

// Shared state across all composable instances
const documents = shallowRef<DocumentInfo[]>([])
const currentDocumentId = useStorage<string | null>(CURRENT_DOC_KEY, null)
const isLoading = ref(false)

export function useDocumentList() {
  // ============================================================================
  // Computed State
  // ============================================================================

  const activeDocument = computed(() => {
    if (!currentDocumentId.value) return null
    return documents.value.find((d) => d.id === currentDocumentId.value) || null
  })

  const hasDocuments = computed(() => documents.value.length > 0)

  // ============================================================================
  // Document Operations
  // ============================================================================

  /**
   * Refresh the list of documents from IndexedDB
   */
  async function refreshDocumentList(): Promise<void> {
    isLoading.value = true
    try {
      documents.value = await listDocuments()
    } catch (error) {
      console.error('Failed to list documents:', error)
      documents.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new document
   */
  async function createDocument(title: string): Promise<string> {
    const id = nanoid()
    const document = createEmptyDocument(title)

    await indexedDBStorage.save(id, document)
    currentDocumentId.value = id

    await refreshDocumentList()

    return id
  }

  /**
   * Load a document by ID
   */
  async function loadDocument(id: string): Promise<BoardkitDocument | null> {
    try {
      const data = await indexedDBStorage.load(id)
      if (!data) return null

      currentDocumentId.value = id
      return data as BoardkitDocument
    } catch (error) {
      console.error('Failed to load document:', error)
      return null
    }
  }

  /**
   * Save a document
   */
  async function saveDocument(id: string, document: BoardkitDocument): Promise<boolean> {
    try {
      await indexedDBStorage.save(id, JSON.parse(JSON.stringify(document)))
      await refreshDocumentList()
      return true
    } catch (error) {
      console.error('Failed to save document:', error)
      return false
    }
  }

  /**
   * Delete a document
   */
  async function deleteDocument(id: string): Promise<boolean> {
    try {
      await indexedDBStorage.delete(id)
      await historyStorage.deleteByDocument(id)

      // If this was the active document, clear it
      if (currentDocumentId.value === id) {
        currentDocumentId.value = null
      }

      await refreshDocumentList()
      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      return false
    }
  }

  /**
   * Rename a document
   */
  async function renameDocument(id: string, newTitle: string): Promise<boolean> {
    try {
      const data = await indexedDBStorage.load(id)
      if (!data) return false

      const document = data as BoardkitDocument
      document.meta.title = newTitle
      document.meta.updatedAt = Date.now()

      await indexedDBStorage.save(id, document)
      await refreshDocumentList()

      return true
    } catch (error) {
      console.error('Failed to rename document:', error)
      return false
    }
  }

  /**
   * Duplicate a document
   */
  async function duplicateDocument(id: string): Promise<string | null> {
    try {
      const data = await indexedDBStorage.load(id)
      if (!data) return null

      const original = data as BoardkitDocument
      const newId = nanoid()

      // Find a unique name
      const baseName = original.meta.title
      let copyName = `${baseName} Copy`
      let counter = 2
      while (documents.value.some((d) => d.title === copyName)) {
        copyName = `${baseName} Copy ${counter}`
        counter++
      }

      const duplicate: BoardkitDocument = {
        ...JSON.parse(JSON.stringify(original)),
        meta: {
          ...original.meta,
          title: copyName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      }

      await indexedDBStorage.save(newId, duplicate)
      currentDocumentId.value = newId
      await refreshDocumentList()

      return newId
    } catch (error) {
      console.error('Failed to duplicate document:', error)
      return null
    }
  }

  /**
   * Set the active document
   */
  function setActiveDocument(id: string | null): void {
    currentDocumentId.value = id
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    documents,
    currentDocumentId,
    isLoading,

    // Computed
    activeDocument,
    hasDocuments,

    // Actions
    refreshDocumentList,
    createDocument,
    loadDocument,
    saveDocument,
    deleteDocument,
    renameDocument,
    duplicateDocument,
    setActiveDocument,
  }
}
