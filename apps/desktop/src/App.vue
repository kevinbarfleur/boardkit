<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBoardStore } from '@boardkit/core'
import { useTheme } from '@boardkit/ui'
import { registerModules } from './modules'
import BoardCanvas from './components/BoardCanvas.vue'
import Toolbar from './components/Toolbar.vue'
import CommandPalette from './components/CommandPalette.vue'

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
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col">
    <Toolbar />
    <BoardCanvas @open-command-palette="openCommandPalette" />
    <CommandPalette :open="isCommandPaletteOpen" @close="closeCommandPalette" />
  </div>
</template>
