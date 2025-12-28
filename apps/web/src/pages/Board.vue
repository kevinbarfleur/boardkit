<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBoardStore, registerCoreActions } from '@boardkit/core'
import { useTheme } from '@boardkit/ui'
import { registerModules } from '../modules'
import { registerWebActions } from '../actions/webActions'
import BoardCanvas from '../components/BoardCanvas.vue'
import Toolbar from '../components/Toolbar.vue'
import CommandPalette from '../components/CommandPalette.vue'
import SettingsPanel from '../components/SettingsPanel.vue'

// Register all modules before using the store
registerModules()

const boardStore = useBoardStore()
const { initTheme } = useTheme()

const isCommandPaletteOpen = ref(false)

const openCommandPalette = () => {
  isCommandPaletteOpen.value = true
}

const closeCommandPalette = () => {
  isCommandPaletteOpen.value = false
}

onMounted(() => {
  initTheme()
  boardStore.createNewBoard('Untitled Board')
  // Register core actions after Pinia store is ready
  registerCoreActions()
  // Register web-specific actions
  registerWebActions()
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col">
    <Toolbar />
    <BoardCanvas @open-command-palette="openCommandPalette" />
    <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
    <SettingsPanel />
  </div>
</template>
