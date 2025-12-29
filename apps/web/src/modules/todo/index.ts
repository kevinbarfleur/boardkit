import { defineModule } from '@boardkit/core'
import TodoWidget from './TodoWidget.vue'
import type { TodoState } from './types'
import { defaultTodoSettings } from './types'

export const TodoModule = defineModule<TodoState>({
  moduleId: 'todo',
  version: '0.1.0',
  displayName: 'To-Do',
  component: TodoWidget,
  defaultState: () => ({
    title: '',
    description: '',
    items: [],
    ...defaultTodoSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    // Merge with defaults to handle legacy data without settings
    title: '',
    description: '',
    items: [],
    ...defaultTodoSettings,
    ...(data as Partial<TodoState>),
  }),
  minWidth: 250,
  minHeight: 150,
  defaultWidth: 300,
  defaultHeight: 300,
})

export type { TodoState, TodoItem, TodoPriority } from './types'
export { defaultTodoSettings }
