import { defineModule, habitsContractV1, habitsStatsContractV1 } from '@boardkit/core'
import HabitTrackerWidget from './HabitTrackerWidget.vue'
import type { HabitTrackerState } from './types'
import { defaultHabitTrackerSettings } from './types'

export const HabitTrackerModule = defineModule<HabitTrackerState>({
  moduleId: 'habit-tracker',
  version: '0.1.0',
  displayName: 'Habit Tracker',
  component: HabitTrackerWidget,
  defaultState: () => ({
    title: 'Habits',
    habits: [],
    ...defaultHabitTrackerSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    title: 'Habits',
    habits: [],
    ...defaultHabitTrackerSettings,
    ...(data as Partial<HabitTrackerState>),
  }),
  minWidth: 220,
  minHeight: 200,
  defaultWidth: 280,
  defaultHeight: 320,
  provides: [habitsContractV1, habitsStatsContractV1],
})

export type { HabitTrackerState, Habit, HabitCompletion } from './types'
export { defaultHabitTrackerSettings, habitColors, habitIcons } from './types'
