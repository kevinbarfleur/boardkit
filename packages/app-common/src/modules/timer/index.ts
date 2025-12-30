import { defineModule, timerStatusContractV1, timerHistoryContractV1 } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import TimerWidget from './TimerWidget.vue'
import type { TimerState } from './types'
import { defaultTimerSettings } from './types'

const initialSeconds = defaultTimerSettings.pomodoroWorkMinutes * 60

/**
 * Settings schema for Timer module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'pomodoro',
      title: 'Pomodoro',
      icon: 'timer',
      fields: [
        {
          key: 'pomodoroWorkMinutes',
          type: 'slider',
          label: 'Work duration',
          hint: 'Minutes per work session',
          min: 5,
          max: 60,
          step: 5,
          unit: 'min',
        },
        {
          key: 'pomodoroBreakMinutes',
          type: 'slider',
          label: 'Short break',
          hint: 'Minutes for short breaks',
          min: 1,
          max: 15,
          step: 1,
          unit: 'min',
        },
        {
          key: 'pomodoroLongBreakMinutes',
          type: 'slider',
          label: 'Long break',
          hint: 'Minutes for long breaks',
          min: 10,
          max: 30,
          step: 5,
          unit: 'min',
        },
        {
          key: 'sessionsUntilLongBreak',
          type: 'slider',
          label: 'Sessions until long break',
          hint: 'Work sessions before a long break',
          min: 2,
          max: 6,
          step: 1,
        },
      ],
    },
    {
      id: 'freeTimer',
      title: 'Free Timer',
      icon: 'clock',
      fields: [
        {
          key: 'freeTimerMinutes',
          type: 'slider',
          label: 'Default duration',
          hint: 'Default duration for free timer',
          min: 1,
          max: 120,
          step: 1,
          unit: 'min',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: 'settings-2',
      fields: [
        {
          key: 'autoStartBreaks',
          type: 'toggle',
          label: 'Auto-start breaks',
          hint: 'Automatically start break timer',
        },
        {
          key: 'autoStartWork',
          type: 'toggle',
          label: 'Auto-start work',
          hint: 'Automatically start work timer after break',
        },
      ],
    },
    {
      id: 'sound',
      title: 'Sound',
      icon: 'volume-2',
      fields: [
        {
          key: 'soundEnabled',
          type: 'toggle',
          label: 'Sound notifications',
          hint: 'Play sound when timer completes',
        },
        {
          key: 'soundVolume',
          type: 'slider',
          label: 'Volume',
          min: 0,
          max: 100,
          step: 10,
          unit: '%',
          condition: 'state.soundEnabled === true',
        },
      ],
    },
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showHistory',
          type: 'toggle',
          label: 'Show history',
          hint: 'Display session history',
        },
      ],
    },
  ],
}

export const TimerModule = defineModule<TimerState>({
  moduleId: 'timer',
  version: '0.1.0',
  displayName: 'Timer',
  component: TimerWidget,
  defaultState: () => ({
    mode: 'pomodoro',
    status: 'idle',
    remainingSeconds: initialSeconds,
    targetSeconds: initialSeconds,
    sessionHistory: [],
    currentSessionCount: 0,
    ...defaultTimerSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    mode: 'pomodoro',
    status: 'idle',
    remainingSeconds: initialSeconds,
    targetSeconds: initialSeconds,
    sessionHistory: [],
    currentSessionCount: 0,
    ...defaultTimerSettings,
    ...(data as Partial<TimerState>),
  }),
  minWidth: 220,
  minHeight: 280,
  defaultWidth: 260,
  defaultHeight: 320,
  provides: [timerStatusContractV1, timerHistoryContractV1],
  settingsSchema,
})

export type { TimerState, TimerSession, TimerMode, TimerStatus } from './types'
export { defaultTimerSettings } from './types'
