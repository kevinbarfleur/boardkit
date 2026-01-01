import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { truncate } from '@boardkit/core'
import type { KanbanState, KanbanColumn } from '../types'

/**
 * Composable for Kanban column operations
 * @param contextGetter - Getter function or ref to get the current context (ensures reactivity)
 */
export function useKanbanColumns(contextGetter: MaybeRefOrGetter<ModuleContext<KanbanState>>) {
  const columns = computed(() =>
    [...(toValue(contextGetter).state.columns || [])].sort((a, b) => a.order - b.order)
  )
  const items = computed(() => toValue(contextGetter).state.items || [])

  /**
   * Get item count for a column
   */
  function getColumnItemCount(columnId: string): number {
    return items.value.filter((item) => item.columnId === columnId).length
  }

  /**
   * Check if column is over WIP limit
   */
  function isOverWipLimit(column: KanbanColumn): boolean {
    if (column.wipLimit === null) return false
    return getColumnItemCount(column.id) > column.wipLimit
  }

  /**
   * Get the last column (typically "Done")
   */
  const lastColumn = computed(() => columns.value[columns.value.length - 1])

  /**
   * Calculate completion stats
   */
  const completionStats = computed(() => {
    const total = items.value.length
    const completed = lastColumn.value ? getColumnItemCount(lastColumn.value.id) : 0
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, rate }
  })

  /**
   * Add a new column
   */
  function addColumn(title: string, color: string, wipLimit: number | null = null) {
    if (!title.trim()) return

    const maxOrder = columns.value.length > 0
      ? Math.max(...columns.value.map((c) => c.order))
      : -1

    const newColumn: KanbanColumn = {
      id: crypto.randomUUID(),
      title: title.trim(),
      color,
      wipLimit,
      order: maxOrder + 1,
    }

    toValue(contextGetter).updateState(
      { columns: [...columns.value, newColumn] },
      {
        captureHistory: true,
        historyLabel: `Added column: ${truncate(title, 20)}`,
      }
    )

    return newColumn.id
  }

  /**
   * Update a column
   */
  function updateColumn(columnId: string, updates: Partial<Omit<KanbanColumn, 'id'>>) {
    const columnIndex = columns.value.findIndex((c) => c.id === columnId)
    if (columnIndex === -1) return

    const column = columns.value[columnIndex]
    const newColumns = [...columns.value]
    newColumns[columnIndex] = { ...column, ...updates }

    toValue(contextGetter).updateState(
      { columns: newColumns },
      {
        captureHistory: true,
        historyLabel: `Updated column: ${truncate(column.title, 20)}`,
      }
    )
  }

  /**
   * Remove a column (and optionally its items)
   */
  function removeColumn(columnId: string, deleteItems = false) {
    const column = columns.value.find((c) => c.id === columnId)
    if (!column) return

    const newColumns = columns.value.filter((c) => c.id !== columnId)
    const newItems = deleteItems
      ? items.value.filter((i) => i.columnId !== columnId)
      : items.value

    toValue(contextGetter).updateState(
      { columns: newColumns, items: newItems },
      {
        captureHistory: true,
        historyLabel: `Deleted column: ${truncate(column.title, 20)}`,
      }
    )
  }

  /**
   * Reorder columns
   */
  function reorderColumns(columnId: string, newOrder: number) {
    const columnIndex = columns.value.findIndex((c) => c.id === columnId)
    if (columnIndex === -1) return

    const column = columns.value[columnIndex]
    const oldOrder = column.order

    // Recalculate orders for all columns
    const newColumns = columns.value.map((c) => {
      if (c.id === columnId) return { ...c, order: newOrder }

      // Shift other columns
      if (c.order >= newOrder && c.order < oldOrder) {
        return { ...c, order: c.order + 1 }
      }
      if (c.order <= newOrder && c.order > oldOrder) {
        return { ...c, order: c.order - 1 }
      }
      return c
    })

    toValue(contextGetter).updateState(
      { columns: newColumns },
      {
        captureHistory: true,
        historyLabel: `Reordered column: ${truncate(column.title, 20)}`,
      }
    )
  }

  /**
   * Toggle column collapsed state
   */
  function toggleColumnCollapsed(columnId: string) {
    const column = columns.value.find((c) => c.id === columnId)
    if (!column) return

    updateColumn(columnId, { isCollapsed: !column.isCollapsed })
  }

  return {
    columns,
    items,
    lastColumn,
    completionStats,
    getColumnItemCount,
    isOverWipLimit,
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    toggleColumnCollapsed,
  }
}
