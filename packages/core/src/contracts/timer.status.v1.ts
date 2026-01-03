/**
 * Timer Status Contract v1
 *
 * Provides read-only access to current timer status.
 * Supports all timer modes: Pomodoro, Countdown, Stopwatch
 */

import type { DataContract } from '../types/dataContract'

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'break'

export interface LinkedTaskInfo {
  widgetId: string
  taskId: string
  taskLabel: string
  sourceType: 'todo' | 'kanban'
}

export interface PublicTimerStatus {
  widgetId: string
  mode: TimerMode
  status: TimerStatus
  /** Display seconds (remaining for countdown/pomodoro, elapsed for stopwatch) */
  displaySeconds: number
  /** Target seconds (countdown/pomodoro only, null for stopwatch) */
  targetSeconds: number | null
  /** Progress percentage 0-100 (countdown/pomodoro only, 0 for stopwatch) */
  progressPercent: number
  /** Is currently in break mode (pomodoro only) */
  isBreak: boolean
  /** Currently linked task info, if any */
  linkedTask: LinkedTaskInfo | null
}

export const timerStatusContractV1: DataContract<PublicTimerStatus> = {
  id: 'boardkit.timer.status.v1',
  name: 'Timer Status',
  description: 'Current timer status including mode, time, and linked task',
  version: '1.0.0',
  providerId: 'timer',
}
