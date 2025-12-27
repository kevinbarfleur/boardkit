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
  <header class="toolbar h-12 border-b bg-background flex items-center px-4 gap-4 shrink-0">
    <div class="flex items-center gap-2">
      <svg class="h-6 w-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" class="fill-foreground"/>
        <rect x="6" y="6" width="8" height="8" rx="2" class="fill-background/70"/>
        <rect x="18" y="6" width="8" height="8" rx="2" class="fill-background/70"/>
        <rect x="6" y="18" width="8" height="8" rx="2" class="fill-background/70"/>
        <rect x="18" y="18" width="8" height="8" rx="2" class="fill-background/50"/>
      </svg>
      <span class="font-semibold text-sm">
        {{ title }}
        <span v-if="isDirty" class="text-muted-foreground">*</span>
      </span>
    </div>

    <BkDivider orientation="vertical" class="h-6" />

<BkDropdown :items="availableModules" @select="addWidgetFromMenu">
      <template #trigger>
        <BkButton variant="secondary" size="sm">
          <BkIcon icon="plus" size="sm" class="mr-1" />
          Add Widget
        </BkButton>
      </template>
    </BkDropdown>

    <div class="flex-1" />

<div class="flex items-center gap-1">
      <BkTooltip content="Reset view">
        <BkIconButton aria-label="Reset view" @click="resetView">
          <BkIcon icon="rotate-ccw" size="sm" />
        </BkIconButton>
      </BkTooltip>

      <BkTooltip :content="theme === 'dark' ? 'Light mode' : 'Dark mode'">
        <BkIconButton aria-label="Toggle theme" @click="toggleTheme">
          <BkIcon v-if="theme === 'dark'" icon="sun" size="sm" />
          <BkIcon v-else icon="moon" size="sm" />
        </BkIconButton>
      </BkTooltip>
    </div>
  </header>
</template>
