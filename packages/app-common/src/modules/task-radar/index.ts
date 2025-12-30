/**
 * Task Radar Module
 *
 * Aggregates data from multiple todo lists and provides
 * an analysis view of tasks across the board.
 */

import { defineModule, todoContractV1 } from '@boardkit/core'
import TaskRadarWidget from './TaskRadarWidget.vue'
import type { TaskRadarState } from './types'
import { defaultTaskRadarSettings } from './types'

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
})

export { defaultTaskRadarSettings }
