import type { Component } from 'vue'
import type { DataContract } from './dataContract'

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

  /** Whether the widget is currently selected */
  isSelected: boolean
}

export type ModuleComponent<TState = unknown> = Component<{
  context: ModuleContext<TState>
}>
