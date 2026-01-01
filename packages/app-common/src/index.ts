// Main entry point for @boardkit/app-common

// Modules (core only - plugins are installed separately)
export {
  registerModules,
  TextModule,
  TodoModule,
  TaskRadarModule,
  ScratchpadModule,
  CounterModule,
  TimerModule,
  KanbanModule,
} from './modules'

// Module types
export type {
  TextState,
  TodoState,
  TodoItem,
  TodoPriority,
  TaskRadarState,
  ScratchpadState,
  CounterState,
  TimerState,
  TimerSession,
  KanbanState,
  KanbanItem,
  KanbanColumn,
} from './modules'

// Default settings
export {
  defaultTextSettings,
  defaultTodoSettings,
  defaultTaskRadarSettings,
  defaultScratchpadSettings,
  defaultCounterSettings,
  defaultTimerSettings,
  defaultKanbanSettings,
  defaultKanbanColumns,
} from './modules'

// Components
export { TiptapEditor } from './components'

// Composables
export { usePlugins } from './composables/usePlugins'
