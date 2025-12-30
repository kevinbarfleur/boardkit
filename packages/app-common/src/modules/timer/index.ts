import { defineModule, timerStatusContractV1, timerHistoryContractV1 } from '@boardkit/core'
import TimerWidget from './TimerWidget.vue'
import type { TimerState } from './types'
import { defaultTimerSettings } from './types'

const initialSeconds = defaultTimerSettings.pomodoroWorkMinutes * 60

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
})

export type { TimerState, TimerSession, TimerMode, TimerStatus } from './types'
export { defaultTimerSettings } from './types'
