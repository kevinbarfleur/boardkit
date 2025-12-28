// Types
export * from './types'

// Modules
export { defineModule } from './modules/defineModule'
export { moduleRegistry, ModuleRegistry } from './modules/ModuleRegistry'

// Actions
export { actionRegistry, ActionRegistry } from './actions/ActionRegistry'
export { registerCoreActions, refreshCoreActions } from './actions/coreActions'

// Stores
export {
  useBoardStore,
  type SelectionTarget,
  type SelectionItem,
  type MultiSelection,
} from './stores/boardStore'
export { useToolStore } from './stores/toolStore'

// Migrations
export {
  migrateDocument,
  needsMigration,
  getDocumentVersion,
  CURRENT_DOCUMENT_VERSION,
} from './migrations'

// Composables
export { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
export type { ShortcutHandler, KeyboardShortcutsOptions } from './composables/useKeyboardShortcuts'
