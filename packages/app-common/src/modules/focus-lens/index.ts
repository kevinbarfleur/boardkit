/**
 * Focus Lens Module
 *
 * Shows the next actionable task from a connected todo list.
 * Designed for single-task focus.
 */

import { defineModule, todoContractV1 } from '@boardkit/core'
import type { ConfigurationSchema, SettingsSchema } from '@boardkit/core'
import FocusLensWidget from './FocusLensWidget.vue'
import type { FocusLensState } from './types'
import { defaultFocusLensSettings } from './types'

/**
 * Configuration schema - defines what's needed before module is functional
 */
const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => !!(state as FocusLensState).connectedProvider,
  setupMessage: 'Connect a Todo list to focus on your next task',
  setupIcon: 'focus',
  sections: [
    {
      type: 'source-picker',
      title: 'Data Source',
      icon: 'list-todo',
      description: 'Select a Todo list to focus on:',
      contractId: 'boardkit.todo.v1',
      stateKey: 'connectedProvider',
      mode: 'single',
    },
  ],
}

/**
 * Settings schema - defines preferences for a configured module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showMode',
          type: 'button-group',
          label: 'Show mode',
          options: [
            { value: 'next', label: 'Next' },
            { value: 'random', label: 'Random' },
          ],
          fullWidth: true,
        },
        {
          key: 'showSourceName',
          type: 'toggle',
          label: 'Show source name',
          hint: 'Display the connected list name',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: 'settings-2',
      fields: [
        {
          key: 'autoRefresh',
          type: 'slider',
          label: 'Auto-refresh',
          hint: 'Refresh task display (0 = disabled)',
          min: 0,
          max: 120,
          step: 10,
          unit: 's',
          condition: "state.showMode === 'random'",
        },
      ],
    },
  ],
}

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
  consumes: [{
    contract: todoContractV1,
    stateKey: 'connectedProvider',
    sourceLabel: 'Todo List',
  }],
  configurationSchema,
  settingsSchema,
})

export { defaultFocusLensSettings }
