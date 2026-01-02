// Types
export * from './types'

// Modules
export { defineModule } from './modules/defineModule'
export { moduleRegistry, ModuleRegistry } from './modules/ModuleRegistry'

// Actions
export { actionRegistry, ActionRegistry } from './actions/ActionRegistry'
export { registerCoreActions, refreshCoreActions, menuActionBus } from './actions/coreActions'
export type { MenuActionEvent } from './actions/coreActions'
export { dataSharingEventBus } from './actions/dataActions'

// Menu System
export { menuRegistry, MenuRegistry } from './menu/MenuRegistry'
export { coreMenus, registerCoreMenus } from './menu/coreMenus'

// Stores
export {
  useBoardStore,
  type SelectionTarget,
  type SelectionItem,
  type MultiSelection,
} from './stores/boardStore'
export { useToolStore } from './stores/toolStore'
export { useDataSharingStore } from './stores/dataSharingStore'

// Migrations
export {
  migrateDocument,
  needsMigration,
  getDocumentVersion,
  CURRENT_DOCUMENT_VERSION,
} from './migrations'

// Composables
export { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
export type {
  KeyboardShortcutsOptions,
  LegacyKeyboardShortcutsOptions,
} from './composables/useKeyboardShortcuts'

export { useHistory, type HistoryEntry, type HistoryManager } from './composables/useHistory'

export {
  useModuleConfiguration,
  isModuleConfigured,
  getModuleConfigurationSchema,
  getModuleSettingsSchema,
} from './composables/useModuleConfiguration'

export {
  useConfigurationProviders,
  type ConfigurationProvider,
} from './composables/useConfigurationProviders'

// Canvas helpers (VueUse-based utilities)
export {
  useCanvasSize,
  useElementSize,
  useCanvasMouse,
  useElementResize,
  useVisibility,
} from './composables/useCanvasHelpers'

// Data sharing composables (simplified API - recommended)
export { useProvideData } from './composables/useProvideData'
export { useConsumeData } from './composables/useConsumeData'

// Secrets composable
export { useSecrets, type UseSecretsReturn } from './composables/useSecrets'

// Async operation composable
export {
  useAsyncOperation,
  type AsyncOperationOptions,
  type AsyncOperationState,
  type UseAsyncOperationReturn,
} from './composables/useAsyncOperation'

// Data sharing composables (legacy - full control)
export { useDataProvider } from './composables/useDataProvider'
export { useDataConsumer } from './composables/useDataConsumer'

// Data Sharing
export { dataContractRegistry, DataContractRegistry } from './data/DataContractRegistry'
export { dataBus, DataBus } from './data/DataBus'
export { dataAccessController, DataAccessController } from './data/DataAccessController'
export { consumerRegistry, ConsumerRegistry, type ConsumerDefinition } from './data/ConsumerRegistry'

// Contracts
export * from './contracts'

// Validation
export {
  validateDocument,
  safeValidateDocument,
  DocumentValidationError,
} from './validation/documentValidator'

// Utils
export {
  truncate,
  getShapeAnchorPoints,
  findNearestAnchor,
  getAnchorPoint,
  findNearestShapeAndAnchor,
  calculateAutoAnchor,
  // Orthogonal Router
  calculateOrthogonalPath,
  calculatePreviewPath,
  calculateOptimalAnchor,
  pathToSvgD,
  getEndAngle,
  getStartAngle,
  getBoundsCenter,
  getAnchorOnSide,
  buildOrthogonalPath,
  type Bounds,
  type AnchorSide,
  type AnchorResult,
} from './utils'

// Services
export {
  setSecretsVault,
  getSecretsVault,
  isSecretsVaultInitialized,
} from './services'

// Plugin System
export * from './plugins'
