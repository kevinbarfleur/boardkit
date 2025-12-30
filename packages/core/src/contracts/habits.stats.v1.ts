/**
 * Habits Stats Contract v1
 *
 * Provides aggregated habit statistics.
 */

import type { DataContract } from '../types/dataContract'

export interface PublicHabitStats {
  widgetId: string
  totalHabits: number
  completedToday: number
  todayCompletionRate: number
  averageStreak: number
  totalCompletionsThisWeek: number
  bestHabit: { name: string; streak: number } | null
}

export const habitsStatsContractV1: DataContract<PublicHabitStats> = {
  id: 'boardkit.habits.stats.v1',
  name: 'Habit Stats',
  description: 'Aggregated habit statistics',
  version: '1.0.0',
  providerId: 'habit-tracker',
}
