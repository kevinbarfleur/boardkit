/**
 * Timer Module Types
 *
 * Pomodoro timer with session tracking.
 */

export type TimerMode = 'pomodoro' | 'free'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'break'

export interface TimerSession {
  id: string
  mode: TimerMode
  duration: number
  completedAt: string
  type: 'work' | 'break'
}

export interface TimerState {
  // Core state
  mode: TimerMode
  status: TimerStatus
  remainingSeconds: number
  targetSeconds: number
  sessionHistory: TimerSession[]
  currentSessionCount: number

  // Settings
  pomodoroWorkMinutes: number
  pomodoroBreakMinutes: number
  pomodoroLongBreakMinutes: number
  sessionsUntilLongBreak: number
  soundEnabled: boolean
  soundVolume: number
  autoStartBreaks: boolean
  autoStartWork: boolean
  showHistory: boolean
  freeTimerMinutes: number
}

export const defaultTimerSettings: Omit<
  TimerState,
  'mode' | 'status' | 'remainingSeconds' | 'targetSeconds' | 'sessionHistory' | 'currentSessionCount'
> = {
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  sessionsUntilLongBreak: 4,
  soundEnabled: true,
  soundVolume: 50,
  autoStartBreaks: false,
  autoStartWork: false,
  showHistory: true,
  freeTimerMinutes: 25,
}
