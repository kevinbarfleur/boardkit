<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { registerCoreActions, registerCoreMenus, useBoardStore, pluginManager, menuActionBus } from '@boardkit/core'
import { useTheme, useToast, BkMenuBar } from '@boardkit/ui'
import { registerModules } from '../modules'
import { registerWebActions } from '../actions/webActions'
import { usePersistence } from '../composables/usePersistence'
import { useDocumentList } from '../composables/useDocumentList'
import { useSettingsPanel } from '../composables/useSettingsPanel'
import { useLibraryView } from '../composables/useLibraryView'
import { useSidebarState } from '@boardkit/app-common'
import LibrarySidebar from '../components/LibrarySidebar.vue'
import LibraryContent from '../components/LibraryContent.vue'
import CommandPalette from '../components/CommandPalette.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import DocumentPickerModal from '../components/DocumentPickerModal.vue'

// Register all modules before using the store
registerModules()

const router = useRouter()
const boardStore = useBoardStore()
const { initTheme } = useTheme()
const toaster = useToast()
const persistence = usePersistence()
const documentList = useDocumentList()
const { openAppSettings, openForWidget } = useSettingsPanel()
const { sidebarCollapsed, toggleSidebarCollapse } = useSidebarState()
const libraryView = useLibraryView()

// Track if we've already shown orphan widget notification for this document
const shownOrphanNotification = ref<string | null>(null)

const isCommandPaletteOpen = ref(false)
const isDocumentPickerOpen = ref(false)

// Menu action bus unsubscribe function
let unsubscribeMenuActions: (() => void) | null = null

// ============================================================================
// Computed
// ============================================================================

const selectedTypeName = computed(() => {
  if (!libraryView.selectedModuleType.value) return null
  const moduleType = libraryView.moduleTypes.value.find(
    (t) => t.moduleId === libraryView.selectedModuleType.value
  )
  return moduleType?.displayName ?? null
})

// ============================================================================
// Handlers
// ============================================================================

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

  if (!documentList.currentDocumentId.value && documentList.documents.value.length > 0) {
    await persistence.openDocument(documentList.documents.value[0].id)
  } else if (documentList.documents.value.length === 0) {
    await persistence.createDocument('Untitled Board')
    await documentList.refreshDocumentList()
  }
}

const handleOpenSettings = () => {
  openAppSettings()
}

// Navigation handler for view switching
const handleSwitchView = (view: 'canvas' | 'library') => {
  if (view === 'canvas') {
    router.push('/')
  }
}

// Library-specific handlers
const handleSelectType = (moduleId: string | null) => {
  libraryView.selectModuleType(moduleId)
}

const handleSearch = (query: string) => {
  libraryView.setSearchQuery(query)
}

const handleOpenInCanvas = (widgetId: string) => {
  libraryView.focusWidget(widgetId)
}

const handleOpenWidgetSettings = (widgetId: string) => {
  openForWidget(widgetId)
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  initTheme()

  // Initialize persistence
  await persistence.initialize()
  await documentList.refreshDocumentList()

  // Register core menus
  registerCoreMenus()

  // Register core actions after Pinia store is ready
  registerCoreActions()

  // Register web-specific actions
  registerWebActions()

  // Subscribe to menu action events
  unsubscribeMenuActions = menuActionBus.subscribe((event) => {
    switch (event.type) {
      case 'board.new':
        handleCreateDocument()
        break
      case 'board.open':
        isDocumentPickerOpen.value = true
        break
      case 'board.export':
        persistence.exportToFile()
        break
      case 'app.settings':
        handleOpenSettings()
        break
    }
  })

  // Setup autosave
  persistence.setupAutosave()

  // Initialize plugin manager
  await pluginManager.initialize()
})

onUnmounted(() => {
  if (unsubscribeMenuActions) {
    unsubscribeMenuActions()
  }
})

// Watch for orphan widgets
watch(
  () => boardStore.hasOrphanWidgets,
  (hasOrphans) => {
    const currentDocId = documentList.currentDocumentId.value

    if (hasOrphans && currentDocId && shownOrphanNotification.value !== currentDocId) {
      shownOrphanNotification.value = currentDocId

      const orphanCount = boardStore.orphanWidgets.length
      const moduleIds = boardStore.orphanModuleIds

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
  <div class="h-screen w-screen overflow-hidden flex flex-col">
    <!-- Unified App Bar -->
    <BkMenuBar
      platform="web"
      current-view="library"
      :is-saving="persistence.isSaving.value"
      :last-saved="persistence.lastSaved.value"
      :can-undo="persistence.canUndo.value"
      :can-redo="persistence.canRedo.value"
      :undo-entries="persistence.undoEntries.value"
      :redo-entries="persistence.redoEntries.value"
      @open-command-palette="openCommandPalette"
      @undo="handleUndo"
      @redo="handleRedo"
      @go-to-history="handleGoToHistory"
      @go-to-latest="handleGoToLatest"
      @switch-view="handleSwitchView"
    />

    <!-- Main Content -->
    <div class="flex-1 flex min-w-0 overflow-hidden">
      <!-- Library Sidebar -->
      <LibrarySidebar
        :module-types="libraryView.moduleTypes.value"
        :selected-type="libraryView.selectedModuleType.value"
        :total-count="libraryView.totalWidgetCount.value"
        :collapsed="sidebarCollapsed"
        @select-type="handleSelectType"
        @toggle-collapse="toggleSidebarCollapse"
      />

      <!-- Library Content -->
      <LibraryContent
        :widgets="libraryView.filteredWidgets.value"
        :selected-type-name="selectedTypeName"
        :search-query="libraryView.searchQuery.value"
        @search="handleSearch"
        @open-in-canvas="handleOpenInCanvas"
        @open-settings="handleOpenWidgetSettings"
      />
    </div>

    <!-- Modals -->
    <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
    <SettingsPanel />
    <DocumentPickerModal
      :open="isDocumentPickerOpen"
      :documents="documentList.documents.value"
      :active-document-id="documentList.currentDocumentId.value"
      :is-loading="documentList.isLoading.value"
      @close="isDocumentPickerOpen = false"
      @select="handleSelectDocument"
      @create="handleCreateDocument"
    />
  </div>
</template>
