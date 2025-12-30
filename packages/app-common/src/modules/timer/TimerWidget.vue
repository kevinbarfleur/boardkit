<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, timerStatusContractV1, timerHistoryContractV1 } from '@boardkit/core'
import { BkButton, BkIcon, BkSelect } from '@boardkit/ui'
import type { TimerState, TimerSession, TimerStatus as TStatus, TimerMode } from './types'
import type { PublicTimerStatus, PublicTimerHistory } from '@boardkit/core'

interface Props {
  context: ModuleContext<TimerState>
}

const props = defineProps<Props>()

// Audio context for notifications
const audioContext = ref<AudioContext | null>(null)

// Interval reference
let timerInterval: number | null = null

// Computed properties
const mode = computed(() => props.context.state.mode)
const status = computed(() => props.context.state.status)
const remainingSeconds = computed(() => props.context.state.remainingSeconds)
const targetSeconds = computed(() => props.context.state.targetSeconds)
const sessionHistory = computed(() => props.context.state.sessionHistory || [])
const currentSessionCount = computed(() => props.context.state.currentSessionCount)
const showHistory = computed(() => props.context.state.showHistory)

const isRunning = computed(() => status.value === 'running')
const isPaused = computed(() => status.value === 'paused')
const isBreak = computed(() => status.value === 'break')
const isIdle = computed(() => status.value === 'idle')

const progressPercent = computed(() => {
  if (targetSeconds.value === 0) return 0
  const elapsed = targetSeconds.value - remainingSeconds.value
  return Math.round((elapsed / targetSeconds.value) * 100)
})

const displayTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const todaySessions = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return sessionHistory.value.filter((s) => s.completedAt.startsWith(today))
})

const modeOptions = [
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'free', label: 'Free Timer' },
]

// Methods
function initAudio() {
  if (!audioContext.value && typeof AudioContext !== 'undefined') {
    audioContext.value = new AudioContext()
  }
}

function playNotification() {
  if (!props.context.state.soundEnabled || !audioContext.value) return

  try {
    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = props.context.state.soundVolume / 100

    oscillator.start()
    oscillator.stop(audioContext.value.currentTime + 0.3)
  } catch {
    // Audio playback failed, ignore
  }
}

function getInitialSeconds(): number {
  if (mode.value === 'pomodoro') {
    return props.context.state.pomodoroWorkMinutes * 60
  }
  return props.context.state.freeTimerMinutes * 60
}

function getBreakSeconds(): number {
  const sessionsUntil = props.context.state.sessionsUntilLongBreak
  if (currentSessionCount.value > 0 && currentSessionCount.value % sessionsUntil === 0) {
    return props.context.state.pomodoroLongBreakMinutes * 60
  }
  return props.context.state.pomodoroBreakMinutes * 60
}

function start() {
  initAudio()

  if (isIdle.value || remainingSeconds.value === 0) {
    // Fresh start
    const seconds = getInitialSeconds()
    props.context.updateState({
      status: 'running',
      remainingSeconds: seconds,
      targetSeconds: seconds,
    })
  } else {
    // Resume
    props.context.updateState({ status: 'running' })
  }

  startInterval()
}

function pause() {
  props.context.updateState({ status: 'paused' })
  stopInterval()
}

function reset() {
  stopInterval()
  const seconds = getInitialSeconds()
  props.context.updateState({
    status: 'idle',
    remainingSeconds: seconds,
    targetSeconds: seconds,
  })
}

function skip() {
  stopInterval()
  completeSession()
}

function completeSession() {
  const session: TimerSession = {
    id: crypto.randomUUID(),
    mode: mode.value,
    duration: targetSeconds.value,
    completedAt: new Date().toISOString(),
    type: isBreak.value ? 'break' : 'work',
  }

  const newHistory = [...sessionHistory.value, session]
  const newSessionCount = isBreak.value ? currentSessionCount.value : currentSessionCount.value + 1

  playNotification()

  if (mode.value === 'pomodoro' && !isBreak.value) {
    // Start break
    const breakSeconds = getBreakSeconds()
    props.context.updateState({
      status: props.context.state.autoStartBreaks ? 'running' : 'break',
      remainingSeconds: breakSeconds,
      targetSeconds: breakSeconds,
      sessionHistory: newHistory,
      currentSessionCount: newSessionCount,
    })

    if (props.context.state.autoStartBreaks) {
      startInterval()
    }
  } else if (mode.value === 'pomodoro' && isBreak.value) {
    // Break finished, back to work
    const workSeconds = props.context.state.pomodoroWorkMinutes * 60
    props.context.updateState({
      status: props.context.state.autoStartWork ? 'running' : 'idle',
      remainingSeconds: workSeconds,
      targetSeconds: workSeconds,
      sessionHistory: newHistory,
    })

    if (props.context.state.autoStartWork) {
      startInterval()
    }
  } else {
    // Free timer completed
    const freeSeconds = props.context.state.freeTimerMinutes * 60
    props.context.updateState({
      status: 'idle',
      remainingSeconds: freeSeconds,
      targetSeconds: freeSeconds,
      sessionHistory: newHistory,
    })
  }
}

function tick() {
  if (remainingSeconds.value <= 0) {
    stopInterval()
    completeSession()
    return
  }

  props.context.updateState({
    remainingSeconds: remainingSeconds.value - 1,
  })
}

function startInterval() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = window.setInterval(tick, 1000)
}

function stopInterval() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function setMode(newMode: TimerMode) {
  stopInterval()
  const seconds = newMode === 'pomodoro'
    ? props.context.state.pomodoroWorkMinutes * 60
    : props.context.state.freeTimerMinutes * 60

  props.context.updateState({
    mode: newMode,
    status: 'idle',
    remainingSeconds: seconds,
    targetSeconds: seconds,
    currentSessionCount: 0,
  })
}

// Lifecycle
onMounted(() => {
  if (isRunning.value) {
    startInterval()
  }
})

onUnmounted(() => {
  stopInterval()
})

// Watch for external status changes
watch(status, (newStatus) => {
  if (newStatus === 'running' && !timerInterval) {
    startInterval()
  } else if (newStatus !== 'running' && timerInterval) {
    stopInterval()
  }
})

// Data sharing - Status contract
useProvideData(props.context, timerStatusContractV1, {
  project: (state): PublicTimerStatus => ({
    widgetId: props.context.widgetId,
    mode: state.mode,
    status: state.status,
    remainingSeconds: state.remainingSeconds,
    targetSeconds: state.targetSeconds,
    progressPercent: state.targetSeconds > 0
      ? Math.round(((state.targetSeconds - state.remainingSeconds) / state.targetSeconds) * 100)
      : 0,
    isBreak: state.status === 'break',
  }),
})

// Data sharing - History contract
useProvideData(props.context, timerHistoryContractV1, {
  project: (state): PublicTimerHistory => {
    const today = new Date().toISOString().split('T')[0]
    const todaySessionsList = (state.sessionHistory || []).filter((s) =>
      s.completedAt.startsWith(today)
    )

    return {
      widgetId: props.context.widgetId,
      sessions: (state.sessionHistory || []).map(({ id, duration, completedAt, type }) => ({
        id,
        duration,
        completedAt,
        type,
      })),
      totalWorkSeconds: (state.sessionHistory || [])
        .filter((s) => s.type === 'work')
        .reduce((sum, s) => sum + s.duration, 0),
      totalBreakSeconds: (state.sessionHistory || [])
        .filter((s) => s.type === 'break')
        .reduce((sum, s) => sum + s.duration, 0),
      sessionsToday: todaySessionsList.length,
      workSessionsToday: todaySessionsList.filter((s) => s.type === 'work').length,
    }
  },
})
</script>

<template>
  <div class="timer h-full flex flex-col items-center justify-center p-4 gap-4">
    <!-- Mode selector -->
    <div class="w-full max-w-32">
      <BkSelect
        :model-value="mode"
        :options="modeOptions"
        size="sm"
        @update:model-value="setMode($event as TimerMode)"
      />
    </div>

    <!-- Timer display -->
    <div class="relative flex items-center justify-center">
      <!-- Progress ring -->
      <svg
        class="w-32 h-32 -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          class="text-muted"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="339.292"
          :stroke-dashoffset="339.292 * (1 - progressPercent / 100)"
          :class="isBreak ? 'text-green-500' : 'text-primary'"
          class="transition-all duration-300"
        />
      </svg>

      <!-- Time display -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-foreground font-mono">{{ displayTime }}</span>
        <span
          v-if="isBreak"
          class="text-xs text-green-500"
        >Break</span>
        <span
          v-else-if="mode === 'pomodoro'"
          class="text-xs text-muted-foreground"
        >
          Session {{ currentSessionCount + 1 }}
        </span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex gap-2">
      <BkButton
        v-if="!isRunning"
        variant="default"
        size="sm"
        @click="start"
      >
        <BkIcon icon="play" :size="16" />
        {{ isPaused || isBreak ? 'Resume' : 'Start' }}
      </BkButton>

      <BkButton
        v-if="isRunning"
        variant="secondary"
        size="sm"
        @click="pause"
      >
        <BkIcon icon="pause" :size="16" />
        Pause
      </BkButton>

      <BkButton
        v-if="!isIdle"
        variant="ghost"
        size="sm"
        @click="reset"
      >
        <BkIcon icon="rotate-ccw" :size="16" />
      </BkButton>

      <BkButton
        v-if="isRunning || isPaused || isBreak"
        variant="ghost"
        size="sm"
        @click="skip"
      >
        <BkIcon icon="skip-forward" :size="16" />
      </BkButton>
    </div>

    <!-- Today's sessions -->
    <div
      v-if="showHistory && todaySessions.length > 0"
      class="text-xs text-muted-foreground"
    >
      Today: {{ todaySessions.filter((s) => s.type === 'work').length }} work sessions
    </div>
  </div>
</template>
