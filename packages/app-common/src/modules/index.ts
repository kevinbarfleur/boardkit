import { moduleRegistry } from '@boardkit/core'
import { TextModule } from './text'
import { TodoModule } from './todo'
import { TaskRadarModule } from './task-radar'
import { FocusLensModule } from './focus-lens'

export function registerModules() {
  moduleRegistry.register(TextModule)
  moduleRegistry.register(TodoModule)
  moduleRegistry.register(TaskRadarModule)
  moduleRegistry.register(FocusLensModule)
}

export { TextModule } from './text'
export { TodoModule } from './todo'
export { TaskRadarModule } from './task-radar'
export { FocusLensModule } from './focus-lens'

// Re-export types
export type { TextState } from './text'
export type { TodoState, TodoItem, TodoPriority } from './todo'
export type { TaskRadarState } from './task-radar/types'
export type { FocusLensState } from './focus-lens/types'

// Re-export default settings
export { defaultTextSettings } from './text'
export { defaultTodoSettings } from './todo'
export { defaultTaskRadarSettings } from './task-radar'
export { defaultFocusLensSettings } from './focus-lens'
