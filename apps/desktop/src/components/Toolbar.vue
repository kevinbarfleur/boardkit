<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import { BkButton, BkDropdown, BkIconButton, BkTooltip, BkDivider, BkIcon, BkEditableText, useTheme } from '@boardkit/ui'

interface Props {
  isSaving?: boolean
  lastSaved?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  lastSaved: null,
})

const emit = defineEmits<{
  newBoard: []
  export: []
  import: []
}>()

const boardStore = useBoardStore()
const { theme, toggleTheme } = useTheme()

const title = ref(boardStore.title)

watch(() => boardStore.title, (newTitle) => {
  title.value = newTitle
})

const updateTitle = (newTitle: string) => {
  boardStore.setTitle(newTitle)
}

const isDirty = computed(() => boardStore.isDirty)

const saveStatus = computed(() => {
  if (props.isSaving) return 'Saving...'
  if (isDirty.value) return 'Unsaved changes'
  if (props.lastSaved) {
    const date = new Date(props.lastSaved)
    return `Saved ${date.toLocaleTimeString()}`
  }
  return 'Saved'
})

const availableModules = computed(() => {
  return moduleRegistry.getAll().map((m) => ({
    id: m.moduleId,
    label: m.displayName,
  }))
})

const fileMenuItems = [
  { id: 'new', label: 'New Board' },
  { id: 'import', label: 'Open File...' },
  { id: 'export', label: 'Export as .boardkit' },
]

const addWidgetFromMenu = (item: { id: string }) => {
  boardStore.addWidget(item.id)
}

const handleFileMenu = (item: { id: string }) => {
  switch (item.id) {
    case 'new':
      emit('newBoard')
      break
    case 'import':
      emit('import')
      break
    case 'export':
      emit('export')
      break
  }
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

      <!-- Editable Title -->
      <div class="flex items-center gap-1">
        <BkEditableText
          v-model="title"
          placeholder="Untitled Board"
          @update:model-value="updateTitle"
        />
        <span v-if="isDirty" class="text-muted-foreground text-sm">*</span>
      </div>

      <!-- File Menu -->
      <BkDropdown :items="fileMenuItems" @select="handleFileMenu">
        <template #trigger>
          <BkIconButton aria-label="File menu" size="sm">
            <BkIcon icon="chevron-down" :size="14" />
          </BkIconButton>
        </template>
      </BkDropdown>

      <!-- Save Status -->
      <span class="text-xs text-muted-foreground">
        {{ saveStatus }}
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
