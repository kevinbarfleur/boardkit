import type { Component } from 'vue'
import type { DataContract } from './dataContract'
import type { ConfigurationSchema } from './configurationSchema'
import type { SettingsSchema } from './settingsSchema'

/**
 * Module SDK Types
 * Defines the contract that all modules must follow.
 */

/**
 * Configuration for a data consumer declaration.
 * Used in defineModule to auto-register consumers.
 */
export interface ConsumerConfig<TProjection = unknown> {
  /** The data contract to consume */
  contract: DataContract<TProjection>
  /** Whether this consumer can connect to multiple providers (default: false) */
  multi?: boolean
  /** Key in widget state where provider ID(s) are stored */
  stateKey: string
  /** Human-readable label for the data source (for UI) */
  sourceLabel?: string
}

export interface ModuleDefinition<TState = unknown> {
  /** Unique identifier for the module */
  moduleId: string

  /** Module version (semver recommended) */
  version: string

  /** Display name for UI */
  displayName: string

  /** Icon name (Lucide icon) for UI */
  icon?: string

  /** Vue component to render the module content */
  component: Component

  /** Default state when creating a new widget */
  defaultState: () => TState

  /** Serialize state for persistence */
  serialize: (state: TState) => unknown

  /** Deserialize state from persistence */
  deserialize: (data: unknown) => TState

  /** Minimum widget dimensions */
  minWidth?: number
  minHeight?: number

  /** Default widget dimensions */
  defaultWidth?: number
  defaultHeight?: number

  /** Data contracts this module consumes (auto-registered) */
  consumes?: ConsumerConfig[]

  /** Data contracts this module provides (auto-registered) */
  provides?: DataContract[]

  /**
   * Configuration schema for modules that require setup before use.
   * If defined, the module will show a "Setup Required" state until configured.
   * Configuration is managed through the Configure tab in the Settings panel.
   */
  configurationSchema?: ConfigurationSchema

  /**
   * Settings schema for module preferences.
   * Used to automatically generate the Settings panel UI.
   * Settings are optional customizations for an already-functional module.
   */
  settingsSchema?: SettingsSchema
}

/**
 * Options for controlling history capture when updating module state.
 * Allows modules to provide contextual labels and control debouncing.
 */
export interface HistoryOptions {
  /**
   * Contextual label for the history entry (e.g., "Checked: Buy groceries").
   * Should be descriptive of what action was performed.
   */
  historyLabel?: string

  /**
   * If true, captures a history snapshot before the mutation.
   * Default: false (no automatic capture for module state changes)
   */
  captureHistory?: boolean

  /**
   * Debounce delay in milliseconds before capturing the history snapshot.
   * Useful for high-frequency actions like text input.
   * Default: 0 (immediate capture)
   */
  debounceMs?: number
}

export interface ModuleContext<TState = unknown> {
  /** Widget ID */
  widgetId: string

  /** Module ID */
  moduleId: string

  /** Current module state */
  state: TState

  /**
   * Update module state (partial merge).
   * @param partial - Partial state to merge
   * @param options - History options for controlling snapshot capture
   */
  updateState: (partial: Partial<TState>, options?: HistoryOptions) => void

  /**
   * Replace entire module state.
   * @param state - New complete state
   * @param options - History options for controlling snapshot capture
   */
  setState: (state: TState, options?: HistoryOptions) => void

  /** Whether the widget is currently selected */
  isSelected: boolean
}

export type ModuleComponent<TState = unknown> = Component<{
  context: ModuleContext<TState>
}>

/**
 * Menu item for module-specific context menu actions.
 * Modules emit these when they want to show contextual actions
 * that will be combined with widget-level actions.
 */
export interface ModuleMenuItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  destructive?: boolean
}

export interface ModuleMenuGroup {
  label?: string
  items: ModuleMenuItem[]
}

/**
 * Event payload when a module requests a context menu.
 * BoardCanvas will combine these module-specific actions
 * with the standard widget actions (Edit, Data, Settings, Delete).
 */
export interface ModuleContextMenuEvent {
  /** Screen X coordinate for menu positioning */
  x: number
  /** Screen Y coordinate for menu positioning */
  y: number
  /** Module-specific menu groups to show at the top */
  groups: ModuleMenuGroup[]
  /**
   * Handler called when a module menu item is selected.
   * BoardCanvas calls this for items from the module's groups.
   */
  onSelect: (itemId: string) => void | Promise<void>
}
