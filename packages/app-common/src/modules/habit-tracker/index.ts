import { defineModule, habitsContractV1, habitsStatsContractV1 } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import HabitTrackerWidget from './HabitTrackerWidget.vue'
import type { HabitTrackerState } from './types'
import { defaultHabitTrackerSettings } from './types'

/**
 * Settings schema for Habit Tracker module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showStreaks',
          type: 'toggle',
          label: 'Show streaks',
          hint: 'Display current streak count',
        },
        {
          key: 'showCalendar',
          type: 'toggle',
          label: 'Show calendar',
          hint: 'Display completion calendar',
        },
        {
          key: 'calendarDays',
          type: 'button-group',
          label: 'Calendar days',
          options: [
            { value: 7, label: '7' },
            { value: 14, label: '14' },
            { value: 30, label: '30' },
          ],
          fullWidth: true,
          condition: 'state.showCalendar === true',
        },
      ],
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: 'calendar',
      fields: [
        {
          key: 'startOfWeek',
          type: 'button-group',
          label: 'Week starts on',
          options: [
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' },
          ],
          fullWidth: true,
        },
      ],
    },
  ],
}

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
  settingsSchema,
})

export type { HabitTrackerState, Habit, HabitCompletion } from './types'
export { defaultHabitTrackerSettings, habitColors, habitIcons } from './types'
