<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useBoardStore, registerCoreActions } from '@boardkit/core'
import { useTheme } from '@boardkit/ui'
import { registerModules } from './modules'
import { registerDesktopActions } from './actions/desktopActions'
import { usePersistence } from './composables/usePersistence'
import BoardCanvas from './components/BoardCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import CommandPalette from './components/CommandPalette.vue'
import SettingsPanel from './components/SettingsPanel.vue'

// Register all modules before using the store
registerModules()

const boardStore = useBoardStore()
const { initTheme } = useTheme()
const persistence = usePersistence()

const isCommandPaletteOpen = ref(false)
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

onMounted(async () => {
  initTheme()

  // Initialize persistence (loads last document or creates new)
  await persistence.initialize()

  // Setup autosave
  persistence.setupAutosave()

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
})

onUnmounted(() => {
  // Cleanup all listeners
  unlisteners.forEach((unlisten) => unlisten())
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col">
    <Toolbar
      :is-saving="persistence.isSaving.value"
      :last-saved="persistence.lastSaved.value"
      :can-undo="persistence.canUndo.value"
      :can-redo="persistence.canRedo.value"
      :undo-entries="persistence.undoEntries.value"
      :redo-entries="persistence.redoEntries.value"
      @new-board="handleNewBoard"
      @export="handleExport"
      @import="handleImport"
      @open-command-palette="openCommandPalette"
      @undo="handleUndo"
      @redo="handleRedo"
      @go-to-history="handleGoToHistory"
      @go-to-latest="handleGoToLatest"
    />
    <BoardCanvas @open-command-palette="openCommandPalette" />
    <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
    <SettingsPanel />
  </div>
</template>
