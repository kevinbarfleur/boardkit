/**
 * Kanban Module Types
 *
 * Kanban board with drag & drop.
 */

export interface KanbanItem {
  id: string
  title: string
  description: string
  columnId: string
  order: number
  createdAt: string
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  wipLimit: number | null
  order: number
}

export interface KanbanState {
  // Core state
  title: string
  columns: KanbanColumn[]
  items: KanbanItem[]

  // Settings
  showWipLimits: boolean
  showItemCount: boolean
  showCompletionRate: boolean
  compactMode: boolean
}

export const defaultKanbanSettings: Omit<KanbanState, 'title' | 'columns' | 'items'> = {
  showWipLimits: true,
  showItemCount: true,
  showCompletionRate: true,
  compactMode: false,
}

export const defaultKanbanColumns: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: '#3b82f6', wipLimit: null, order: 0 },
  { id: 'doing', title: 'In Progress', color: '#f59e0b', wipLimit: 3, order: 1 },
  { id: 'done', title: 'Done', color: '#22c55e', wipLimit: null, order: 2 },
]
