<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, habitsContractV1, habitsStatsContractV1, truncate } from '@boardkit/core'
import { BkButton, BkIcon, BkCheckbox, BkInput } from '@boardkit/ui'
import type { HabitTrackerState, Habit } from './types'
import { habitColors } from './types'
import type { PublicHabitList, PublicHabitStats } from '@boardkit/core'

interface Props {
  context: ModuleContext<HabitTrackerState>
}

const props = defineProps<Props>()

// Local state
const newHabitName = ref('')
const isAddingHabit = ref(false)

// Computed properties
const habits = computed(() => props.context.state.habits || [])
const showStreaks = computed(() => props.context.state.showStreaks)
const showCalendar = computed(() => props.context.state.showCalendar)
const calendarDays = computed(() => props.context.state.calendarDays)

const today = computed(() => new Date().toISOString().split('T')[0])

// Generate last N days for calendar
const calendarDates = computed(() => {
  const dates: string[] = []
  const now = new Date()
  for (let i = calendarDays.value - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
})

// Helper functions
function getCompletionForDate(habit: Habit, date: string): boolean {
  return habit.completions?.some((c) => c.date === date && c.completed) ?? false
}

function calculateStreak(habit: Habit): number {
  if (!habit.completions || habit.completions.length === 0) return 0

  let streak = 0
  const now = new Date()
  const sortedDates = habit.completions
    .filter((c) => c.completed)
    .map((c) => c.date)
    .sort()
    .reverse()

  if (sortedDates.length === 0) return 0

  // Check if completed today or yesterday (streak continues)
  const todayStr = now.toISOString().split('T')[0]
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let checkDate: Date
  if (sortedDates[0] === todayStr) {
    checkDate = now
    streak = 1
  } else if (sortedDates[0] === yesterdayStr) {
    checkDate = yesterday
    streak = 1
  } else {
    return 0
  }

  // Count consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(checkDate)
    prev.setDate(prev.getDate() - 1)
    const prevStr = prev.toISOString().split('T')[0]

    if (sortedDates[i] === prevStr) {
      streak++
      checkDate = prev
    } else {
      break
    }
  }

  return streak
}

function calculateLongestStreak(habit: Habit): number {
  if (!habit.completions || habit.completions.length === 0) return 0

  const completedDates = habit.completions
    .filter((c) => c.completed)
    .map((c) => c.date)
    .sort()

  if (completedDates.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1])
    const curr = new Date(completedDates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

function calculateCompletionRate(habit: Habit): number {
  if (!habit.completions || habit.completions.length === 0) return 0

  // Last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const recentCompletions = habit.completions.filter(
    (c) => c.date >= thirtyDaysAgoStr && c.completed
  )

  return Math.round((recentCompletions.length / 30) * 100)
}

function isCompletedToday(habit: Habit): boolean {
  return getCompletionForDate(habit, today.value)
}

// Actions
function toggleHabitToday(habitId: string) {
  const habitIndex = habits.value.findIndex((h) => h.id === habitId)
  if (habitIndex === -1) return

  const habit = habits.value[habitIndex]
  const todayStr = today.value
  const completionIndex = habit.completions?.findIndex((c) => c.date === todayStr) ?? -1

  const newCompletions = [...(habit.completions || [])]
  let isCompleting = true

  if (completionIndex >= 0) {
    // Toggle existing completion
    isCompleting = !newCompletions[completionIndex].completed
    newCompletions[completionIndex] = {
      ...newCompletions[completionIndex],
      completed: isCompleting,
    }
  } else {
    // Add new completion
    newCompletions.push({ date: todayStr, completed: true })
  }

  const newHabits = [...habits.value]
  newHabits[habitIndex] = { ...habit, completions: newCompletions }

  const label = isCompleting
    ? `Completed: ${truncate(habit.name, 30)}`
    : `Unmarked: ${truncate(habit.name, 30)}`

  props.context.updateState(
    { habits: newHabits },
    {
      captureHistory: true,
      historyLabel: label,
    }
  )
}

function addHabit() {
  if (!newHabitName.value.trim()) return

  const name = newHabitName.value.trim()
  const newHabit: Habit = {
    id: crypto.randomUUID(),
    name,
    icon: 'activity',
    color: habitColors[habits.value.length % habitColors.length],
    completions: [],
    createdAt: new Date().toISOString(),
  }

  props.context.updateState(
    { habits: [...habits.value, newHabit] },
    {
      captureHistory: true,
      historyLabel: `Added habit: ${truncate(name, 30)}`,
    }
  )

  newHabitName.value = ''
  isAddingHabit.value = false
}

function removeHabit(habitId: string) {
  const habit = habits.value.find((h) => h.id === habitId)

  props.context.updateState(
    { habits: habits.value.filter((h) => h.id !== habitId) },
    {
      captureHistory: true,
      historyLabel: `Removed habit: ${truncate(habit?.name, 30)}`,
    }
  )
}

// Stats calculations
const todayStats = computed(() => {
  const total = habits.value.length
  const completed = habits.value.filter((h) => isCompletedToday(h)).length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, rate }
})

const bestHabit = computed(() => {
  if (habits.value.length === 0) return null
  return habits.value.reduce((best, current) => {
    const currentStreak = calculateStreak(current)
    const bestStreak = calculateStreak(best)
    return currentStreak > bestStreak ? current : best
  })
})

// Data sharing - Habits contract
useProvideData(props.context, habitsContractV1, {
  project: (state): PublicHabitList => ({
    widgetId: props.context.widgetId,
    title: state.title || 'Habits',
    totalHabits: (state.habits || []).length,
    habits: (state.habits || []).map((h) => ({
      id: h.id,
      name: h.name,
      currentStreak: calculateStreak(h),
      longestStreak: calculateLongestStreak(h),
      completedToday: isCompletedToday(h),
      completionRate: calculateCompletionRate(h),
    })),
  }),
})

// Data sharing - Stats contract
useProvideData(props.context, habitsStatsContractV1, {
  project: (state): PublicHabitStats => {
    const habitsList = state.habits || []
    const completedTodayCount = habitsList.filter((h) => isCompletedToday(h)).length
    const streaks = habitsList.map((h) => calculateStreak(h))
    const avgStreak = streaks.length > 0
      ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
      : 0

    // Week completions
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    let weekCompletions = 0
    habitsList.forEach((h) => {
      weekCompletions += (h.completions || []).filter(
        (c) => c.date >= weekAgoStr && c.completed
      ).length
    })

    const best = bestHabit.value
    const bestStreak = best ? calculateStreak(best) : 0

    return {
      widgetId: props.context.widgetId,
      totalHabits: habitsList.length,
      completedToday: completedTodayCount,
      todayCompletionRate: habitsList.length > 0
        ? Math.round((completedTodayCount / habitsList.length) * 100)
        : 0,
      averageStreak: avgStreak,
      totalCompletionsThisWeek: weekCompletions,
      bestHabit: best && bestStreak > 0 ? { name: best.name, streak: bestStreak } : null,
    }
  },
})
</script>

<template>
  <div class="habit-tracker h-full flex flex-col p-3 gap-3 overflow-hidden">
    <!-- Header with stats -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-foreground">
        {{ todayStats.completed }}/{{ todayStats.total }}
      </span>
      <span class="text-xs text-muted-foreground">
        {{ todayStats.rate }}% today
      </span>
    </div>

    <!-- Habits list -->
    <div class="flex-1 overflow-y-auto space-y-2">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="flex items-center gap-2 group"
      >
        <!-- Checkbox -->
        <BkCheckbox
          :model-value="isCompletedToday(habit)"
          @update:model-value="toggleHabitToday(habit.id)"
        />

        <!-- Name -->
        <span
          class="flex-1 text-sm truncate"
          :class="isCompletedToday(habit) ? 'text-muted-foreground line-through' : 'text-foreground'"
        >
          {{ habit.name }}
        </span>

        <!-- Streak badge -->
        <span
          v-if="showStreaks && calculateStreak(habit) > 0"
          class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5"
        >
          <BkIcon icon="flame" :size="10" />
          {{ calculateStreak(habit) }}
        </span>

        <!-- Delete button -->
        <button
          class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          @click="removeHabit(habit.id)"
        >
          <BkIcon icon="x" :size="14" />
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="habits.length === 0"
        class="text-center text-sm text-muted-foreground py-4"
      >
        No habits yet. Add one below!
      </div>
    </div>

    <!-- Mini calendar -->
    <div
      v-if="showCalendar && habits.length > 0"
      class="space-y-1"
    >
      <div class="grid gap-0.5" :style="{ gridTemplateColumns: `repeat(${calendarDays}, 1fr)` }">
        <div
          v-for="date in calendarDates"
          :key="date"
          class="aspect-square rounded-sm flex items-center justify-center text-xs"
          :class="[
            habits.every((h) => getCompletionForDate(h, date))
              ? 'bg-green-500 text-white'
              : habits.some((h) => getCompletionForDate(h, date))
                ? 'bg-primary/30'
                : 'bg-muted',
            date === today ? 'ring-1 ring-primary' : '',
          ]"
          :title="date"
        >
          {{ new Date(date).getDate() }}
        </div>
      </div>
    </div>

    <!-- Add habit -->
    <div v-if="isAddingHabit" class="flex gap-2">
      <BkInput
        v-model="newHabitName"
        placeholder="Habit name"
        size="sm"
        class="flex-1"
        @keyup.enter="addHabit"
        @keyup.escape="isAddingHabit = false"
      />
      <BkButton size="sm" @click="addHabit">
        Add
      </BkButton>
    </div>

    <BkButton
      v-else
      variant="ghost"
      size="sm"
      class="w-full"
      @click="isAddingHabit = true"
    >
      <BkIcon icon="plus" :size="14" />
      Add habit
    </BkButton>
  </div>
</template>
