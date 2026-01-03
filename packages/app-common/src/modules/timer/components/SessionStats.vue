<script setup lang="ts">
/**
 * SessionStats - Compact display of today's timer stats
 */

import { computed } from 'vue'
import { BkIcon } from '@boardkit/ui'
import type { TimerSession } from '../types'

interface Props {
  /** All sessions from history */
  sessions: TimerSession[]
}

const props = defineProps<Props>()

// Get today's date string for filtering
const today = computed(() => {
  const now = new Date()
  return now.toISOString().split('T')[0]
})

// Filter sessions completed today
const todaySessions = computed(() => {
  return props.sessions.filter((session) => {
    if (!session.completedAt) return false
    return session.completedAt.startsWith(today.value)
  })
})

// Count work sessions (not breaks, not skipped)
const workSessionCount = computed(() => {
  return todaySessions.value.filter(
    (s) => s.type === 'work' || s.type === 'countdown' || s.type === 'stopwatch'
  ).length
})

// Total focused time in seconds
const totalFocusedSeconds = computed(() => {
  return todaySessions.value
    .filter((s) => s.type === 'work' || s.type === 'countdown' || s.type === 'stopwatch')
    .reduce((total, session) => total + (session.duration || 0), 0)
})

// Format duration
const formattedDuration = computed(() => {
  const seconds = totalFocusedSeconds.value
  if (seconds === 0) return '0m'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

const hasStats = computed(() => {
  return workSessionCount.value > 0 || totalFocusedSeconds.value > 0
})
</script>

<template>
  <div
    v-if="hasStats"
    class="session-stats flex items-center justify-center gap-4 text-xs text-muted-foreground"
  >
    <div class="flex items-center gap-1.5">
      <BkIcon icon="zap" :size="12" />
      <span>{{ workSessionCount }} session{{ workSessionCount !== 1 ? 's' : '' }}</span>
    </div>
    <div class="w-px h-3 bg-border" />
    <div class="flex items-center gap-1.5">
      <BkIcon icon="clock" :size="12" />
      <span>{{ formattedDuration }} focused</span>
    </div>
  </div>
  <div
    v-else
    class="session-stats text-center text-xs text-muted-foreground"
  >
    No sessions today
  </div>
</template>
