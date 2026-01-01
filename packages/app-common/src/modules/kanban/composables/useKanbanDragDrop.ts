import { ref, type MaybeRefOrGetter, toValue } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { KanbanState } from '../types'
import { useKanbanItems } from './useKanbanItems'

export interface DragState {
  draggedItemId: string | null
  dragOverColumnId: string | null
  dragOverItemId: string | null
  dropPosition: 'before' | 'after' | null
}

/**
 * Composable for Kanban drag and drop operations
 * @param contextGetter - Getter function or ref to get the current context (ensures reactivity)
 */
export function useKanbanDragDrop(contextGetter: MaybeRefOrGetter<ModuleContext<KanbanState>>) {
  const { getColumnItems, moveItemToColumn, items } = useKanbanItems(contextGetter)

  // Drag state
  const draggedItemId = ref<string | null>(null)
  const dragOverColumnId = ref<string | null>(null)
  const dragOverItemId = ref<string | null>(null)
  const dropPosition = ref<'before' | 'after' | null>(null)

  /**
   * Handle drag start
   */
  function handleDragStart(e: DragEvent, itemId: string) {
    draggedItemId.value = itemId
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', itemId)
    }
  }

  /**
   * Handle drag over column
   */
  function handleDragOverColumn(e: DragEvent, columnId: string) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    dragOverColumnId.value = columnId
  }

  /**
   * Handle drag over item (for precise positioning)
   */
  function handleDragOverItem(e: DragEvent, itemId: string, columnId: string) {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }

    dragOverColumnId.value = columnId
    dragOverItemId.value = itemId

    // Determine if dropping before or after based on mouse position
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    dropPosition.value = e.clientY < midpoint ? 'before' : 'after'
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(e: DragEvent) {
    // Only clear if leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget?.closest('[data-kanban-column]')) {
      dragOverColumnId.value = null
      dragOverItemId.value = null
      dropPosition.value = null
    }
  }

  /**
   * Handle drop
   */
  function handleDrop(e: DragEvent, targetColumnId: string) {
    e.preventDefault()

    if (!draggedItemId.value) {
      resetDragState()
      return
    }

    const draggedItem = items.value.find((i) => i.id === draggedItemId.value)
    if (!draggedItem) {
      resetDragState()
      return
    }

    const sourceColumnId = draggedItem.columnId
    const isSameColumn = sourceColumnId === targetColumnId

    // Calculate target order
    let targetOrder: number

    if (dragOverItemId.value && dragOverItemId.value !== draggedItemId.value) {
      // Dropping relative to another item
      const columnItems = getColumnItems(targetColumnId)
      const targetIndex = columnItems.findIndex((i) => i.id === dragOverItemId.value)

      if (targetIndex !== -1) {
        if (dropPosition.value === 'before') {
          targetOrder = targetIndex > 0 ? columnItems[targetIndex - 1].order + 0.5 : -0.5
        } else {
          targetOrder = columnItems[targetIndex].order + 0.5
        }
      } else {
        // Fallback: append to end
        targetOrder = columnItems.length > 0
          ? Math.max(...columnItems.map((i) => i.order)) + 1
          : 0
      }
    } else {
      // Dropping on column (not on specific item) - append to end
      const columnItems = getColumnItems(targetColumnId)
      targetOrder = columnItems.length > 0
        ? Math.max(...columnItems.map((i) => i.order)) + 1
        : 0
    }

    // Create the updated items array in a single operation
    let newItems = items.value.map((item) => {
      if (item.id === draggedItemId.value) {
        // Update the dragged item with new column and order
        return {
          ...item,
          columnId: targetColumnId,
          order: targetOrder,
        }
      }
      return item
    })

    // Normalize orders for target column
    const targetColumnItems = newItems
      .filter((i) => i.columnId === targetColumnId)
      .sort((a, b) => a.order - b.order)

    newItems = newItems.map((item) => {
      if (item.columnId !== targetColumnId) return item
      const index = targetColumnItems.findIndex((i) => i.id === item.id)
      return { ...item, order: index }
    })

    // If moving between columns, also normalize the source column
    if (!isSameColumn) {
      const sourceColumnItems = newItems
        .filter((i) => i.columnId === sourceColumnId)
        .sort((a, b) => a.order - b.order)

      newItems = newItems.map((item) => {
        if (item.columnId !== sourceColumnId) return item
        const index = sourceColumnItems.findIndex((i) => i.id === item.id)
        return { ...item, order: index }
      })
    }

    // Single state update with all changes
    toValue(contextGetter).updateState(
      { items: newItems },
      {
        captureHistory: true,
        historyLabel: isSameColumn
          ? `Reordered card`
          : `Moved card to ${getColumnItems(targetColumnId).length > 0 ? 'column' : 'empty column'}`,
      }
    )

    resetDragState()
  }

  /**
   * Get column name helper for history labels
   */
  function getColumnName(columnId: string): string {
    const ctx = toValue(contextGetter)
    const column = ctx.state.columns?.find((c) => c.id === columnId)
    return column?.title ?? 'column'
  }

  /**
   * Handle drag end
   */
  function handleDragEnd() {
    resetDragState()
  }

  /**
   * Reset drag state
   */
  function resetDragState() {
    draggedItemId.value = null
    dragOverColumnId.value = null
    dragOverItemId.value = null
    dropPosition.value = null
  }

  return {
    // State
    draggedItemId,
    dragOverColumnId,
    dragOverItemId,
    dropPosition,
    // Handlers
    handleDragStart,
    handleDragOverColumn,
    handleDragOverItem,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    resetDragState,
  }
}
