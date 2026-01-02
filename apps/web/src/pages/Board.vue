<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { registerCoreActions, useBoardStore, pluginManager } from '@boardkit/core'
import { useTheme, useToast } from '@boardkit/ui'
import { useCanvasExport, useSidebarState } from '@boardkit/app-common'
import { registerModules } from '../modules'
import { registerWebActions } from '../actions/webActions'
import { usePersistence } from '../composables/usePersistence'
import { useDocumentList } from '../composables/useDocumentList'
import { useSettingsPanel } from '../composables/useSettingsPanel'
import BoardCanvas from '../components/BoardCanvas.vue'
import Toolbar from '../components/Toolbar.vue'
import CommandPalette from '../components/CommandPalette.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import DocumentSidebar from '../components/DocumentSidebar.vue'
import ElementPropertiesPanel from '../components/ElementPropertiesPanel.vue'

// Register all modules before using the store
registerModules()

const boardStore = useBoardStore()
const { initTheme } = useTheme()
const toaster = useToast()
const persistence = usePersistence()
const documentList = useDocumentList()
const { openAppSettings } = useSettingsPanel()
const canvasExport = useCanvasExport()

// Canvas component ref for export
const boardCanvasRef = ref<InstanceType<typeof BoardCanvas> | null>(null)

// Track if we've already shown orphan widget notification for this document
const shownOrphanNotification = ref<string | null>(null)

const isCommandPaletteOpen = ref(false)
const { sidebarCollapsed, toggleSidebarCollapse } = useSidebarState()

const openCommandPalette = () => {
  isCommandPaletteOpen.value = true
}

const closeCommandPalette = () => {
  isCommandPaletteOpen.value = false
}

const handleUndo = async () => {
  await persistence.undo()
}

const handleRedo = async () => {
  await persistence.redo()
}

const handleGoToHistory = async (id: string) => {
  await persistence.goToHistoryEntry(id)
}

const handleGoToLatest = async () => {
  await persistence.goToLatest()
}

// Document sidebar handlers
const handleSelectDocument = async (id: string) => {
  // Check for unsaved changes
  if (boardStore.isDirty) {
    await persistence.saveDocument()
  }
  await persistence.openDocument(id)
  await documentList.refreshDocumentList()
}

const handleCreateDocument = async () => {
  await persistence.createDocument('Untitled Board')
  await documentList.refreshDocumentList()
}

const handleDeleteDocument = async (id: string) => {
  await persistence.deleteDocument(id)
  await documentList.refreshDocumentList()

  // If we deleted the current document, open another one
  if (!documentList.currentDocumentId.value && documentList.documents.value.length > 0) {
    await persistence.openDocument(documentList.documents.value[0].id)
  } else if (documentList.documents.value.length === 0) {
    await persistence.createDocument('Untitled Board')
    await documentList.refreshDocumentList()
  }
}

const handleRenameDocument = async (id: string, newTitle: string) => {
  await documentList.renameDocument(id, newTitle)
  // If this is the current document, update the store title
  if (id === documentList.currentDocumentId.value) {
    boardStore.setTitle(newTitle)
  }
}

const handleDuplicateDocument = async (id: string) => {
  const newId = await documentList.duplicateDocument(id)
  if (newId) {
    await persistence.openDocument(newId)
    await documentList.refreshDocumentList()
  }
}

const handleOpenSettings = () => {
  openAppSettings()
}

// Export handlers
const handleExportPng = async () => {
  const canvasEl = boardCanvasRef.value?.canvasRef
  if (!canvasEl) {
    toaster.error('Canvas not available for export')
    return
  }

  try {
    await canvasExport.exportToPng(canvasEl, {
      backgroundColor: 'white',
      padding: 40,
    })
    toaster.success('PNG exported successfully')
  } catch (error) {
    console.error('[Board] PNG export failed:', error)
    toaster.error('Failed to export PNG')
  }
}

const handleExportSvg = async () => {
  const canvasEl = boardCanvasRef.value?.canvasRef
  if (!canvasEl) {
    toaster.error('Canvas not available for export')
    return
  }

  try {
    await canvasExport.exportToSvg(canvasEl, {
      backgroundColor: 'white',
      padding: 40,
    })
    toaster.success('SVG exported successfully')
  } catch (error) {
    console.error('[Board] SVG export failed:', error)
    toaster.error('Failed to export SVG')
  }
}

onMounted(async () => {
  initTheme()

  // Initialize persistence (loads last document or creates new)
  await persistence.initialize()

  // Sync document list with persistence
  await documentList.refreshDocumentList()

  // Register core actions after Pinia store is ready
  registerCoreActions()

  // Register web-specific actions
  registerWebActions()

  // Setup autosave
  persistence.setupAutosave()

  // Initialize plugin manager (loads enabled plugins)
  await pluginManager.initialize()
})

// Watch for orphan widgets and show notification
watch(
  () => boardStore.hasOrphanWidgets,
  (hasOrphans) => {
    const currentDocId = documentList.currentDocumentId.value

    // Only show notification once per document session
    if (hasOrphans && currentDocId && shownOrphanNotification.value !== currentDocId) {
      shownOrphanNotification.value = currentDocId

      const orphanCount = boardStore.orphanWidgets.length
      const moduleIds = boardStore.orphanModuleIds

      // Show toast with action to open settings
      toaster.warning(
        `${orphanCount} widget${orphanCount > 1 ? 's' : ''} use${orphanCount === 1 ? 's' : ''} uninstalled plugins: ${moduleIds.join(', ')}`,
        {
          title: 'Missing plugins detected',
          duration: 10000,
          action: {
            label: 'Install plugins',
            onClick: () => openAppSettings('plugins'),
          },
        }
      )
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex">
    <!-- Document Sidebar -->
    <DocumentSidebar
      :documents="documentList.documents.value"
      :active-document-id="documentList.currentDocumentId.value"
      :is-loading="documentList.isLoading.value"
      :collapsed="sidebarCollapsed"
      @select="handleSelectDocument"
      @create="handleCreateDocument"
      @delete="handleDeleteDocument"
      @rename="handleRenameDocument"
      @duplicate="handleDuplicateDocument"
      @open-settings="handleOpenSettings"
      @toggle-collapse="toggleSidebarCollapse"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 relative">
      <Toolbar
        :is-saving="persistence.isSaving.value"
        :last-saved="persistence.lastSaved.value"
        :can-undo="persistence.canUndo.value"
        :can-redo="persistence.canRedo.value"
        :undo-entries="persistence.undoEntries.value"
        :redo-entries="persistence.redoEntries.value"
        @new-board="handleCreateDocument"
        @export="persistence.exportToFile()"
        @export-png="handleExportPng"
        @export-svg="handleExportSvg"
        @import="persistence.importFromFile()"
        @open-command-palette="openCommandPalette"
        @undo="handleUndo"
        @redo="handleRedo"
        @go-to-history="handleGoToHistory"
        @go-to-latest="handleGoToLatest"
      />
      <BoardCanvas ref="boardCanvasRef" @open-command-palette="openCommandPalette" />
      <ElementPropertiesPanel />
    </div>

    <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
    <SettingsPanel />
  </div>
</template>
