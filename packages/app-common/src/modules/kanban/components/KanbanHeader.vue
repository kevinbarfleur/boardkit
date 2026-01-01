<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BkIcon } from '@boardkit/ui'

interface Props {
  total: number
  completed: number
  showCompletionRate?: boolean
  searchQuery?: string
  hasActiveFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCompletionRate: true,
  searchQuery: '',
  hasActiveFilters: false,
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  addColumn: []
  clearFilters: []
}>()

// Computed
const completionRate = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.completed / props.total) * 100)
})

// Search state
const localSearch = ref(props.searchQuery)

// Sync local search with prop
watch(() => props.searchQuery, (value) => {
  localSearch.value = value
})

function handleSearchInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  localSearch.value = value
  emit('update:searchQuery', value)
}

function handleClearSearch() {
  localSearch.value = ''
  emit('update:searchQuery', '')
}
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

    <!-- Center: Search -->
    <div class="flex-1 max-w-xs">
      <div class="relative">
        <BkIcon
          icon="search"
          :size="14"
          class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          :value="localSearch"
          type="text"
          placeholder="Search cards..."
          class="w-full h-7 pl-7 pr-7 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          @input="handleSearchInput"
        />
        <button
          v-if="localSearch"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          @click="handleClearSearch"
        >
          <BkIcon icon="x" :size="12" />
        </button>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- Clear filters button -->
      <button
        v-if="hasActiveFilters"
        class="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
        @click="emit('clearFilters')"
      >
        <BkIcon icon="x" :size="12" />
        Clear filters
      </button>

      <!-- Add column button -->
      <button
        class="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
        title="Add column"
        @click="emit('addColumn')"
      >
        <BkIcon icon="plus" :size="14" />
      </button>
    </div>
  </div>
</template>
