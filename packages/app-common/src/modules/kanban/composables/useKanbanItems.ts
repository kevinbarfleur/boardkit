import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { truncate } from '@boardkit/core'
import type { KanbanState, KanbanItem, ChecklistItem } from '../types'

/**
 * Composable for Kanban item (card) operations
 * @param contextGetter - Getter function or ref to get the current context (ensures reactivity)
 */
export function useKanbanItems(contextGetter: MaybeRefOrGetter<ModuleContext<KanbanState>>) {
  const items = computed(() => toValue(contextGetter).state.items || [])
  const columns = computed(() => toValue(contextGetter).state.columns || [])
  const showArchived = computed(() => toValue(contextGetter).state.showArchived ?? false)

  /**
   * Get active (non-archived) items
   */
  const activeItems = computed(() => items.value.filter((i) => !i.archived))

  /**
   * Get archived items
   */
  const archivedItems = computed(() => items.value.filter((i) => i.archived))

  /**
   * Count of archived items
   */
  const archivedCount = computed(() => archivedItems.value.length)

  /**
   * Get all unique tags from all items
   */
  const allTags = computed(() => {
    const tagSet = new Set<string>()
    items.value.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })

  /**
   * Get items for a specific column, sorted by order
   * Filters out archived items unless showArchived state is true
   */
  function getColumnItems(columnId: string): KanbanItem[] {
    const includeArch = showArchived.value
    return items.value
      .filter((item) => item.columnId === columnId && (includeArch || !item.archived))
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Get column name by ID
   */
  function getColumnName(columnId: string): string {
    const column = columns.value.find((c) => c.id === columnId)
    return column?.title ?? 'column'
  }

  /**
   * Add a new item to a column
   */
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

    toValue(contextGetter).updateState(
      { items: [...items.value, newItem] },
      {
        captureHistory: true,
        historyLabel: `Added card: ${truncate(title, 20)} to ${getColumnName(columnId)}`,
      }
    )

    return newItem.id
  }

  /**
   * Update an existing item
   */
  function updateItem(itemId: string, updates: Partial<Omit<KanbanItem, 'id' | 'createdAt'>>) {
    const itemIndex = items.value.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return

    const item = items.value[itemIndex]
    const newItems = [...items.value]
    newItems[itemIndex] = { ...item, ...updates }

    toValue(contextGetter).updateState(
      { items: newItems },
      {
        captureHistory: true,
        historyLabel: `Updated card: ${truncate(item.title, 25)}`,
      }
    )
  }

  /**
   * Remove an item
   */
  function removeItem(itemId: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return

    toValue(contextGetter).updateState(
      { items: items.value.filter((i) => i.id !== itemId) },
      {
        captureHistory: true,
        historyLabel: `Deleted card: ${truncate(item.title, 25)}`,
      }
    )
  }

  /**
   * Move item to a different column
   */
  function moveItemToColumn(itemId: string, targetColumnId: string, targetOrder?: number) {
    const itemIndex = items.value.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return

    const item = items.value[itemIndex]
    if (item.columnId === targetColumnId && targetOrder === undefined) return

    // Calculate order
    let order: number
    if (targetOrder !== undefined) {
      order = targetOrder
    } else {
      const targetItems = getColumnItems(targetColumnId)
      const maxOrder = targetItems.length > 0
        ? Math.max(...targetItems.map((i) => i.order))
        : -1
      order = maxOrder + 1
    }

    const newItems = [...items.value]
    newItems[itemIndex] = {
      ...item,
      columnId: targetColumnId,
      order,
    }

    toValue(contextGetter).updateState(
      { items: newItems },
      {
        captureHistory: true,
        historyLabel: `Moved: ${truncate(item.title, 20)} → ${getColumnName(targetColumnId)}`,
      }
    )
  }

  /**
   * Reorder item within the same column
   */
  function reorderItem(itemId: string, newOrder: number) {
    const itemIndex = items.value.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return

    const item = items.value[itemIndex]

    // Recalculate orders for all items in the column
    const newItems = items.value.map((i) => {
      if (i.columnId !== item.columnId) return i
      if (i.id === itemId) return { ...i, order: newOrder }

      // Shift other items
      if (i.order >= newOrder && i.order < item.order) {
        return { ...i, order: i.order + 1 }
      }
      if (i.order <= newOrder && i.order > item.order) {
        return { ...i, order: i.order - 1 }
      }
      return i
    })

    toValue(contextGetter).updateState(
      { items: newItems },
      {
        captureHistory: true,
        historyLabel: `Reordered: ${truncate(item.title, 25)}`,
      }
    )
  }

  // === Checklist operations ===

  /**
   * Add checklist item to a card
   */
  function addChecklistItem(itemId: string, label: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return

    const newChecklistItem: ChecklistItem = {
      id: crypto.randomUUID(),
      label: label.trim(),
      completed: false,
    }

    updateItem(itemId, {
      checklist: [...item.checklist, newChecklistItem],
    })
  }

  /**
   * Toggle checklist item completion
   */
  function toggleChecklistItem(itemId: string, checklistItemId: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return

    const newChecklist = item.checklist.map((ci) =>
      ci.id === checklistItemId ? { ...ci, completed: !ci.completed } : ci
    )

    updateItem(itemId, { checklist: newChecklist })
  }

  /**
   * Remove checklist item
   */
  function removeChecklistItem(itemId: string, checklistItemId: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return

    updateItem(itemId, {
      checklist: item.checklist.filter((ci) => ci.id !== checklistItemId),
    })
  }

  /**
   * Get checklist progress for an item
   */
  function getChecklistProgress(item: KanbanItem): { done: number; total: number } {
    const total = item.checklist.length
    const done = item.checklist.filter((ci) => ci.completed).length
    return { done, total }
  }

  // === Archive operations ===

  /**
   * Archive an item
   */
  function archiveItem(itemId: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item || item.archived) return

    updateItem(itemId, {
      archived: true,
      archivedAt: new Date().toISOString(),
    })
  }

  /**
   * Unarchive an item
   */
  function unarchiveItem(itemId: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item || !item.archived) return

    const itemIndex = items.value.findIndex((i) => i.id === itemId)
    const newItems = [...items.value]
    const { archived, archivedAt, ...rest } = item
    newItems[itemIndex] = rest as KanbanItem

    toValue(contextGetter).updateState(
      { items: newItems },
      {
        captureHistory: true,
        historyLabel: `Restored card: ${truncate(item.title, 25)}`,
      }
    )
  }

  /**
   * Toggle show archived state
   */
  function toggleShowArchived() {
    toValue(contextGetter).updateState(
      { showArchived: !showArchived.value },
      { captureHistory: false }
    )
  }

  return {
    items,
    columns,
    allTags,
    activeItems,
    archivedItems,
    archivedCount,
    showArchived,
    getColumnItems,
    getColumnName,
    addItem,
    updateItem,
    removeItem,
    moveItemToColumn,
    reorderItem,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    getChecklistProgress,
    archiveItem,
    unarchiveItem,
    toggleShowArchived,
  }
}
