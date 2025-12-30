/**
 * Timer Status Contract v1
 *
 * Provides read-only access to current timer status.
 */

import type { DataContract } from '../types/dataContract'

export type TimerMode = 'pomodoro' | 'free'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'break'

export interface PublicTimerStatus {
  widgetId: string
  mode: TimerMode
  status: TimerStatus
  remainingSeconds: number
  targetSeconds: number
  progressPercent: number
  isBreak: boolean
}

export const timerStatusContractV1: DataContract<PublicTimerStatus> = {
  id: 'boardkit.timer.status.v1',
  name: 'Timer Status',
  description: 'Current timer status including mode and remaining time',
  version: '1.0.0',
  providerId: 'timer',
}
