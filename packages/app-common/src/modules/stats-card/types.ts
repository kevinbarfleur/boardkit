/**
 * Stats Card Module Types
 *
 * Multi-consumer dashboard card that aggregates data from various providers.
 */

export type StatSourceType = 'todo' | 'counter' | 'habits' | 'kanban' | 'timer'
export type MetricFormat = 'number' | 'percent' | 'duration' | 'text'
export type LayoutMode = '1x1' | '2x2' | '1x4' | '2x1'

export interface StatMetricConfig {
  id: string
  sourceType: StatSourceType
  sourceWidgetId: string
  metricKey: string
  label: string
  format: MetricFormat
  icon: string
}

export interface StatsCardState {
  // Core state
  title: string
  metrics: StatMetricConfig[]
  layout: LayoutMode

  // Settings
  showIcons: boolean
  showLabels: boolean

  // Multi-contract connections
  connectedTodoProviders: string[]
  connectedCounterProviders: string[]
  connectedHabitProviders: string[]
  connectedKanbanProviders: string[]
  connectedTimerProviders: string[]
}

export const defaultStatsCardSettings: Omit<
  StatsCardState,
  | 'title'
  | 'metrics'
  | 'connectedTodoProviders'
  | 'connectedCounterProviders'
  | 'connectedHabitProviders'
  | 'connectedKanbanProviders'
  | 'connectedTimerProviders'
> = {
  layout: '2x2',
  showIcons: true,
  showLabels: true,
}

// Predefined metric templates
export const metricTemplates: Record<StatSourceType, Array<{ key: string; label: string; format: MetricFormat; icon: string }>> = {
  todo: [
    { key: 'progress.done', label: 'Tasks Done', format: 'number', icon: 'check' },
    { key: 'progress.total', label: 'Total Tasks', format: 'number', icon: 'list' },
  ],
  counter: [
    { key: 'value', label: 'Value', format: 'number', icon: 'hash' },
    { key: 'progressPercent', label: 'Progress', format: 'percent', icon: 'target' },
  ],
  habits: [
    { key: 'completedToday', label: 'Done Today', format: 'number', icon: 'check-circle' },
    { key: 'todayCompletionRate', label: 'Today Rate', format: 'percent', icon: 'percent' },
    { key: 'averageStreak', label: 'Avg Streak', format: 'number', icon: 'flame' },
  ],
  kanban: [
    { key: 'totalItems', label: 'Total Cards', format: 'number', icon: 'layers' },
    { key: 'completedItems', label: 'Completed', format: 'number', icon: 'check' },
    { key: 'completionRate', label: 'Completion', format: 'percent', icon: 'percent' },
  ],
  timer: [
    { key: 'workSessionsToday', label: 'Sessions', format: 'number', icon: 'play' },
    { key: 'totalWorkSeconds', label: 'Work Time', format: 'duration', icon: 'clock' },
  ],
}
