import { moduleRegistry } from '@boardkit/core'

// ============================================================================
// CORE MODULES (bundled with Boardkit, always available)
// These are fundamental productivity modules that ship with every installation.
// ============================================================================
import { TextModule } from './text'
import { TodoModule } from './todo'
import { TimerModule } from './timer'
import { CounterModule } from './counter'
import { ScratchpadModule } from './scratchpad'
import { KanbanModule } from './kanban'
import { TaskRadarModule } from './task-radar' // Demonstrates data sharing

// Track if modules have been registered to make function idempotent
let modulesRegistered = false

/**
 * Register all core modules.
 * This function is called once at application startup.
 * It's idempotent - calling it multiple times has no effect.
 *
 * Note: Official plugins (Habit Tracker, Stats Card, Focus Lens, Google Calendar)
 * are now available separately via the plugin system. Install them from:
 * github.com/kevinbarfleur/boardkit-official-plugins
 */
export function registerModules() {
  if (modulesRegistered) return
  modulesRegistered = true

  moduleRegistry.register(TextModule)
  moduleRegistry.register(TodoModule)
  moduleRegistry.register(TimerModule)
  moduleRegistry.register(CounterModule)
  moduleRegistry.register(ScratchpadModule)
  moduleRegistry.register(KanbanModule)
  moduleRegistry.register(TaskRadarModule)
}

// Core module exports
export { TextModule } from './text'
export { TodoModule } from './todo'
export { TaskRadarModule } from './task-radar'
export { ScratchpadModule } from './scratchpad'
export { CounterModule } from './counter'
export { TimerModule } from './timer'
export { KanbanModule } from './kanban'

// Re-export types (core modules only)
export type { TextState } from './text'
export type { TodoState, TodoItem, TodoPriority } from './todo'
export type { TaskRadarState } from './task-radar/types'
export type { ScratchpadState } from './scratchpad'
export type { CounterState } from './counter'
export type { TimerState, TimerSession } from './timer'
export type { KanbanState, KanbanItem, KanbanColumn } from './kanban'

// Re-export default settings (core modules only)
export { defaultTextSettings } from './text'
export { defaultTodoSettings } from './todo'
export { defaultTaskRadarSettings } from './task-radar'
export { defaultScratchpadSettings } from './scratchpad'
export { defaultCounterSettings } from './counter'
export { defaultTimerSettings } from './timer'
export { defaultKanbanSettings, defaultKanbanColumns } from './kanban'
