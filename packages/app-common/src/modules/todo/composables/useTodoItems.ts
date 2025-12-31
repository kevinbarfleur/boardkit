import type { TodoItem, TodoPriority } from '../types'

/**
 * Get children of a specific item
 */
export function getChildren(items: TodoItem[], parentId: string): TodoItem[] {
  return items.filter((item) => item.parentId === parentId)
}

/**
 * Check if item has children
 */
export function hasChildren(items: TodoItem[], id: string): boolean {
  return items.some((item) => item.parentId === id)
}

/**
 * Get all descendant IDs of an item (for cascade operations)
 */
export function getDescendantIds(items: TodoItem[], id: string): string[] {
  const directChildren = items.filter((item) => item.parentId === id)
  const childIds = directChildren.map((c) => c.id)
  const grandchildIds = directChildren.flatMap((c) => getDescendantIds(items, c.id))
  return [...childIds, ...grandchildIds]
}

/**
 * Get root items (items without parentId)
 */
export function getRootItems(items: TodoItem[]): TodoItem[] {
  return items.filter((item) => !item.parentId)
}

/**
 * Filter items based on completion status
 */
export function filterItems(items: TodoItem[], hideCompleted: boolean): TodoItem[] {
  if (!hideCompleted) return items
  return items.filter((item) => !item.completed)
}

/**
 * Sort items by completion status and priority
 * Completed items go to bottom, then sorted by priority (high > medium > low > undefined)
 */
export function sortItems(items: TodoItem[], autoSort: boolean): TodoItem[] {
  if (!autoSort) return items

  return [...items].sort((a, b) => {
    // Completed items go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    // Sort by priority (high > medium > low > undefined)
    const priorityOrder: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 }
    const aPriority = a.priority ? priorityOrder[a.priority] : 3
    const bPriority = b.priority ? priorityOrder[b.priority] : 3
    return aPriority - bPriority
  })
}

/**
 * Process items with filtering and sorting applied
 */
export function processItems(
  items: TodoItem[],
  hideCompleted: boolean,
  autoSort: boolean
): TodoItem[] {
  let result = filterItems(items, hideCompleted)
  result = sortItems(result, autoSort)
  return result
}

/**
 * Calculate progress statistics
 */
export interface ProgressStats {
  completed: number
  total: number
  percent: number
}

export function getProgressStats(items: TodoItem[]): ProgressStats {
  const total = items.length
  const completed = items.filter((i) => i.completed).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percent }
}

/**
 * Create a new todo item
 */
export function createTodoItem(
  label: string,
  parentId?: string
): TodoItem {
  return {
    id: '', // ID will be assigned by caller using nanoid
    label,
    completed: false,
    parentId,
  }
}

/**
 * Toggle completion of an item, optionally cascading to children
 */
export function toggleItemCompletion(
  items: TodoItem[],
  id: string,
  completed: boolean,
  cascadeCompletion: boolean
): TodoItem[] {
  let updated = items.map((i) => (i.id === id ? { ...i, completed } : i))

  // Cascade completion to children if enabled
  if (completed && cascadeCompletion) {
    const descendantIds = new Set(getDescendantIds(items, id))
    updated = updated.map((i) => (descendantIds.has(i.id) ? { ...i, completed: true } : i))
  }

  return updated
}

/**
 * Update item priority
 */
export function updateItemPriority(
  items: TodoItem[],
  id: string,
  priority: TodoPriority | undefined
): TodoItem[] {
  return items.map((i) => (i.id === id ? { ...i, priority } : i))
}

/**
 * Update item due date
 */
export function updateItemDueDate(
  items: TodoItem[],
  id: string,
  dueDate: string | undefined
): TodoItem[] {
  return items.map((i) => (i.id === id ? { ...i, dueDate } : i))
}

/**
 * Remove an item and all its descendants
 */
export function removeItem(items: TodoItem[], id: string): TodoItem[] {
  const descendantIds = new Set([id, ...getDescendantIds(items, id)])
  return items.filter((i) => !descendantIds.has(i.id))
}

/**
 * Find item by id
 */
export function findItem(items: TodoItem[], id: string): TodoItem | undefined {
  return items.find((i) => i.id === id)
}
