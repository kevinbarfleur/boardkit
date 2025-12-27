import type { Component } from 'vue'

/**
 * Module SDK Types
 * Defines the contract that all modules must follow.
 */

export interface ModuleDefinition<TState = unknown> {
  /** Unique identifier for the module */
  moduleId: string

  /** Module version (semver recommended) */
  version: string

  /** Display name for UI */
  displayName: string

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
}

export interface ModuleContext<TState = unknown> {
  /** Widget ID */
  widgetId: string

  /** Current module state */
  state: TState

  /** Update module state */
  updateState: (partial: Partial<TState>) => void

  /** Replace entire module state */
  setState: (state: TState) => void
}

export type ModuleComponent<TState = unknown> = Component<{
  context: ModuleContext<TState>
}>
