/**
 * Focus Lens Module
 *
 * Shows the next actionable task from a connected todo list.
 * Designed for single-task focus.
 */

import { defineModule, consumerRegistry } from '@boardkit/core'
import FocusLensWidget from './FocusLensWidget.vue'
import type { FocusLensState } from './types'
import { defaultFocusLensSettings } from './types'

// Register as a consumer of todo data (single source only)
consumerRegistry.register({
  moduleId: 'focus-lens',
  contractId: 'boardkit.todo.v1',
  multiSelect: false,
  stateKey: 'connectedProvider',
  sourceLabel: 'Todo List',
})

export const FocusLensModule = defineModule<FocusLensState>({
  moduleId: 'focus-lens',
  version: '0.1.0',
  displayName: 'Focus Lens',
  component: FocusLensWidget,
  defaultState: () => ({
    connectedProvider: null,
    showMode: 'next',
    ...defaultFocusLensSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    // Merge with defaults to handle legacy data without settings
    connectedProvider: null,
    showMode: 'next',
    ...defaultFocusLensSettings,
    ...(data as Partial<FocusLensState>),
  }),
  minWidth: 200,
  minHeight: 120,
  defaultWidth: 280,
  defaultHeight: 160,
})

export { defaultFocusLensSettings }
