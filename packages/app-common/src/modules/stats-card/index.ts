import {
  defineModule,
  todoContractV1,
  counterContractV1,
  habitsStatsContractV1,
  kanbanStatsContractV1,
  timerHistoryContractV1,
} from '@boardkit/core'
import type { ConfigurationSchema, SettingsSchema } from '@boardkit/core'
import StatsCardWidget from './StatsCardWidget.vue'
import type { StatsCardState } from './types'
import { defaultStatsCardSettings } from './types'

/**
 * Configuration schema - Stats Card needs at least one metric configured
 *
 * Note: Stats Card uses a custom inline configuration UI because
 * the metric builder flow is complex (source type → provider → metric).
 * The schema here is for metadata/validation only.
 */
const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => ((state as StatsCardState).metrics?.length ?? 0) > 0,
  setupMessage: 'Add metrics from your widgets to display statistics',
  setupIcon: 'bar-chart-2',
  sections: [
    {
      type: 'custom',
      title: 'Metrics',
      icon: 'bar-chart-2',
      description: 'Configure metrics using the widget settings',
      component: 'StatsCardMetricsConfig',
    },
  ],
}

/**
 * Settings schema - display preferences
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'layout',
      title: 'Layout',
      icon: 'layout-grid',
      fields: [
        {
          key: 'layout',
          type: 'button-group',
          label: 'Grid layout',
          options: [
            { value: '1x1', label: '1×1' },
            { value: '2x1', label: '2×1' },
            { value: '2x2', label: '2×2' },
            { value: '1x4', label: '1×4' },
          ],
          fullWidth: true,
        },
      ],
    },
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showIcons',
          type: 'toggle',
          label: 'Show icons',
          hint: 'Display metric icons',
        },
        {
          key: 'showLabels',
          type: 'toggle',
          label: 'Show labels',
          hint: 'Display metric labels',
        },
      ],
    },
  ],
}

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
  configurationSchema,
  settingsSchema,
})

export type { StatsCardState, StatMetricConfig, StatSourceType, MetricFormat, LayoutMode } from './types'
export { defaultStatsCardSettings, metricTemplates } from './types'
