<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, kanbanContractV1, kanbanStatsContractV1 } from '@boardkit/core'
import { BkIcon, useModal } from '@boardkit/ui'
import type { KanbanState, KanbanItem, KanbanColumn as KanbanColumnType } from './types'
import type { PublicKanbanBoard, PublicKanbanStats } from '@boardkit/core'
import { KanbanColumn, KanbanHeader } from './components'
import { useKanbanItems } from './composables/useKanbanItems'
import { useKanbanColumns } from './composables/useKanbanColumns'
import { useKanbanDragDrop } from './composables/useKanbanDragDrop'
import { useKanbanFilters } from './composables/useKanbanFilters'

interface Props {
  context: ModuleContext<KanbanState>
}

const props = defineProps<Props>()

// Modal
const { openModal, confirm } = useModal()

// Context getter to ensure reactivity in composables
const getContext = () => props.context

// Composables
const {
  items,
  allTags,
  getColumnItems,
  addItem,
  updateItem,
  removeItem,
} = useKanbanItems(getContext)

const {
  columns,
  completionStats,
  getColumnItemCount,
  addColumn,
  updateColumn,
  removeColumn,
} = useKanbanColumns(getContext)

const {
  draggedItemId,
  dragOverColumnId,
  dragOverItemId,
  dropPosition,
  handleDragStart,
  handleDragOverColumn,
  handleDragOverItem,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
} = useKanbanDragDrop(getContext)

// Filtering
const {
  searchQuery,
  hasActiveFilters,
  getFilteredColumnItems,
  setSearchQuery,
  clearFilters,
} = useKanbanFilters(items)

// Settings
const showWipLimits = computed(() => props.context.state.showWipLimits)
const showItemCount = computed(() => props.context.state.showItemCount)
const showCompletionRate = computed(() => props.context.state.showCompletionRate)
const showDueDate = computed(() => props.context.state.showDueDate ?? true)
const showPriority = computed(() => props.context.state.showPriority ?? true)
const showTags = computed(() => props.context.state.showTags ?? true)
const showChecklist = computed(() => props.context.state.showChecklist ?? true)
const compactMode = computed(() => props.context.state.compactMode)
const confirmDeleteCard = computed(() => props.context.state.confirmDeleteCard ?? true)
const confirmDeleteColumn = computed(() => props.context.state.confirmDeleteColumn ?? true)

// Column colors palette
const columnColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

// Handlers
function handleAddItem(columnId: string, title: string) {
  addItem(columnId, title)
}

async function handleDeleteItem(itemId: string) {
  if (confirmDeleteCard.value) {
    const item = items.value.find((i) => i.id === itemId)
    const confirmed = await confirm({
      title: 'Delete card?',
      message: `Are you sure you want to delete "${item?.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!confirmed) return
  }
  removeItem(itemId)
}

async function handleClickItem(item: KanbanItem) {
  interface CardFormData {
    title: string
    description: string
    dueDate: string | null
    priority: string | null
    tags: string[]
  }

  const result = await openModal<CardFormData>({
    title: 'Edit Card',
    size: 'md',
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Title',
        placeholder: 'Card title',
      },
      {
        type: 'textarea',
        key: 'description',
        label: 'Description',
        placeholder: 'Add a description...',
        rows: 3,
      },
      ...(showTags.value ? [{
        type: 'tags' as const,
        key: 'tags',
        label: 'Tags',
        placeholder: 'Add tags...',
        suggestions: allTags.value,
      }] : []),
      ...(showDueDate.value ? [{
        type: 'date' as const,
        key: 'dueDate',
        label: 'Due Date',
        placeholder: 'Select date',
        showPresets: true,
      }] : []),
      ...(showPriority.value ? [{
        type: 'button-group' as const,
        key: 'priority',
        label: 'Priority',
        options: [
          { value: '', label: 'None' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
        fullWidth: true,
      }] : []),
    ],
    initialValues: {
      title: item.title,
      description: item.description || '',
      tags: item.tags || [],
      dueDate: item.dueDate || null,
      priority: item.priority || '',
    },
    submitLabel: 'Save',
  })

  if (result.confirmed && result.data) {
    updateItem(item.id, {
      title: result.data.title || item.title,
      description: result.data.description || '',
      tags: result.data.tags || [],
      dueDate: result.data.dueDate || undefined,
      priority: result.data.priority ? (result.data.priority as 'low' | 'medium' | 'high') : undefined,
    })
  }
}

async function handleAddColumn() {
  const result = await openModal<{ title: string; color: string; wipLimit: number | null }>({
    title: 'Add Column',
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Column name',
        placeholder: 'e.g., In Review',
      },
      {
        type: 'color',
        key: 'color',
        label: 'Color',
        colors: columnColors,
      },
      {
        type: 'number',
        key: 'wipLimit',
        label: 'WIP Limit',
        hint: 'Maximum number of cards (leave empty for no limit)',
        min: 1,
        max: 100,
        placeholder: 'No limit',
      },
    ],
    initialValues: {
      title: '',
      color: '#3b82f6',
      wipLimit: null,
    },
    submitLabel: 'Add Column',
  })

  if (result.confirmed && result.data?.title) {
    addColumn(
      result.data.title,
      result.data.color || '#3b82f6',
      result.data.wipLimit || null
    )
  }
}

async function handleEditColumn(column: KanbanColumnType) {
  const result = await openModal<{ title: string; color: string; wipLimit: number | null }>({
    title: 'Edit Column',
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Column name',
        placeholder: 'e.g., In Review',
      },
      {
        type: 'color',
        key: 'color',
        label: 'Color',
        colors: columnColors,
      },
      {
        type: 'number',
        key: 'wipLimit',
        label: 'WIP Limit',
        hint: 'Maximum number of cards (leave empty for no limit)',
        min: 1,
        max: 100,
        placeholder: 'No limit',
      },
    ],
    initialValues: {
      title: column.title,
      color: column.color,
      wipLimit: column.wipLimit,
    },
    submitLabel: 'Save',
  })

  if (result.confirmed && result.data) {
    updateColumn(column.id, {
      title: result.data.title || column.title,
      color: result.data.color || column.color,
      wipLimit: result.data.wipLimit || null,
    })
  }
}

async function handleDeleteColumn(columnId: string) {
  const column = columns.value.find((c) => c.id === columnId)
  const itemCount = getColumnItemCount(columnId)

  if (confirmDeleteColumn.value || itemCount > 0) {
    const message = itemCount > 0
      ? `This column contains ${itemCount} card${itemCount > 1 ? 's' : ''}. Delete column and all its cards?`
      : `Are you sure you want to delete "${column?.title}"?`

    const confirmed = await confirm({
      title: 'Delete column?',
      message,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!confirmed) return
  }

  removeColumn(columnId, true) // Delete with items
}

function handleSearchUpdate(query: string) {
  setSearchQuery(query)
}

// Data sharing - Board contract
useProvideData(props.context, kanbanContractV1, {
  project: (state): PublicKanbanBoard => {
    const cols = state.columns || []
    const itms = state.items || []

    return {
      widgetId: props.context.widgetId,
      title: state.title || 'Kanban',
      totalItems: itms.length,
      columns: cols.map((col) => {
        const count = itms.filter((i) => i.columnId === col.id).length
        return {
          id: col.id,
          title: col.title,
          itemCount: count,
          wipLimit: col.wipLimit,
          isOverLimit: col.wipLimit !== null && count > col.wipLimit,
        }
      }),
      items: itms.map(({ id, title, columnId }) => ({ id, title, columnId })),
    }
  },
})

// Data sharing - Stats contract
useProvideData(props.context, kanbanStatsContractV1, {
  project: (state): PublicKanbanStats => {
    const cols = [...(state.columns || [])].sort((a, b) => a.order - b.order)
    const itms = state.items || []
    const total = itms.length
    const lastCol = cols[cols.length - 1]
    const completed = lastCol ? itms.filter((i) => i.columnId === lastCol.id).length : 0

    return {
      widgetId: props.context.widgetId,
      totalItems: total,
      completedItems: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      columnStats: cols.map((col) => {
        const count = itms.filter((i) => i.columnId === col.id).length
        return {
          columnId: col.id,
          title: col.title,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      }),
    }
  },
})
</script>

<template>
  <div class="kanban h-full flex flex-col overflow-hidden">
    <!-- Header with search -->
    <KanbanHeader
      :total="completionStats.total"
      :completed="completionStats.completed"
      :show-completion-rate="showCompletionRate"
      :search-query="searchQuery"
      :has-active-filters="hasActiveFilters"
      @update:search-query="handleSearchUpdate"
      @add-column="handleAddColumn"
      @clear-filters="clearFilters"
    />

    <!-- Columns -->
    <div class="flex-1 flex gap-3 p-3 overflow-x-auto">
      <KanbanColumn
        v-for="column in columns"
        :key="column.id"
        :column="column"
        :items="hasActiveFilters ? getFilteredColumnItems(column.id) : getColumnItems(column.id)"
        :show-item-count="showItemCount"
        :show-wip-limits="showWipLimits"
        :show-due-date="showDueDate"
        :show-priority="showPriority"
        :show-tags="showTags"
        :show-checklist="showChecklist"
        :compact-mode="compactMode"
        :dragged-item-id="draggedItemId"
        :is-drag-over="dragOverColumnId === column.id"
        :drag-over-item-id="dragOverItemId"
        :drop-position="dropPosition"
        @add-item="handleAddItem"
        @delete-item="handleDeleteItem"
        @click-item="handleClickItem"
        @edit-column="handleEditColumn"
        @delete-column="handleDeleteColumn"
        @dragstart="handleDragStart"
        @dragover="handleDragOverColumn"
        @dragover-item="handleDragOverItem"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @dragend="handleDragEnd"
      />

      <!-- Add column button -->
      <button
        class="flex-shrink-0 w-56 h-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors"
        @click="handleAddColumn"
      >
        <BkIcon icon="plus" :size="14" />
        Add column
      </button>
    </div>
  </div>
</template>
