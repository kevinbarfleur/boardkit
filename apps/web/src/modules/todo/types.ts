export interface TodoItem {
  id: string
  label: string
  completed: boolean
}

export interface TodoState {
  title: string
  description: string
  items: TodoItem[]
}
