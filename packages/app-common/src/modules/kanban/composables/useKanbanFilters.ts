import { ref, computed, type Ref } from 'vue'
import type { KanbanItem, KanbanPriority } from '../types'

export interface KanbanFilters {
  searchQuery: string
  priority: KanbanPriority | null
  tags: string[]
}

/**
 * Composable for Kanban filtering and search
 */
export function useKanbanFilters(items: Ref<KanbanItem[]>) {
  // Filter state
  const searchQuery = ref('')
  const filterPriority = ref<KanbanPriority | null>(null)
  const filterTags = ref<string[]>([])

  // Check if any filters are active
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== '' ||
      filterPriority.value !== null ||
      filterTags.value.length > 0
    )
  })

  /**
   * Filter items based on current filter state
   */
  const filteredItems = computed(() => {
    let result = items.value

    // Search filter (title and description)
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    }

    // Priority filter
    if (filterPriority.value) {
      result = result.filter((item) => item.priority === filterPriority.value)
    }

    // Tag filter (item must have ALL selected tags)
    if (filterTags.value.length > 0) {
      result = result.filter((item) =>
        filterTags.value.every((tag) => (item.tags ?? []).includes(tag))
      )
    }

    return result
  })

  /**
   * Get filtered items for a specific column
   */
  function getFilteredColumnItems(columnId: string): KanbanItem[] {
    return filteredItems.value
      .filter((item) => item.columnId === columnId)
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Set search query
   */
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  /**
   * Set priority filter
   */
  function setFilterPriority(priority: KanbanPriority | null) {
    filterPriority.value = priority
  }

  /**
   * Toggle a tag filter
   */
  function toggleTagFilter(tag: string) {
    const index = filterTags.value.indexOf(tag)
    if (index === -1) {
      filterTags.value.push(tag)
    } else {
      filterTags.value.splice(index, 1)
    }
  }

  /**
   * Clear all filters
   */
  function clearFilters() {
    searchQuery.value = ''
    filterPriority.value = null
    filterTags.value = []
  }

  return {
    // State
    searchQuery,
    filterPriority,
    filterTags,
    hasActiveFilters,
    // Computed
    filteredItems,
    // Methods
    getFilteredColumnItems,
    setSearchQuery,
    setFilterPriority,
    toggleTagFilter,
    clearFilters,
  }
}
