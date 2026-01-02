<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ModuleContext, ModuleContextMenuEvent, ModuleMenuGroup } from '@boardkit/core'
import { useProvideData, kanbanContractV1, kanbanStatsContractV1, truncate } from '@boardkit/core'
import { BkIcon, useModal } from '@boardkit/ui'
import type { KanbanState, KanbanItem, KanbanColumn as KanbanColumnType, KanbanPriority, KanbanSortField, KanbanSortDirection } from './types'
import type { PublicKanbanBoard, PublicKanbanStats } from '@boardkit/core'
import { KanbanColumn, KanbanHeader } from './components'
import { useKanbanFilters } from './composables/useKanbanFilters'

interface Props {
  context: ModuleContext<KanbanState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  moduleContextMenu: [event: ModuleContextMenuEvent]
}>()

// Modal
const { openModal, confirm } = useModal()

// Direct reactive access to state - this ensures Vue tracks dependencies correctly
const items = computed(() => props.context.state.items || [])
const columns = computed(() =>
  [...(props.context.state.columns || [])].sort((a, b) => a.order - b.order)
)
const showArchived = computed(() => props.context.state.showArchived ?? false)

// Derived computed values
const activeItems = computed(() => items.value.filter((i) => !i.archived))
const archivedItems = computed(() => items.value.filter((i) => i.archived))
const archivedCount = computed(() => archivedItems.value.length)

const allTags = computed(() => {
  const tagSet = new Set<string>()
  items.value.forEach((item) => {
    item.tags?.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
})

// Completion stats
const lastColumn = computed(() => columns.value[columns.value.length - 1])
const completionStats = computed(() => {
  const total = items.value.filter(i => !i.archived).length
  const completed = lastColumn.value
    ? items.value.filter((i) => i.columnId === lastColumn.value.id && !i.archived).length
    : 0
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, rate }
})

// Helper functions that use the reactive state
function getColumnItems(columnId: string): KanbanItem[] {
  const includeArch = showArchived.value
  return items.value
    .filter((item) => item.columnId === columnId && (includeArch || !item.archived))
    .sort((a, b) => a.order - b.order)
}

function getColumnItemCount(columnId: string): number {
  return items.value.filter((item) => item.columnId === columnId && !item.archived).length
}

function getColumnName(columnId: string): string {
  const column = columns.value.find((c) => c.id === columnId)
  return column?.title ?? 'column'
}

// State mutation functions
function addItem(columnId: string, title: string, description = '') {
  if (!title.trim()) return

  const columnItems = getColumnItems(columnId)
  const maxOrder = columnItems.length > 0
    ? Math.max(...columnItems.map((i) => i.order))
    : -1

  const newItem: KanbanItem = {
    id: crypto.randomUUID(),
    title: title.trim(),
    description,
    columnId,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    tags: [],
    checklist: [],
  }

  props.context.updateState(
    { items: [...items.value, newItem] },
    { captureHistory: true, historyLabel: `Added card: ${truncate(title, 20)} to ${getColumnName(columnId)}` }
  )

  // Auto-sort if column has non-manual sort
  const column = columns.value.find((c) => c.id === columnId)
  if (column?.sortBy && column.sortBy !== 'manual') {
    applySortToColumn(columnId, column.sortBy, column.sortDirection || 'asc')
  }

  return newItem.id
}

function updateItem(itemId: string, updates: Partial<Omit<KanbanItem, 'id' | 'createdAt'>>) {
  const itemIndex = items.value.findIndex((i) => i.id === itemId)
  if (itemIndex === -1) return

  const item = items.value[itemIndex]
  const newItems = [...items.value]
  newItems[itemIndex] = { ...item, ...updates }

  props.context.updateState(
    { items: newItems },
    { captureHistory: true, historyLabel: `Updated card: ${truncate(item.title, 25)}` }
  )
}

function removeItem(itemId: string) {
  const item = items.value.find((i) => i.id === itemId)
  if (!item) return

  props.context.updateState(
    { items: items.value.filter((i) => i.id !== itemId) },
    { captureHistory: true, historyLabel: `Deleted card: ${truncate(item.title, 25)}` }
  )
}

function archiveItem(itemId: string) {
  const item = items.value.find((i) => i.id === itemId)
  if (!item || item.archived) return

  updateItem(itemId, {
    archived: true,
    archivedAt: new Date().toISOString(),
  })
}

function unarchiveItem(itemId: string) {
  const item = items.value.find((i) => i.id === itemId)
  if (!item || !item.archived) return

  const itemIndex = items.value.findIndex((i) => i.id === itemId)
  const newItems = [...items.value]
  const { archived, archivedAt, ...rest } = item
  newItems[itemIndex] = rest as KanbanItem

  props.context.updateState(
    { items: newItems },
    { captureHistory: true, historyLabel: `Restored card: ${truncate(item.title, 25)}` }
  )
}

function toggleShowArchived() {
  props.context.updateState(
    { showArchived: !showArchived.value },
    { captureHistory: false }
  )
}

function addColumn(title: string, color: string, wipLimit: number | null = null) {
  if (!title.trim()) return

  const maxOrder = columns.value.length > 0
    ? Math.max(...columns.value.map((c) => c.order))
    : -1

  const newColumn: KanbanColumnType = {
    id: crypto.randomUUID(),
    title: title.trim(),
    color,
    wipLimit,
    order: maxOrder + 1,
  }

  props.context.updateState(
    { columns: [...columns.value, newColumn] },
    { captureHistory: true, historyLabel: `Added column: ${truncate(title, 20)}` }
  )

  return newColumn.id
}

function updateColumn(columnId: string, updates: Partial<Omit<KanbanColumnType, 'id'>>) {
  const columnIndex = columns.value.findIndex((c) => c.id === columnId)
  if (columnIndex === -1) return

  const column = columns.value[columnIndex]
  const newColumns = [...columns.value]
  newColumns[columnIndex] = { ...column, ...updates }

  props.context.updateState(
    { columns: newColumns },
    { captureHistory: true, historyLabel: `Updated column: ${truncate(column.title, 20)}` }
  )
}

function removeColumn(columnId: string, deleteItems = false) {
  const column = columns.value.find((c) => c.id === columnId)
  if (!column) return

  const newColumns = columns.value.filter((c) => c.id !== columnId)
  const newItems = deleteItems
    ? items.value.filter((i) => i.columnId !== columnId)
    : items.value

  props.context.updateState(
    { columns: newColumns, items: newItems },
    { captureHistory: true, historyLabel: `Deleted column: ${truncate(column.title, 20)}` }
  )
}

function updateColumnSort(columnId: string, sortBy: KanbanSortField, sortDirection: KanbanSortDirection = 'asc') {
  updateColumn(columnId, { sortBy, sortDirection })

  // If not manual, immediately apply the sort
  if (sortBy !== 'manual') {
    applySortToColumn(columnId, sortBy, sortDirection)
  }
}

function applySortToColumn(columnId: string, sortBy: KanbanSortField, direction: KanbanSortDirection) {
  if (sortBy === 'manual') return

  const columnItems = items.value.filter((i) => i.columnId === columnId && !i.archived)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

  const sorted = [...columnItems].sort((a, b) => {
    let result = 0
    switch (sortBy) {
      case 'title':
        result = a.title.localeCompare(b.title)
        break
      case 'priority': {
        const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3
        const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3
        result = aOrder - bOrder
        break
      }
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) result = 0
        else if (!a.dueDate) result = 1
        else if (!b.dueDate) result = -1
        else result = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      }
      case 'createdAt':
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }
    return direction === 'desc' ? -result : result
  })

  // Update orders atomically
  const newItems = items.value.map((item) => {
    if (item.columnId !== columnId) return item
    const sortedIndex = sorted.findIndex((s) => s.id === item.id)
    if (sortedIndex === -1) return item // Archived items keep their order
    return { ...item, order: sortedIndex }
  })

  props.context.updateState(
    { items: newItems },
    { captureHistory: true, historyLabel: `Sorted column by ${sortBy}` }
  )
}

// Drag & drop state
const draggedItemId = ref<string | null>(null)
const dragOverColumnId = ref<string | null>(null)
const dragOverItemId = ref<string | null>(null)
const dropPosition = ref<'before' | 'after' | null>(null)

function handleDragStart(e: DragEvent, itemId: string) {
  draggedItemId.value = itemId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }
}

function handleDragOverColumn(e: DragEvent, columnId: string) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverColumnId.value = columnId
}

function handleDragOverItem(e: DragEvent, itemId: string, columnId: string) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }

  dragOverColumnId.value = columnId
  dragOverItemId.value = itemId

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  dropPosition.value = e.clientY < midY ? 'before' : 'after'
}

function handleDragLeave() {
  // Only clear if we're leaving the column entirely
}

function handleDrop(e: DragEvent, targetColumnId: string) {
  e.preventDefault()

  const itemId = draggedItemId.value
  if (!itemId) return

  const draggedItem = items.value.find(i => i.id === itemId)
  if (!draggedItem) return

  const targetItemId = dragOverItemId.value
  const position = dropPosition.value

  // Calculate new order
  let newOrder: number
  if (targetItemId && position) {
    const targetItem = items.value.find(i => i.id === targetItemId)
    if (targetItem) {
      const columnItems = getColumnItems(targetColumnId)
      const targetIndex = columnItems.findIndex(i => i.id === targetItemId)

      if (position === 'before') {
        newOrder = targetIndex > 0 ? (columnItems[targetIndex - 1].order + targetItem.order) / 2 : targetItem.order - 1
      } else {
        newOrder = targetIndex < columnItems.length - 1
          ? (targetItem.order + columnItems[targetIndex + 1].order) / 2
          : targetItem.order + 1
      }
    } else {
      const columnItems = getColumnItems(targetColumnId)
      newOrder = columnItems.length > 0 ? Math.max(...columnItems.map(i => i.order)) + 1 : 0
    }
  } else {
    const columnItems = getColumnItems(targetColumnId)
    newOrder = columnItems.length > 0 ? Math.max(...columnItems.map(i => i.order)) + 1 : 0
  }

  // Update item
  const newItems = items.value.map(item => {
    if (item.id === itemId) {
      return { ...item, columnId: targetColumnId, order: newOrder }
    }
    return item
  })

  props.context.updateState(
    { items: newItems },
    { captureHistory: true, historyLabel: `Moved card: ${truncate(draggedItem.title, 20)}` }
  )

  // Auto-sort if target column has non-manual sort
  const targetColumn = columns.value.find((c) => c.id === targetColumnId)
  if (targetColumn?.sortBy && targetColumn.sortBy !== 'manual') {
    applySortToColumn(targetColumnId, targetColumn.sortBy, targetColumn.sortDirection || 'asc')
  }

  handleDragEnd()
}

function handleDragEnd() {
  draggedItemId.value = null
  dragOverColumnId.value = null
  dragOverItemId.value = null
  dropPosition.value = null
}

// Filtering
const {
  searchQuery,
  filterPriority,
  filterTags,
  hasActiveFilters,
  getFilteredColumnItems,
  setSearchQuery,
  setFilterPriority,
  setFilterTags,
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
const quickCardCreation = computed(() => props.context.state.quickCardCreation ?? false)

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

// === Context Menu Handlers ===

function buildCardContextMenuGroups(item: KanbanItem): ModuleMenuGroup[] {
  const otherColumns = columns.value.filter(c => c.id !== item.columnId)
  const groups: ModuleMenuGroup[] = []

  // Basic actions group
  groups.push({
    items: [
      { id: `card:edit:${item.id}`, label: 'Edit card', icon: 'pencil' },
      { id: `card:duplicate:${item.id}`, label: 'Duplicate', icon: 'copy' },
      { id: `card:copy-title:${item.id}`, label: 'Copy title', icon: 'clipboard' },
    ],
  })

  // Move to column (if other columns exist)
  if (otherColumns.length > 0) {
    groups.push({
      label: 'Move to',
      items: otherColumns.map(c => ({ id: `card:move:${item.id}:${c.id}`, label: c.title })),
    })
  }

  // Priority submenu
  if (showPriority.value) {
    groups.push({
      label: 'Priority',
      items: [
        { id: `card:priority:${item.id}:`, label: 'None' },
        { id: `card:priority:${item.id}:low`, label: 'Low' },
        { id: `card:priority:${item.id}:medium`, label: 'Medium' },
        { id: `card:priority:${item.id}:high`, label: 'High' },
      ],
    })
  }

  // Tags
  if (showTags.value) {
    groups.push({
      items: [{ id: `card:manage-tags:${item.id}`, label: 'Manage tags', icon: 'tag' }],
    })
  }

  // Archive & Delete actions
  groups.push({
    items: [
      {
        id: `card:archive:${item.id}`,
        label: item.archived ? 'Unarchive' : 'Archive',
        icon: 'archive',
      },
      { id: `card:delete:${item.id}`, label: 'Delete card', icon: 'trash-2', destructive: true },
    ],
  })

  return groups
}

function buildColumnContextMenuGroups(column: KanbanColumnType): ModuleMenuGroup[] {
  return [
    {
      items: [
        { id: `col:edit:${column.id}`, label: 'Edit column', icon: 'pencil' },
        { id: `col:add-card:${column.id}`, label: 'Add card', icon: 'plus' },
      ],
    },
    {
      label: 'Sort cards by',
      items: [
        { id: `col:sort:${column.id}:title`, label: 'Title' },
        { id: `col:sort:${column.id}:priority`, label: 'Priority' },
        { id: `col:sort:${column.id}:dueDate`, label: 'Due date' },
        { id: `col:sort:${column.id}:createdAt`, label: 'Created date' },
      ],
    },
    {
      items: [
        { id: `col:clear-all:${column.id}`, label: 'Clear all cards', icon: 'eraser', destructive: true },
        { id: `col:delete:${column.id}`, label: 'Delete column', icon: 'trash-2', destructive: true },
      ],
    },
  ]
}

function handleCardContextMenu(item: KanbanItem, e: MouseEvent) {
  emit('moduleContextMenu', {
    x: e.clientX,
    y: e.clientY,
    groups: buildCardContextMenuGroups(item),
    onSelect: handleModuleMenuSelect,
  })
}

function handleColumnContextMenu(column: KanbanColumnType, e: MouseEvent) {
  emit('moduleContextMenu', {
    x: e.clientX,
    y: e.clientY,
    groups: buildColumnContextMenuGroups(column),
    onSelect: handleModuleMenuSelect,
  })
}

async function handleModuleMenuSelect(menuItemId: string) {
  // Parse: "type:action:id" or "type:action:id:value"
  const parts = menuItemId.split(':')
  const type = parts[0] // 'card' or 'col'
  const action = parts[1]
  const id = parts[2]
  const value = parts[3]

  if (type === 'card') {
    const item = items.value.find(i => i.id === id)
    if (!item) return

    switch (action) {
      case 'edit':
        handleClickItem(item)
        break
      case 'duplicate':
        duplicateItem(item)
        break
      case 'copy-title':
        await navigator.clipboard.writeText(item.title)
        break
      case 'move':
        updateItem(item.id, { columnId: value })
        break
      case 'priority':
        updateItem(item.id, { priority: (value as KanbanPriority) || undefined })
        break
      case 'manage-tags':
        handleClickItem(item) // Open edit modal
        break
      case 'archive':
        if (item.archived) {
          unarchiveItem(item.id)
        } else {
          archiveItem(item.id)
        }
        break
      case 'delete':
        handleDeleteItem(item.id)
        break
    }
  } else if (type === 'col') {
    const column = columns.value.find(c => c.id === id)
    if (!column) return

    switch (action) {
      case 'edit':
        handleEditColumn(column)
        break
      case 'add-card':
        handleAddItemFull(column.id)
        break
      case 'sort':
        applySortToColumn(column.id, value as KanbanSortField, 'asc')
        break
      case 'clear-all':
        await clearColumnCards(column.id)
        break
      case 'delete':
        handleDeleteColumn(column.id)
        break
    }
  }
}

// === Utility Functions ===

function duplicateItem(item: KanbanItem) {
  const columnItems = getColumnItems(item.columnId)
  const newOrder = Math.max(...columnItems.map(i => i.order), 0) + 1

  const newItem: KanbanItem = {
    ...item,
    id: nanoid(),
    title: `${item.title} (copy)`,
    order: newOrder,
    createdAt: new Date().toISOString(),
  }

  props.context.updateState(
    { items: [...items.value, newItem] },
    { captureHistory: true, historyLabel: `Duplicated card: ${truncate(item.title, 20)}` }
  )
}

async function clearColumnCards(columnId: string) {
  const columnItems = getColumnItems(columnId)
  if (columnItems.length === 0) return

  const column = columns.value.find(c => c.id === columnId)
  const confirmed = await confirm({
    title: 'Clear all cards?',
    message: `Are you sure you want to delete all ${columnItems.length} cards from "${column?.title}"? This action cannot be undone.`,
    confirmLabel: 'Clear All',
    destructive: true,
  })

  if (!confirmed) return

  columnItems.forEach(item => removeItem(item.id))
}

// Handler for column sort update
function handleUpdateSort(columnId: string, sortBy: KanbanSortField, sortDirection: KanbanSortDirection) {
  updateColumnSort(columnId, sortBy, sortDirection)
}

// Handler for full card creation (modal)
async function handleAddItemFull(columnId: string) {
  interface CardFormData {
    title: string
    description: string
    dueDate: string | null
    priority: string | null
    tags: string[]
  }

  const result = await openModal<CardFormData>({
    title: 'Add Card',
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
      title: '',
      description: '',
      tags: [],
      dueDate: null,
      priority: '',
    },
    submitLabel: 'Add Card',
  })

  if (result.confirmed && result.data?.title) {
    const columnItems = getColumnItems(columnId)
    const newOrder = Math.max(...columnItems.map(i => i.order), -1) + 1

    const newItem: KanbanItem = {
      id: nanoid(),
      title: result.data.title,
      description: result.data.description || '',
      columnId,
      order: newOrder,
      createdAt: new Date().toISOString(),
      tags: result.data.tags || [],
      checklist: [],
      dueDate: result.data.dueDate || undefined,
      priority: result.data.priority ? (result.data.priority as KanbanPriority) : undefined,
    }

    props.context.updateState(
      { items: [...items.value, newItem] },
      { captureHistory: true, historyLabel: `Added card: ${truncate(result.data.title, 20)} to ${getColumnName(columnId)}` }
    )

    // Auto-sort if column has non-manual sort
    const column = columns.value.find((c) => c.id === columnId)
    if (column?.sortBy && column.sortBy !== 'manual') {
      applySortToColumn(columnId, column.sortBy, column.sortDirection || 'asc')
    }
  }
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
    <!-- Header with search and filters -->
    <KanbanHeader
      :total="completionStats.total"
      :completed="completionStats.completed"
      :show-completion-rate="showCompletionRate"
      :search-query="searchQuery"
      :has-active-filters="hasActiveFilters"
      :filter-priority="filterPriority"
      :filter-tags="filterTags"
      :all-tags="allTags"
      @update:search-query="handleSearchUpdate"
      @update:filter-priority="setFilterPriority"
      @update:filter-tags="setFilterTags"
      @add-column="handleAddColumn"
      @clear-filters="clearFilters"
    />

    <!-- Archive toggle -->
    <div v-if="archivedCount > 0" class="px-3 pb-1">
      <button
        class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        @click="toggleShowArchived"
      >
        <BkIcon :icon="showArchived ? 'eye-off' : 'archive'" :size="14" />
        {{ showArchived ? 'Hide' : 'Show' }} archived ({{ archivedCount }})
      </button>
    </div>

    <!-- Columns -->
    <div class="flex-1 flex gap-3 p-3 overflow-x-auto">
      <template v-for="column in columns" :key="column.id">
        <KanbanColumn
          v-if="!hasActiveFilters || getFilteredColumnItems(column.id).length > 0"
          :column="column"
          :items="hasActiveFilters ? getFilteredColumnItems(column.id) : getColumnItems(column.id)"
          :show-item-count="showItemCount"
          :show-wip-limits="showWipLimits"
          :show-due-date="showDueDate"
          :show-priority="showPriority"
          :show-tags="showTags"
          :show-checklist="showChecklist"
          :compact-mode="compactMode"
          :quick-card-creation="quickCardCreation"
          :dragged-item-id="draggedItemId"
          :is-drag-over="dragOverColumnId === column.id"
          :drag-over-item-id="dragOverItemId"
          :drop-position="dropPosition"
          @add-item="handleAddItem"
          @add-item-full="handleAddItemFull"
          @delete-item="handleDeleteItem"
          @click-item="handleClickItem"
          @contextmenu-item="handleCardContextMenu"
          @edit-column="handleEditColumn"
          @delete-column="handleDeleteColumn"
          @contextmenu-column="handleColumnContextMenu"
          @update-sort="handleUpdateSort"
          @dragstart="handleDragStart"
          @dragover="handleDragOverColumn"
          @dragover-item="handleDragOverItem"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @dragend="handleDragEnd"
        />
      </template>

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
