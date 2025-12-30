/**
 * Task Radar Module
 *
 * Aggregates data from multiple todo lists and provides
 * an analysis view of tasks across the board.
 */

import { defineModule, todoContractV1 } from '@boardkit/core'
import type { ConfigurationSchema, SettingsSchema } from '@boardkit/core'
import TaskRadarWidget from './TaskRadarWidget.vue'
import type { TaskRadarState } from './types'
import { defaultTaskRadarSettings } from './types'

/**
 * Configuration schema - defines what's needed before module is functional
 */
const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => ((state as TaskRadarState).connectedProviders?.length ?? 0) > 0,
  setupMessage: 'Connect Todo lists to aggregate your tasks',
  setupIcon: 'radar',
  sections: [
    {
      type: 'source-picker',
      title: 'Data Sources',
      icon: 'list-todo',
      description: 'Select Todo lists to aggregate:',
      contractId: 'boardkit.todo.v1',
      stateKey: 'connectedProviders',
      mode: 'multi',
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
          key: 'viewMode',
          type: 'button-group',
          label: 'View mode',
          options: [
            { value: 'summary', label: 'Summary' },
            { value: 'detailed', label: 'Detailed' },
          ],
          fullWidth: true,
        },
        {
          key: 'showEmptyLists',
          type: 'toggle',
          label: 'Show empty lists',
          hint: 'Include lists with no tasks',
        },
        {
          key: 'groupBySource',
          type: 'toggle',
          label: 'Group by source',
          hint: 'Group tasks by their source list',
          condition: "state.viewMode === 'detailed'",
        },
      ],
    },
  ],
}

export const TaskRadarModule = defineModule<TaskRadarState>({
  moduleId: 'task-radar',
  version: '0.1.0',
  displayName: 'Task Radar',
  component: TaskRadarWidget,
  defaultState: () => ({
    title: 'Task Radar',
    connectedProviders: [],
    viewMode: 'summary',
    ...defaultTaskRadarSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    // Merge with defaults to handle legacy data without settings
    title: 'Task Radar',
    connectedProviders: [],
    viewMode: 'summary',
    ...defaultTaskRadarSettings,
    ...(data as Partial<TaskRadarState>),
  }),
  minWidth: 280,
  minHeight: 200,
  defaultWidth: 360,
  defaultHeight: 300,
  consumes: [{
    contract: todoContractV1,
    multi: true,
    stateKey: 'connectedProviders',
    sourceLabel: 'Todo List',
  }],
  configurationSchema,
  settingsSchema,
})

export { defaultTaskRadarSettings }
