import {
  defineModule,
  todoContractV1,
  counterContractV1,
  habitsStatsContractV1,
  kanbanStatsContractV1,
  timerHistoryContractV1,
} from '@boardkit/core'
import StatsCardWidget from './StatsCardWidget.vue'
import type { StatsCardState } from './types'
import { defaultStatsCardSettings } from './types'

export const StatsCardModule = defineModule<StatsCardState>({
  moduleId: 'stats-card',
  version: '0.1.0',
  displayName: 'Stats Card',
  component: StatsCardWidget,
  defaultState: () => ({
    title: 'Stats',
    metrics: [],
    connectedTodoProviders: [],
    connectedCounterProviders: [],
    connectedHabitProviders: [],
    connectedKanbanProviders: [],
    connectedTimerProviders: [],
    ...defaultStatsCardSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    title: 'Stats',
    metrics: [],
    connectedTodoProviders: [],
    connectedCounterProviders: [],
    connectedHabitProviders: [],
    connectedKanbanProviders: [],
    connectedTimerProviders: [],
    ...defaultStatsCardSettings,
    ...(data as Partial<StatsCardState>),
  }),
  minWidth: 200,
  minHeight: 180,
  defaultWidth: 280,
  defaultHeight: 240,
  consumes: [
    { contract: todoContractV1, multi: true, stateKey: 'connectedTodoProviders', sourceLabel: 'Todo List' },
    { contract: counterContractV1, multi: true, stateKey: 'connectedCounterProviders', sourceLabel: 'Counter' },
    { contract: habitsStatsContractV1, multi: true, stateKey: 'connectedHabitProviders', sourceLabel: 'Habits' },
    { contract: kanbanStatsContractV1, multi: true, stateKey: 'connectedKanbanProviders', sourceLabel: 'Kanban' },
    { contract: timerHistoryContractV1, multi: true, stateKey: 'connectedTimerProviders', sourceLabel: 'Timer' },
  ],
})

export type { StatsCardState, StatMetricConfig, StatSourceType, MetricFormat, LayoutMode } from './types'
export { defaultStatsCardSettings, metricTemplates } from './types'
