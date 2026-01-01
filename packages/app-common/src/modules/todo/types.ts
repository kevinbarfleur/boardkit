export type TodoPriority = 'low' | 'medium' | 'high'

export interface TodoItem {
  id: string
  label: string
  description?: string // Optional task description
  completed: boolean
  dueDate?: string // ISO date string
  priority?: TodoPriority
  parentId?: string // Reference to parent item (undefined = root item)
}

export interface TodoState {
  title: string
  description: string
  items: TodoItem[]
  // Settings (stored per widget)
  strikeCompleted: boolean
  hideCompleted: boolean
  autoSort: boolean
  showProgress: 'none' | 'bar' | 'counter'
  enableReorder: boolean
  showDueDate: boolean
  showPriority: boolean
  confirmDelete: boolean
  cascadeCompletion: boolean // Complete sub-tasks when parent is completed
}

// Grouped settings interface for component props
export interface TodoSettings {
  // Display
  strikeCompleted: boolean
  hideCompleted: boolean
  showProgress: 'none' | 'bar' | 'counter'
  // Features
  showDueDate: boolean
  showPriority: boolean
  enableReorder: boolean
  autoSort: boolean
  // Behavior
  cascadeCompletion: boolean
  confirmDelete: boolean
}

// Default settings for new widgets
export const defaultTodoSettings: Pick<
  TodoState,
  | 'strikeCompleted'
  | 'hideCompleted'
  | 'autoSort'
  | 'showProgress'
  | 'enableReorder'
  | 'showDueDate'
  | 'showPriority'
  | 'confirmDelete'
  | 'cascadeCompletion'
> = {
  strikeCompleted: true,
  hideCompleted: false,
  autoSort: false,
  showProgress: 'counter',
  enableReorder: true,
  showDueDate: false,
  showPriority: false,
  confirmDelete: false,
  cascadeCompletion: true,
}
