<script setup lang="ts">
/**
 * FilePickerModal - Modal for selecting a board file from vault
 *
 * Shows a list of available board files with search/filter capability.
 */

import { ref, computed, watch } from 'vue'
import { BkModal, BkSearchInput, BkIcon } from '@boardkit/ui'
import type { VaultFile } from '../composables/useVault'

interface Props {
  open: boolean
  files: VaultFile[]
  activeFilePath: string | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  close: []
  select: [path: string]
  create: []
}>()

const searchQuery = ref('')

// Reset search when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
  }
})

const filteredFiles = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.files
  }
  const query = searchQuery.value.toLowerCase()
  return props.files.filter(file =>
    file.name.toLowerCase().includes(query)
  )
})

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString()
}

const handleSelect = (path: string) => {
  emit('select', path)
  emit('close')
}

const handleCreate = () => {
  emit('create')
  emit('close')
}
</script>

<template>
  <BkModal
    :open="open"
    title="Open Board"
    size="md"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-4">
      <!-- Search -->
      <BkSearchInput
        v-model="searchQuery"
        placeholder="Search boards..."
        autofocus
      />

      <!-- File List -->
      <div class="max-h-80 overflow-y-auto">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <BkIcon icon="loader" class="w-5 h-5 text-muted-foreground animate-spin" />
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredFiles.length === 0" class="py-8 text-center">
          <BkIcon icon="file-text" class="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p v-if="searchQuery" class="text-sm text-muted-foreground">No boards match "{{ searchQuery }}"</p>
          <p v-else class="text-sm text-muted-foreground">No boards in vault</p>
        </div>

        <!-- File list -->
        <div v-else class="space-y-1">
          <button
            v-for="file in filteredFiles"
            :key="file.path"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
            :class="[
              file.path === activeFilePath
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 text-foreground'
            ]"
            @click="handleSelect(file.path)"
          >
            <BkIcon
              :icon="file.path === activeFilePath ? 'check' : 'file-text'"
              class="w-4 h-4 shrink-0"
              :class="file.path === activeFilePath ? 'text-primary' : 'text-muted-foreground'"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ file.name }}</p>
              <p class="text-xs text-muted-foreground">{{ formatRelativeTime(file.modifiedAt) }}</p>
            </div>
            <BkIcon
              v-if="file.path === activeFilePath"
              icon="check-circle"
              class="w-4 h-4 text-primary shrink-0"
            />
          </button>
        </div>
      </div>

      <!-- Create new board button -->
      <button
        class="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        @click="handleCreate"
      >
        <BkIcon icon="plus" class="w-4 h-4" />
        Create New Board
      </button>
    </div>
  </BkModal>
</template>
