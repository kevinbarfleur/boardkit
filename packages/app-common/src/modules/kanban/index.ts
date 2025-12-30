import { defineModule, kanbanContractV1, kanbanStatsContractV1 } from '@boardkit/core'
import KanbanWidget from './KanbanWidget.vue'
import type { KanbanState } from './types'
import { defaultKanbanSettings, defaultKanbanColumns } from './types'

export const KanbanModule = defineModule<KanbanState>({
  moduleId: 'kanban',
  version: '0.1.0',
  displayName: 'Kanban',
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
})

export type { KanbanState, KanbanItem, KanbanColumn } from './types'
export { defaultKanbanSettings, defaultKanbanColumns } from './types'
