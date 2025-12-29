export type TodoPriority = 'low' | 'medium' | 'high'

export interface TodoItem {
  id: string
  label: string
  completed: boolean
  dueDate?: string // ISO date string
  priority?: TodoPriority
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
> = {
  strikeCompleted: true,
  hideCompleted: false,
  autoSort: false,
  showProgress: 'counter',
  enableReorder: true,
  showDueDate: false,
  showPriority: false,
  confirmDelete: false,
}
