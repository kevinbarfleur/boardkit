// Main entry point for @boardkit/app-common

// Modules
export {
  registerModules,
  TextModule,
  TodoModule,
  TaskRadarModule,
  FocusLensModule,
} from './modules'

// Module types
export type {
  TextState,
  TodoState,
  TodoItem,
  TodoPriority,
  TaskRadarState,
  FocusLensState,
} from './modules'

// Default settings
export {
  defaultTextSettings,
  defaultTodoSettings,
  defaultTaskRadarSettings,
  defaultFocusLensSettings,
} from './modules'

// Components
export { TiptapEditor } from './components'
