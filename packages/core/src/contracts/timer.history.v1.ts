/**
 * Timer History Contract v1
 *
 * Provides read-only access to timer session history.
 */

import type { DataContract } from '../types/dataContract'

export interface TimerSessionRecord {
  id: string
  duration: number
  completedAt: string
  type: 'work' | 'break'
}

export interface PublicTimerHistory {
  widgetId: string
  sessions: TimerSessionRecord[]
  totalWorkSeconds: number
  totalBreakSeconds: number
  sessionsToday: number
  workSessionsToday: number
}

export const timerHistoryContractV1: DataContract<PublicTimerHistory> = {
  id: 'boardkit.timer.history.v1',
  name: 'Timer History',
  description: 'Completed timer sessions history',
  version: '1.0.0',
  providerId: 'timer',
}
