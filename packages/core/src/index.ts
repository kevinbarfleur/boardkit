// Types
export * from './types'

// Modules
export { defineModule } from './modules/defineModule'
export { moduleRegistry, ModuleRegistry } from './modules/ModuleRegistry'

// Actions
export { actionRegistry, ActionRegistry } from './actions/ActionRegistry'
export { registerCoreActions, refreshCoreActions } from './actions/coreActions'
export { dataSharingEventBus } from './actions/dataActions'

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
export { useDataProvider } from './composables/useDataProvider'
export { useDataConsumer } from './composables/useDataConsumer'

// Data Sharing
export { dataContractRegistry, DataContractRegistry } from './data/DataContractRegistry'
export { dataBus, DataBus } from './data/DataBus'
export { dataAccessController, DataAccessController } from './data/DataAccessController'
export { consumerRegistry, ConsumerRegistry, type ConsumerDefinition } from './data/ConsumerRegistry'

// Contracts
export { todoContractV1, type PublicTodoList } from './contracts/todo.v1'
