import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import type { ModuleDefinition, Widget } from '@boardkit/core'

/**
 * Module type info for the sidebar
 */
export interface ModuleTypeInfo {
  moduleId: string
  displayName: string
  icon: string
  count: number
}

/**
 * Grid size for module cards in the library view.
 * - 'sm': 1 column, 1 row (compact modules like Counter)
 * - 'md': 1 column, 2 rows (medium modules like Text, Timer)
 * - 'lg': 2 columns, 2 rows (large modules like Kanban, Calendar)
 * - 'wide': 2 columns, 1 row (wide modules)
 */
export type LibraryCardSize = 'sm' | 'md' | 'lg' | 'wide'

/**
 * Widget with module info for display
 */
export interface LibraryWidget {
  widget: Widget
  moduleDef: ModuleDefinition | undefined
  displayName: string
  icon: string
  gridSize: LibraryCardSize
}

/**
 * Get the recommended grid size for a module based on its type.
 * This provides intelligent sizing based on the nature of the module content.
 */
function getModuleGridSize(moduleId: string): LibraryCardSize {
  const sizeMappings: Record<string, LibraryCardSize> = {
    // Large modules (2x2) - complex interactive content
    'kanban': 'lg',
    'task-radar': 'lg',
    'google-calendar': 'lg',

    // Wide modules (2x1) - horizontal content
    'scratchpad': 'wide',

    // Medium modules (1x2) - vertical content
    'text': 'md',
    'todo': 'md',
    'timer': 'md',

    // Small modules (1x1) - compact content
    'counter': 'sm',
  }

  return sizeMappings[moduleId] ?? 'md' // Default to medium
}

/**
 * Composable for the Library View.
 * Manages filtering, searching, and navigation for the library.
 */
export function useLibraryView() {
  const router = useRouter()
  const boardStore = useBoardStore()

  // ============================================================================
  // State
  // ============================================================================

  /** Currently selected module type (null = show all) */
  const selectedModuleType = ref<string | null>(null)

  /** Search query for filtering widgets */
  const searchQuery = ref('')

  // ============================================================================
  // Computed - Module Types
  // ============================================================================

  /**
   * Get all module types with their counts from the current document
   */
  const moduleTypes = computed<ModuleTypeInfo[]>(() => {
    // Trigger reactivity on registry changes
    moduleRegistry.version.value

    const widgets = boardStore.widgets
    const typeCounts = new Map<string, number>()

    // Count widgets by module type
    for (const widget of widgets) {
      const count = typeCounts.get(widget.moduleId) || 0
      typeCounts.set(widget.moduleId, count + 1)
    }

    // Build module type info array
    const types: ModuleTypeInfo[] = []
    for (const [moduleId, count] of typeCounts) {
      const moduleDef = moduleRegistry.get(moduleId)
      types.push({
        moduleId,
        displayName: moduleDef?.displayName ?? moduleId,
        icon: moduleDef?.icon ?? 'box',
        count,
      })
    }

    // Sort by display name
    types.sort((a, b) => a.displayName.localeCompare(b.displayName))

    return types
  })

  /**
   * Total count of all widgets
   */
  const totalWidgetCount = computed(() => boardStore.widgets.length)

  // ============================================================================
  // Computed - Filtered Widgets
  // ============================================================================

  /**
   * Widgets enriched with module info
   */
  const allLibraryWidgets = computed<LibraryWidget[]>(() => {
    moduleRegistry.version.value

    return boardStore.widgets.map((widget) => {
      const moduleDef = moduleRegistry.get(widget.moduleId)
      return {
        widget,
        moduleDef,
        displayName: moduleDef?.displayName ?? widget.moduleId,
        icon: moduleDef?.icon ?? 'box',
        gridSize: getModuleGridSize(widget.moduleId),
      }
    })
  })

  /**
   * Widgets filtered by selected type and search query
   */
  const filteredWidgets = computed<LibraryWidget[]>(() => {
    let widgets = allLibraryWidgets.value

    // Filter by module type
    if (selectedModuleType.value) {
      widgets = widgets.filter(
        (w) => w.widget.moduleId === selectedModuleType.value
      )
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      widgets = widgets.filter((w) => {
        // Search in display name
        if (w.displayName.toLowerCase().includes(query)) {
          return true
        }

        // Search in module state (if has title or label)
        const state = boardStore.getModuleState(w.widget.id) as Record<string, unknown> | null
        if (state) {
          // Check common title/label fields
          const titleFields = ['title', 'name', 'label', 'content', 'text']
          for (const field of titleFields) {
            const value = state[field]
            if (typeof value === 'string' && value.toLowerCase().includes(query)) {
              return true
            }
          }
        }

        return false
      })
    }

    return widgets
  })

  /**
   * Get widget title from its state (if available)
   */
  function getWidgetTitle(widgetId: string): string | null {
    const state = boardStore.getModuleState(widgetId) as Record<string, unknown> | null
    if (!state) return null

    // Check common title fields
    const titleFields = ['title', 'name', 'label']
    for (const field of titleFields) {
      const value = state[field]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }

    return null
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Select a module type to filter by
   */
  function selectModuleType(moduleId: string | null) {
    selectedModuleType.value = moduleId
  }

  /**
   * Update search query
   */
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  /**
   * Clear all filters
   */
  function clearFilters() {
    selectedModuleType.value = null
    searchQuery.value = ''
  }

  /**
   * Navigate to canvas and focus on a specific widget
   */
  function focusWidget(widgetId: string) {
    router.push({ path: '/', query: { widget: widgetId } })
  }

  /**
   * Navigate to canvas
   */
  function goToCanvas() {
    router.push('/')
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    selectedModuleType,
    searchQuery,

    // Computed
    moduleTypes,
    totalWidgetCount,
    filteredWidgets,

    // Actions
    selectModuleType,
    setSearchQuery,
    clearFilters,
    focusWidget,
    goToCanvas,
    getWidgetTitle,
  }
}
