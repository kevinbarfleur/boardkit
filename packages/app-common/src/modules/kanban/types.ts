/**
 * Kanban Module Types
 *
 * Production-ready Kanban board with columns, cards, tags, and checklists.
 */

// === Priority ===

export type KanbanPriority = 'low' | 'medium' | 'high'

// === Checklist ===

export interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

// === Card (Item) ===

export interface KanbanItem {
  id: string
  title: string
  description: string
  columnId: string
  order: number
  createdAt: string
  // Optional fields
  dueDate?: string
  priority?: KanbanPriority
  tags: string[] // Direct tag values (auto-colored)
  checklist: ChecklistItem[]
}

// === Column ===

export interface KanbanColumn {
  id: string
  title: string
  color: string
  wipLimit: number | null
  order: number
  isCollapsed?: boolean
}

// === State ===

export interface KanbanState {
  // Core state
  title: string
  columns: KanbanColumn[]
  items: KanbanItem[]

  // Display settings
  showWipLimits: boolean
  showItemCount: boolean
  showCompletionRate: boolean
  compactMode: boolean

  // Feature settings
  showDueDate: boolean
  showPriority: boolean
  showTags: boolean
  showChecklist: boolean

  // Behavior settings
  confirmDeleteCard: boolean
  confirmDeleteColumn: boolean
}

// === Tag Color Palette ===

export const tagColorPalette = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

// Hash-based color assignment for consistent tag colors
export function getTagColor(tag: string): string {
  const hash = tag.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return tagColorPalette[hash % tagColorPalette.length]
}

// === Defaults ===

export const defaultKanbanSettings: Omit<KanbanState, 'title' | 'columns' | 'items'> = {
  // Display
  showWipLimits: true,
  showItemCount: true,
  showCompletionRate: true,
  compactMode: false,
  // Features
  showDueDate: true,
  showPriority: true,
  showTags: true,
  showChecklist: true,
  // Behavior
  confirmDeleteCard: true,
  confirmDeleteColumn: true,
}

export const defaultKanbanColumns: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: '#3b82f6', wipLimit: null, order: 0 },
  { id: 'doing', title: 'In Progress', color: '#f59e0b', wipLimit: 3, order: 1 },
  { id: 'done', title: 'Done', color: '#22c55e', wipLimit: null, order: 2 },
]
