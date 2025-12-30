import { moduleRegistry } from '@boardkit/core'
import { TextModule } from './text'
import { TodoModule } from './todo'
import { TaskRadarModule } from './task-radar'
import { FocusLensModule } from './focus-lens'
import { ScratchpadModule } from './scratchpad'
import { CounterModule } from './counter'
import { TimerModule } from './timer'
import { HabitTrackerModule } from './habit-tracker'
import { KanbanModule } from './kanban'
import { StatsCardModule } from './stats-card'

export function registerModules() {
  moduleRegistry.register(TextModule)
  moduleRegistry.register(TodoModule)
  moduleRegistry.register(TaskRadarModule)
  moduleRegistry.register(FocusLensModule)
  moduleRegistry.register(ScratchpadModule)
  moduleRegistry.register(CounterModule)
  moduleRegistry.register(TimerModule)
  moduleRegistry.register(HabitTrackerModule)
  moduleRegistry.register(KanbanModule)
  moduleRegistry.register(StatsCardModule)
}

export { TextModule } from './text'
export { TodoModule } from './todo'
export { TaskRadarModule } from './task-radar'
export { FocusLensModule } from './focus-lens'
export { ScratchpadModule } from './scratchpad'
export { CounterModule } from './counter'
export { TimerModule } from './timer'
export { HabitTrackerModule } from './habit-tracker'
export { KanbanModule } from './kanban'
export { StatsCardModule } from './stats-card'

// Re-export types
export type { TextState } from './text'
export type { TodoState, TodoItem, TodoPriority } from './todo'
export type { TaskRadarState } from './task-radar/types'
export type { FocusLensState } from './focus-lens/types'
export type { ScratchpadState } from './scratchpad'
export type { CounterState } from './counter'
export type { TimerState, TimerSession } from './timer'
export type { HabitTrackerState, Habit, HabitCompletion } from './habit-tracker'
export type { KanbanState, KanbanItem, KanbanColumn } from './kanban'
export type { StatsCardState, StatMetricConfig } from './stats-card'

// Re-export default settings
export { defaultTextSettings } from './text'
export { defaultTodoSettings } from './todo'
export { defaultTaskRadarSettings } from './task-radar'
export { defaultFocusLensSettings } from './focus-lens'
export { defaultScratchpadSettings } from './scratchpad'
export { defaultCounterSettings } from './counter'
export { defaultTimerSettings } from './timer'
export { defaultHabitTrackerSettings } from './habit-tracker'
export { defaultKanbanSettings, defaultKanbanColumns } from './kanban'
export { defaultStatsCardSettings, metricTemplates } from './stats-card'
