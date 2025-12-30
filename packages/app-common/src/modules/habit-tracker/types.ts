/**
 * Habit Tracker Module Types
 *
 * Daily habit tracking with streaks and calendar view.
 */

export interface HabitCompletion {
  date: string
  completed: boolean
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  completions: HabitCompletion[]
  createdAt: string
}

export type CalendarDays = 7 | 14 | 30
export type StartOfWeek = 'sunday' | 'monday'

export interface HabitTrackerState {
  // Core state
  title: string
  habits: Habit[]

  // Settings
  showStreaks: boolean
  showCalendar: boolean
  calendarDays: CalendarDays
  startOfWeek: StartOfWeek
}

export const defaultHabitTrackerSettings: Omit<HabitTrackerState, 'title' | 'habits'> = {
  showStreaks: true,
  showCalendar: true,
  calendarDays: 7,
  startOfWeek: 'monday',
}

export const habitColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export const habitIcons = [
  'activity',
  'book',
  'coffee',
  'dumbbell',
  'heart',
  'moon',
  'pen',
  'smile',
  'sun',
  'zap',
]
