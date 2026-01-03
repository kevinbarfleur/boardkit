/**
 * Timer History Contract v1
 *
 * Provides read-only access to timer session history.
 * Includes task-level time tracking aggregation.
 */

import type { DataContract } from '../types/dataContract'

export type SessionType = 'work' | 'short-break' | 'long-break' | 'countdown' | 'stopwatch'

export interface TimerSessionRecord {
  id: string
  mode: 'pomodoro' | 'countdown' | 'stopwatch'
  type: SessionType
  /** Duration in seconds */
  duration: number
  /** ISO timestamp of completion */
  completedAt: string
  /** Linked task reference, if any */
  taskRef?: {
    widgetId: string
    taskId: string
    taskLabel: string
  }
  /** Was this session skipped? */
  skipped?: boolean
}

export interface TaskTimeEntry {
  taskId: string
  taskLabel: string
  widgetId: string
  /** Total time spent on this task in seconds */
  totalSeconds: number
  /** Number of sessions spent on this task */
  sessionCount: number
}

export interface PublicTimerHistory {
  widgetId: string
  /** All session records */
  sessions: TimerSessionRecord[]
  /** Total work time in seconds (all time) */
  totalWorkSeconds: number
  /** Total break time in seconds (all time) */
  totalBreakSeconds: number
  /** Number of sessions completed today */
  sessionsToday: number
  /** Number of work sessions completed today */
  workSessionsToday: number
  /** Total work time today in seconds */
  workSecondsToday: number
  /** Time breakdown by linked task */
  taskTimeEntries: TaskTimeEntry[]
}

export const timerHistoryContractV1: DataContract<PublicTimerHistory> = {
  id: 'boardkit.timer.history.v1',
  name: 'Timer History',
  description: 'Completed timer sessions with task-level time tracking',
  version: '1.0.0',
  providerId: 'timer',
}
