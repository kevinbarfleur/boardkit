/**
 * Habits Contract v1
 *
 * Provides read-only access to habits list with streaks.
 */

import type { DataContract } from '../types/dataContract'

export interface PublicHabit {
  id: string
  name: string
  currentStreak: number
  longestStreak: number
  completedToday: boolean
  completionRate: number
}

export interface PublicHabitList {
  widgetId: string
  title: string
  habits: PublicHabit[]
  totalHabits: number
}

export const habitsContractV1: DataContract<PublicHabitList> = {
  id: 'boardkit.habits.v1',
  name: 'Habit List',
  description: 'Habits with streaks and today status',
  version: '1.0.0',
  providerId: 'habit-tracker',
}
