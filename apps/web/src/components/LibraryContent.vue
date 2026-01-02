<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { BkIcon, BkInput } from '@boardkit/ui'
import LibraryModuleCard from './LibraryModuleCard.vue'
import type { LibraryWidget } from '../composables/useLibraryView'

interface Props {
  /** Filtered widgets to display */
  widgets: LibraryWidget[]
  /** Currently selected module type name (for display) */
  selectedTypeName: string | null
  /** Search query value */
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Emitted when search query changes */
  'search': [query: string]
  /** Emitted when user wants to open widget in canvas */
  'open-in-canvas': [widgetId: string]
  /** Emitted when user wants to open widget settings */
  'open-settings': [widgetId: string]
}>()

// Local search state with debounce
const localSearch = ref(props.searchQuery)

// Sync local search with prop
watch(() => props.searchQuery, (value) => {
  localSearch.value = value
})

// Debounced search emit
const debouncedEmitSearch = useDebounceFn((value: string) => {
  emit('search', value)
}, 300)

// Handle search input
function handleSearchInput(value: string) {
  localSearch.value = value
  debouncedEmitSearch(value)
}

// Clear search
function clearSearch() {
  localSearch.value = ''
  emit('search', '')
}
</script>

<template>
  <div class="flex-1 flex flex-col min-w-0 bg-background">
    <!-- Header -->
    <header class="shrink-0 border-b border-border px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <!-- Title -->
        <div class="flex items-center gap-3 min-w-0">
          <h1 class="text-lg font-semibold text-foreground truncate">
            {{ selectedTypeName ?? 'All Modules' }}
          </h1>
          <span class="text-sm text-muted-foreground">
            {{ widgets.length }} {{ widgets.length === 1 ? 'module' : 'modules' }}
          </span>
        </div>

        <!-- Search -->
        <div class="relative w-64">
          <BkIcon
            icon="search"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          />
          <BkInput
            :model-value="localSearch"
            placeholder="Search modules..."
            class="pl-9 pr-8"
            @update:model-value="handleSearchInput"
          />
          <button
            v-if="localSearch"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded hover:bg-accent transition-colors"
            @click="clearSearch"
          >
            <BkIcon icon="x" class="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Empty State -->
      <div
        v-if="widgets.length === 0"
        class="h-full flex flex-col items-center justify-center text-center"
      >
        <div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <BkIcon icon="inbox" class="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h2 class="text-lg font-medium text-foreground mb-1">
          {{ searchQuery ? 'No results found' : 'No modules yet' }}
        </h2>
        <p class="text-sm text-muted-foreground max-w-sm">
          <template v-if="searchQuery">
            Try adjusting your search or clearing filters
          </template>
          <template v-else>
            Add modules to your canvas to see them here
          </template>
        </p>
      </div>

      <!-- Module Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
      >
        <LibraryModuleCard
          v-for="libraryWidget in widgets"
          :key="libraryWidget.widget.id"
          :widget-id="libraryWidget.widget.id"
          :module-id="libraryWidget.widget.moduleId"
          :display-name="libraryWidget.displayName"
          :icon="libraryWidget.icon"
          @open-in-canvas="emit('open-in-canvas', $event)"
          @open-settings="emit('open-settings', $event)"
        />
      </div>
    </div>
  </div>
</template>
