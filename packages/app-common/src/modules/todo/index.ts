import { defineModule, todoContractV1 } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import TodoWidget from './TodoWidget.vue'
import type { TodoState } from './types'
import { defaultTodoSettings } from './types'

/**
 * Settings schema for Todo module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showProgress',
          type: 'button-group',
          label: 'Progress indicator',
          options: [
            { value: 'none', label: 'None' },
            { value: 'bar', label: 'Bar' },
            { value: 'counter', label: 'Counter' },
          ],
          fullWidth: true,
        },
        {
          key: 'strikeCompleted',
          type: 'toggle',
          label: 'Strike completed',
          hint: 'Add strikethrough to completed items',
        },
        {
          key: 'hideCompleted',
          type: 'toggle',
          label: 'Hide completed',
          hint: 'Hide completed items from list',
        },
      ],
    },
    {
      id: 'features',
      title: 'Features',
      icon: 'settings-2',
      fields: [
        {
          key: 'showDueDate',
          type: 'toggle',
          label: 'Due dates',
          hint: 'Enable due date for tasks',
        },
        {
          key: 'showPriority',
          type: 'toggle',
          label: 'Priority levels',
          hint: 'Enable task priority',
        },
        {
          key: 'enableReorder',
          type: 'toggle',
          label: 'Drag to reorder',
          hint: 'Allow reordering tasks',
        },
        {
          key: 'autoSort',
          type: 'toggle',
          label: 'Auto-sort',
          hint: 'Automatically sort by priority/due date',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: 'zap',
      fields: [
        {
          key: 'confirmDelete',
          type: 'toggle',
          label: 'Confirm delete',
          hint: 'Ask before deleting tasks',
        },
      ],
    },
  ],
}

export const TodoModule = defineModule<TodoState>({
  moduleId: 'todo',
  version: '0.1.0',
  displayName: 'To-Do',
  icon: 'list-todo',
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
  provides: [todoContractV1],
  settingsSchema,
})

export type { TodoState, TodoItem, TodoPriority } from './types'
export { defaultTodoSettings }
