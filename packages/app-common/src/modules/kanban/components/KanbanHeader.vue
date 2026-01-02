<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BkIcon, BkSelect, BkMultiSelect, BkSearchInput } from '@boardkit/ui'
import type { MultiSelectOption } from '@boardkit/ui'
import type { KanbanPriority } from '../types'
import { getTagColor } from '../types'

interface Props {
  total: number
  completed: number
  showCompletionRate?: boolean
  searchQuery?: string
  hasActiveFilters?: boolean
  // Filter state
  filterPriority?: KanbanPriority | null
  filterTags?: string[]
  allTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  showCompletionRate: true,
  searchQuery: '',
  hasActiveFilters: false,
  filterPriority: null,
  filterTags: () => [],
  allTags: () => [],
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterPriority': [value: KanbanPriority | null]
  'update:filterTags': [value: string[]]
  addColumn: []
  clearFilters: []
}>()

// Priority filter options
const priorityOptions = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

// Tag options for multi-select
const tagOptions = computed<MultiSelectOption[]>(() => {
  return props.allTags.map(tag => ({
    value: tag,
    label: tag,
    color: getTagColor(tag),
  }))
})

// Handle priority change
function handlePriorityChange(value: string | number | null) {
  emit('update:filterPriority', (value === '' ? null : value) as KanbanPriority | null)
}

// Handle tags change
function handleTagsChange(tags: string[]) {
  emit('update:filterTags', tags)
}

// Computed
const completionRate = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.completed / props.total) * 100)
})

// Search state - use computed for two-way binding
const localSearch = computed({
  get: () => props.searchQuery,
  set: (value: string) => emit('update:searchQuery', value),
})
</script>

<template>
  <div class="flex items-center justify-between px-3 py-2 border-b border-border gap-3">
    <!-- Left: Stats -->
    <div v-if="showCompletionRate" class="flex items-center gap-3 flex-shrink-0">
      <span class="text-xs text-muted-foreground">
        {{ completed }}/{{ total }} done
      </span>
      <span class="text-xs text-muted-foreground">
        {{ completionRate }}%
      </span>
    </div>

    <!-- Center: Search + Filters (all h-8, text-sm) -->
    <div class="flex items-center gap-3 flex-1 max-w-xl">
      <!-- Search -->
      <BkSearchInput
        v-model="localSearch"
        placeholder="Search..."
        size="sm"
        class="flex-1 min-w-28"
      />

      <!-- Priority filter -->
      <BkSelect
        :model-value="filterPriority ?? ''"
        :options="priorityOptions"
        placeholder="Priority"
        size="sm"
        class="shrink-0"
        @update:model-value="handlePriorityChange"
      />

      <!-- Tags filter -->
      <BkMultiSelect
        v-if="allTags.length > 0"
        :model-value="filterTags"
        :options="tagOptions"
        placeholder="Tags"
        size="sm"
        class="shrink-0"
        @update:model-value="handleTagsChange"
      />
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- Clear filters button -->
      <button
        v-if="hasActiveFilters"
        class="flex items-center gap-1 h-8 px-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        @click="emit('clearFilters')"
      >
        <BkIcon icon="x" :size="14" />
        Clear
      </button>

      <!-- Add column button -->
      <button
        class="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        title="Add column"
        @click="emit('addColumn')"
      >
        <BkIcon icon="plus" :size="16" />
      </button>
    </div>
  </div>
</template>
