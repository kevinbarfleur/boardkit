/**
 * @boardkit/plugin-api
 *
 * Public API for Boardkit plugins.
 *
 * This package provides a stable, versioned API for plugin developers.
 * Only exports from this package are guaranteed to be stable across minor versions.
 *
 * @example
 * ```typescript
 * import {
 *   definePlugin,
 *   useProvideData,
 *   useConsumeData,
 *   todoContractV1,
 * } from '@boardkit/plugin-api'
 *
 * export default definePlugin({
 *   pluginId: 'my-plugin',
 *   version: '1.0.0',
 *   displayName: 'My Plugin',
 *   component: MyWidget,
 *   defaultState: () => ({}),
 *   serialize: (s) => s,
 *   deserialize: (d) => d,
 * })
 * ```
 */

// ============================================================================
// Plugin Definition
// ============================================================================

export { definePlugin } from './definePlugin'

// ============================================================================
// Types
// ============================================================================

export type {
  PluginManifest,
  PluginDefinition,
  PluginLifecycle,
  InstalledPlugin,
  PluginSource,
} from './types'

export { parseGitHubUrl } from './types'

// Re-export essential types from core
export type {
  // Module context (passed to widget components)
  ModuleContext,
  // Data contracts
  DataContract,
  ConsumerConfig,
  DataPermission,
  DataLink,
  ConnectionStatus,
  // Configuration
  ConfigurationSchema,
  ConfigurationSection,
  SettingsSchema,
  SettingsSection,
  SettingsField,
  // Actions
  ActionDefinition,
  ActionContext,
} from '@boardkit/core'

// ============================================================================
// Data Sharing (Recommended API)
// ============================================================================

export { useProvideData } from '@boardkit/core'
export { useConsumeData } from '@boardkit/core'

// ============================================================================
// Official Data Contracts (v1)
// ============================================================================

// Todo
export {
  todoContractV1,
  type PublicTodoList,
} from '@boardkit/core'

// Counter
export {
  counterContractV1,
  type PublicCounter,
} from '@boardkit/core'

// Timer
export {
  timerStatusContractV1,
  timerHistoryContractV1,
  type PublicTimerStatus,
  type PublicTimerHistory,
  type TimerMode,
  type TimerStatus,
  type TimerSessionRecord,
} from '@boardkit/core'

// Habits
export {
  habitsContractV1,
  habitsStatsContractV1,
  type PublicHabitList,
  type PublicHabit,
  type PublicHabitStats,
} from '@boardkit/core'

// Kanban
export {
  kanbanContractV1,
  kanbanStatsContractV1,
  type PublicKanbanBoard,
  type PublicKanbanColumn,
  type PublicKanbanItem,
  type PublicKanbanStats,
  type KanbanColumnStat,
} from '@boardkit/core'

// ============================================================================
// Actions
// ============================================================================

export { actionRegistry } from '@boardkit/core'

// ============================================================================
// UI Components
// ============================================================================

// Note: WidgetFrame and other UI components should be imported from @boardkit/ui
// We don't re-export them here to keep the API surface small and avoid version conflicts.

// ============================================================================
// Utilities
// ============================================================================

export { truncate } from '@boardkit/core'
