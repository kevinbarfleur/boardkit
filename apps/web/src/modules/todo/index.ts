import { defineModule } from '@boardkit/core'
import TodoWidget from './TodoWidget.vue'
import type { TodoState } from './types'

export const TodoModule = defineModule<TodoState>({
  moduleId: 'todo',
  version: '0.1.0',
  displayName: 'To-Do',
  component: TodoWidget,
  defaultState: () => ({
    items: [],
  }),
  serialize: (state) => state,
  deserialize: (data) => data as TodoState,
  minWidth: 250,
  minHeight: 150,
  defaultWidth: 300,
  defaultHeight: 300,
})

export type { TodoState, TodoItem } from './types'
