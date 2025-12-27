export interface TodoItem {
  id: string
  label: string
  completed: boolean
}

export interface TodoState {
  items: TodoItem[]
}
