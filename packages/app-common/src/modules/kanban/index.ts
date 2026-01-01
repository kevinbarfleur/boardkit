import { defineModule, kanbanContractV1, kanbanStatsContractV1 } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import KanbanWidget from './KanbanWidget.vue'
import type { KanbanState } from './types'
import { defaultKanbanSettings, defaultKanbanColumns } from './types'

/**
 * Settings schema for Kanban module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showItemCount',
          type: 'toggle',
          label: 'Show item count',
          hint: 'Display card count per column',
        },
        {
          key: 'showWipLimits',
          type: 'toggle',
          label: 'Show WIP limits',
          hint: 'Display work-in-progress limits',
        },
        {
          key: 'showCompletionRate',
          type: 'toggle',
          label: 'Show completion rate',
          hint: 'Display overall completion percentage',
        },
        {
          key: 'compactMode',
          type: 'toggle',
          label: 'Compact mode',
          hint: 'Use smaller cards',
        },
      ],
    },
  ],
}

export const KanbanModule = defineModule<KanbanState>({
  moduleId: 'kanban',
  version: '0.1.0',
  displayName: 'Kanban',
  icon: 'columns',
  component: KanbanWidget,
  defaultState: () => ({
    title: 'Kanban',
    columns: [...defaultKanbanColumns],
    items: [],
    ...defaultKanbanSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    title: 'Kanban',
    columns: [...defaultKanbanColumns],
    items: [],
    ...defaultKanbanSettings,
    ...(data as Partial<KanbanState>),
  }),
  minWidth: 400,
  minHeight: 250,
  defaultWidth: 550,
  defaultHeight: 350,
  provides: [kanbanContractV1, kanbanStatsContractV1],
  settingsSchema,
})

export type { KanbanState, KanbanItem, KanbanColumn } from './types'
export { defaultKanbanSettings, defaultKanbanColumns } from './types'
