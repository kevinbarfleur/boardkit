<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useBoardStore, registerCoreActions, pluginManager, type BoardkitDocument } from '@boardkit/core'
import { useTheme, useToast, BkModalProvider, BkToastProvider } from '@boardkit/ui'
import { useCanvasExport, useSidebarState } from '@boardkit/app-common'
import { registerModules } from './modules'
import { registerDesktopActions } from './actions/desktopActions'
import { usePersistence } from './composables/usePersistence'
import { useVault } from './composables/useVault'
import { useSettingsPanel } from './composables/useSettingsPanel'
import BoardCanvas from './components/BoardCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import CommandPalette from './components/CommandPalette.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import VaultSetupModal from './components/VaultSetupModal.vue'
import VaultSidebar from './components/VaultSidebar.vue'
import ElementPropertiesPanel from './components/ElementPropertiesPanel.vue'

// Register all modules before using the store
registerModules()

const boardStore = useBoardStore()
const { initTheme } = useTheme()
const toaster = useToast()
const persistence = usePersistence()
const vault = useVault()
const { openAppSettings } = useSettingsPanel()
const canvasExport = useCanvasExport()

// Canvas component ref for export
const boardCanvasRef = ref<InstanceType<typeof BoardCanvas> | null>(null)

// Track if we've already shown orphan widget notification for this session
const shownOrphanNotification = ref<string | null>(null)

const isCommandPaletteOpen = ref(false)
const { sidebarCollapsed, toggleSidebarCollapse } = useSidebarState()
const isInitialized = ref(false)
const unlisteners: UnlistenFn[] = []

const openCommandPalette = () => {
  isCommandPaletteOpen.value = true
}

const closeCommandPalette = () => {
  isCommandPaletteOpen.value = false
}

const handleNewBoard = async () => {
  await persistence.createDocument('Untitled Board')
}

const handleExport = async () => {
  await persistence.exportToFile()
}

const handleImport = async () => {
  await persistence.importFromFile()
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

// Vault handlers
const handleVaultSetup = async () => {
  await persistence.onVaultSetup()
  isInitialized.value = true

  // Setup autosave after vault is configured
  persistence.setupAutosave()

  // Setup file watching
  persistence.setupFileWatching(handleExternalChange)
}

const handleSelectFile = async (path: string) => {
  // Check for unsaved changes
  if (boardStore.isDirty) {
    // For now, save before switching
    await persistence.saveDocument()
  }
  await persistence.openDocument(path)
}

const handleCreateFile = async () => {
  await persistence.createDocument('Untitled Board')
}

const handleDeleteFile = async (path: string) => {
  await persistence.deleteDocument(path)
}

const handleRenameFile = async (path: string, newName: string) => {
  await persistence.renameDocument(path, newName)
}

const handleDuplicateFile = async (path: string) => {
  await persistence.duplicateDocument(path)
}

const handleTitleChange = async (newTitle: string) => {
  // Rename the file to match the new title
  const currentPath = persistence.currentFilePath.value
  if (currentPath && newTitle.trim()) {
    await persistence.renameDocument(currentPath, newTitle.trim())
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
    console.error('[App] PNG export failed:', error)
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
    console.error('[App] SVG export failed:', error)
    toaster.error('Failed to export SVG')
  }
}

const handleChangeVault = async () => {
  // Stop watching and select new vault
  persistence.stopFileWatching()

  const path = await vault.selectVaultFolder()
  if (path) {
    await persistence.onVaultSetup()
    persistence.setupFileWatching(handleExternalChange)
  }
}

const handleExternalChange = (doc: BoardkitDocument) => {
  // For now, just reload the document (last-write-wins)
  // In the future, we could show a notification and let user decide
  boardStore.loadDocument(doc)
  boardStore.markClean()
}

onMounted(async () => {
  initTheme()

  // Initialize persistence (returns false if vault not configured)
  const initialized = await persistence.initialize()

  if (initialized) {
    isInitialized.value = true

    // Setup autosave
    persistence.setupAutosave()

    // Setup file watching for external changes
    persistence.setupFileWatching(handleExternalChange)
  }

  // Register core actions after Pinia store is ready
  registerCoreActions()

  // Register desktop-specific actions
  registerDesktopActions()

  // Listen for Tauri menu events
  unlisteners.push(
    await listen('open-command-palette', () => {
      openCommandPalette()
    })
  )

  unlisteners.push(
    await listen('menu-new-board', () => {
      handleNewBoard()
    })
  )

  unlisteners.push(
    await listen('menu-reset-view', () => {
      boardStore.updateViewport({ x: 0, y: 0, zoom: 1 })
    })
  )

  unlisteners.push(
    await listen('menu-open-file', () => {
      handleImport()
    })
  )

  unlisteners.push(
    await listen('menu-save', () => {
      // Autosave handles this, but we can trigger immediate save
      persistence.saveDocument()
    })
  )

  unlisteners.push(
    await listen('menu-export', () => {
      handleExport()
    })
  )

  unlisteners.push(
    await listen('menu-undo', () => {
      handleUndo()
    })
  )

  unlisteners.push(
    await listen('menu-redo', () => {
      handleRedo()
    })
  )

  unlisteners.push(
    await listen('menu-toggle-sidebar', () => {
      toggleSidebarCollapse()
    })
  )

  // Initialize plugin manager (loads enabled plugins)
  await pluginManager.initialize()
})

// Watch for orphan widgets and show notification
watch(
  () => boardStore.hasOrphanWidgets,
  (hasOrphans) => {
    const currentPath = persistence.currentFilePath.value

    // Only show notification once per document session
    if (hasOrphans && currentPath && shownOrphanNotification.value !== currentPath) {
      shownOrphanNotification.value = currentPath

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

onUnmounted(() => {
  // Stop file watching
  persistence.stopFileWatching()

  // Cleanup all listeners
  unlisteners.forEach((unlisten) => unlisten())
})
</script>

<template>
  <BkToastProvider>
    <BkModalProvider>
      <!-- Vault Setup Modal (first launch) -->
      <VaultSetupModal
        v-if="!vault.isConfigured.value"
        @setup="handleVaultSetup"
      />

      <!-- Main App (after vault is configured) -->
      <div v-else class="h-screen w-screen overflow-hidden flex">
        <!-- Vault Sidebar -->
        <VaultSidebar
          :files="vault.files.value"
          :active-file-path="persistence.currentFilePath.value"
          :vault-name="vault.vaultName.value"
          :is-loading="persistence.isLoading.value"
          :collapsed="sidebarCollapsed"
          @select="handleSelectFile"
          @create="handleCreateFile"
          @delete="handleDeleteFile"
          @rename="handleRenameFile"
          @duplicate="handleDuplicateFile"
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
            @new-board="handleNewBoard"
            @export="handleExport"
            @export-png="handleExportPng"
            @export-svg="handleExportSvg"
            @import="handleImport"
            @open-command-palette="openCommandPalette"
            @undo="handleUndo"
            @redo="handleRedo"
            @go-to-history="handleGoToHistory"
            @go-to-latest="handleGoToLatest"
            @title-change="handleTitleChange"
          />
          <BoardCanvas ref="boardCanvasRef" @open-command-palette="openCommandPalette" />
          <ElementPropertiesPanel />
        </div>

        <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
        <SettingsPanel />
      </div>
    </BkModalProvider>
  </BkToastProvider>
</template>
