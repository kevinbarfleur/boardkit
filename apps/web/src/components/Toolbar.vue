<script setup lang="ts">
import { computed } from 'vue'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import { BkButton, BkDropdown, BkIconButton, BkTooltip, BkDivider, BkIcon, useTheme } from '@boardkit/ui'

const boardStore = useBoardStore()
const { theme, toggleTheme } = useTheme()

const title = computed(() => boardStore.title)
const isDirty = computed(() => boardStore.isDirty)

const availableModules = computed(() => {
  return moduleRegistry.getAll().map((m) => ({
    id: m.moduleId,
    label: m.displayName,
  }))
})

const addWidgetFromMenu = (item: { id: string }) => {
  boardStore.addWidget(item.id)
}

const resetView = () => {
  boardStore.updateViewport({ x: 0, y: 0, zoom: 1 })
}
</script>

<template>
  <header class="toolbar flex h-14 items-center justify-between border-b bg-card px-4 fixed top-0 left-0 right-0 z-50">
    <!-- Left section: Logo + Title -->
    <div class="flex items-center gap-4">
      <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
        <BkIcon icon="layout-grid" class="text-primary-foreground" />
      </div>
      <span class="text-sm font-medium text-foreground">
        {{ title }}
        <span v-if="isDirty" class="text-muted-foreground">*</span>
      </span>

      <BkDivider orientation="vertical" class="h-6" />

      <!-- Add Widget -->
      <BkDropdown :items="availableModules" @select="addWidgetFromMenu">
        <template #trigger>
          <BkButton>
            <BkIcon icon="plus" />
            Add Widget
          </BkButton>
        </template>
      </BkDropdown>
    </div>

    <!-- Right section: Actions -->
    <div class="flex items-center gap-2">
      <BkTooltip content="Reset view">
        <BkIconButton aria-label="Reset view" @click="resetView">
          <BkIcon icon="rotate-ccw" />
        </BkIconButton>
      </BkTooltip>

      <BkTooltip :content="theme === 'dark' ? 'Light mode' : 'Dark mode'">
        <BkIconButton aria-label="Toggle theme" @click="toggleTheme">
          <BkIcon v-if="theme === 'dark'" icon="sun" />
          <BkIcon v-else icon="moon" />
        </BkIconButton>
      </BkTooltip>
    </div>
  </header>
</template>
