<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useBoardStore, registerCoreActions } from '@boardkit/core'
import { useTheme } from '@boardkit/ui'
import { registerModules } from './modules'
import { usePersistence } from './composables/usePersistence'
import BoardCanvas from './components/BoardCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import CommandPalette from './components/CommandPalette.vue'

// Register all modules before using the store
registerModules()

const boardStore = useBoardStore()
const { initTheme } = useTheme()
const {
  initialize,
  createDocument,
  saveDocument,
  setupAutosave,
  exportToFile,
  importFromFile,
  isSaving,
  lastSaved,
} = usePersistence()

const isCommandPaletteOpen = ref(false)
const unlisteners: UnlistenFn[] = []

const openCommandPalette = () => {
  isCommandPaletteOpen.value = true
}

const closeCommandPalette = () => {
  isCommandPaletteOpen.value = false
}

const handleNewBoard = async () => {
  await createDocument('Untitled Board')
}

const handleExport = async () => {
  await exportToFile()
}

const handleImport = async () => {
  await importFromFile()
}

onMounted(async () => {
  initTheme()

  // Initialize persistence (loads last document or creates new)
  await initialize()

  // Setup autosave
  setupAutosave()

  // Register core actions after Pinia store is ready
  registerCoreActions()

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
      saveDocument()
    })
  )

  unlisteners.push(
    await listen('menu-export', () => {
      handleExport()
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
      :is-saving="isSaving"
      :last-saved="lastSaved"
      @new-board="handleNewBoard"
      @export="handleExport"
      @import="handleImport"
    />
    <BoardCanvas @open-command-palette="openCommandPalette" />
    <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
  </div>
</template>
