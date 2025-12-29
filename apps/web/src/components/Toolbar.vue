<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBoardStore } from '@boardkit/core'
import { BkDropdown, BkIconButton, BkTooltip, BkDivider, BkIcon, BkEditableText, BkHistoryList, useTheme } from '@boardkit/ui'
import type { HistoryEntry } from '@boardkit/platform'

interface Props {
  isSaving?: boolean
  lastSaved?: number | null
  canUndo?: boolean
  canRedo?: boolean
  undoEntries?: HistoryEntry[]
  redoEntries?: HistoryEntry[]
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  lastSaved: null,
  canUndo: false,
  canRedo: false,
  undoEntries: () => [],
  redoEntries: () => [],
})

const emit = defineEmits<{
  newBoard: []
  export: []
  import: []
  openCommandPalette: []
  undo: []
  redo: []
  goToHistory: [id: string]
  goToLatest: []
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

const fileMenuGroups = [
  {
    items: [
      { id: 'new', label: 'New Board', icon: 'plus', shortcut: '⌘N' },
    ],
  },
  {
    items: [
      { id: 'import', label: 'Open File...', icon: 'folder', shortcut: '⌘O' },
      { id: 'export', label: 'Export as .boardkit', icon: 'download' },
    ],
  },
]

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

// Undo dropdown state
const showUndoDropdown = ref(false)
const showRedoDropdown = ref(false)

const handleUndoClick = () => {
  if (props.canUndo) {
    emit('undo')
  }
}

const handleRedoClick = () => {
  if (props.canRedo) {
    emit('redo')
  }
}

const handleHistorySelect = (id: string) => {
  emit('goToHistory', id)
  showUndoDropdown.value = false
  showRedoDropdown.value = false
}

const handleGoToLatest = () => {
  emit('goToLatest')
  showRedoDropdown.value = false
}
</script>

<template>
  <header class="toolbar flex h-14 items-center justify-between border-b bg-card px-4 fixed top-0 left-0 right-0 z-50">
    <!-- Left section: Logo + Title + File Menu -->
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted p-1.5">
        <svg viewBox="0 0 24 24" fill="none" class="w-full h-full">
          <rect x="3" y="3" width="8" height="8" rx="1.5" class="fill-foreground/30" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" class="fill-foreground/45" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" class="fill-foreground/60" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" class="fill-foreground/80" />
        </svg>
      </div>

      <!-- Editable Title -->
      <BkEditableText
        v-model="title"
        placeholder="Untitled Board"
        max-width="240px"
        @update:model-value="updateTitle"
      />

      <!-- File Menu -->
      <BkDropdown :groups="fileMenuGroups" @select="handleFileMenu">
        <template #trigger>
          <BkIconButton ariaLabel="File menu" size="sm">
            <BkIcon icon="chevron-down" :size="14" />
          </BkIconButton>
        </template>
      </BkDropdown>
    </div>

    <!-- Center section: Command Palette trigger -->
    <button
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-sm text-muted-foreground transition-colors"
      @click="emit('openCommandPalette')"
    >
      <BkIcon icon="search" :size="14" />
      <span>Search commands...</span>
      <kbd class="ml-2 px-1.5 py-0.5 text-xs rounded bg-muted font-mono">⌘K</kbd>
    </button>

    <!-- Right section: History + Actions -->
    <div class="flex items-center gap-1">
      <!-- Undo/Redo -->
      <div class="flex items-center">
        <!-- Undo Button -->
        <div
          class="relative"
          @mouseenter="showUndoDropdown = true"
          @mouseleave="showUndoDropdown = false"
        >
          <BkTooltip :content="canUndo ? 'Undo' : 'Nothing to undo'">
            <BkIconButton
              ariaLabel="Undo"
              :disabled="!canUndo"
              @click="handleUndoClick"
            >
              <BkIcon icon="undo-2" />
            </BkIconButton>
          </BkTooltip>

          <!-- Undo Dropdown -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showUndoDropdown && undoEntries.length > 0"
              class="absolute top-full right-0 mt-1 z-50"
            >
              <BkHistoryList
                :items="undoEntries"
                title="Previous versions"
                @select="handleHistorySelect"
              />
            </div>
          </Transition>
        </div>

        <!-- Redo Button -->
        <div
          class="relative"
          @mouseenter="showRedoDropdown = true"
          @mouseleave="showRedoDropdown = false"
        >
          <BkTooltip :content="canRedo ? 'Redo' : 'Up to date'">
            <BkIconButton
              ariaLabel="Redo"
              :disabled="!canRedo"
              @click="handleRedoClick"
            >
              <BkIcon icon="redo-2" />
            </BkIconButton>
          </BkTooltip>

          <!-- Redo Dropdown -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showRedoDropdown"
              class="absolute top-full right-0 mt-1 z-50"
            >
              <BkHistoryList
                :items="redoEntries"
                :title="canRedo ? 'Newer versions' : 'Status'"
                empty-text="Up to date"
                :show-go-to-latest="redoEntries.length > 0"
                @select="handleHistorySelect"
                @go-to-latest="handleGoToLatest"
              />
            </div>
          </Transition>
        </div>
      </div>

      <BkDivider orientation="vertical" class="h-6 mx-1" />

      <BkTooltip content="Reset view">
        <BkIconButton ariaLabel="Reset view" @click="resetView">
          <BkIcon icon="rotate-ccw" />
        </BkIconButton>
      </BkTooltip>

      <BkTooltip :content="theme === 'dark' ? 'Light mode' : 'Dark mode'">
        <BkIconButton ariaLabel="Toggle theme" @click="toggleTheme">
          <BkIcon v-if="theme === 'dark'" icon="sun" />
          <BkIcon v-else icon="moon" />
        </BkIconButton>
      </BkTooltip>
    </div>
  </header>
</template>
