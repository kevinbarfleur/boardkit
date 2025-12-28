<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { registerCoreActions } from '@boardkit/core'
import { useTheme } from '@boardkit/ui'
import { registerModules } from '../modules'
import { registerWebActions } from '../actions/webActions'
import { usePersistence } from '../composables/usePersistence'
import BoardCanvas from '../components/BoardCanvas.vue'
import Toolbar from '../components/Toolbar.vue'
import CommandPalette from '../components/CommandPalette.vue'
import SettingsPanel from '../components/SettingsPanel.vue'

// Register all modules before using the store
registerModules()

const { initTheme } = useTheme()
const persistence = usePersistence()

const isCommandPaletteOpen = ref(false)

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

onMounted(async () => {
  initTheme()

  // Initialize persistence (loads last document or creates new)
  await persistence.initialize()

  // Register core actions after Pinia store is ready
  registerCoreActions()

  // Register web-specific actions
  registerWebActions()

  // Setup autosave
  persistence.setupAutosave()
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
      @new-board="persistence.createDocument('Untitled Board')"
      @export="persistence.exportToFile()"
      @import="persistence.importFromFile()"
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
