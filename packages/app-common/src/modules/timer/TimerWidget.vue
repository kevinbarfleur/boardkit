<script setup lang="ts">
/**
 * Timer Widget v2
 *
 * Multi-mode timer with task linking support.
 * Modes: Pomodoro, Countdown, Stopwatch
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, timerStatusContractV1, timerHistoryContractV1} from '@boardkit/core'
import type { PublicTimerStatus, PublicTimerHistory, TaskTimeEntry } from '@boardkit/core'
import { BkIcon, BkButton, BkButtonGroup } from '@boardkit/ui'
import type { TimerState, TimerMode, TimerSession, SessionType, LapRecord, PomodoroPhase } from './types'
import { defaultTimerSettings } from './types'

interface Props {
  context: ModuleContext<TimerState>
}

const props = defineProps<Props>()

// === Timer Interval ===
const timerInterval = ref<number | null>(null)

// === Computed State (following TodoWidget pattern) ===
const mode = computed(() => props.context.state.mode)
const status = computed(() => props.context.state.status)
const currentSeconds = computed(() => props.context.state.currentSeconds)
const targetSeconds = computed(() => props.context.state.targetSeconds)
const pomodoroPhase = computed(() => props.context.state.pomodoroPhase)
const pomodoroSessionCount = computed(() => props.context.state.pomodoroSessionCount)
const laps = computed(() => props.context.state.laps || [])
const linkedTask = computed(() => props.context.state.linkedTask)
const sessionHistory = computed(() => props.context.state.sessionHistory || [])

// Settings with defaults
const showLinkedTask = computed(() => props.context.state.showLinkedTask ?? defaultTimerSettings.showLinkedTask)
const showSessionHistory = computed(() => props.context.state.showSessionHistory ?? defaultTimerSettings.showSessionHistory)
const compactMode = computed(() => props.context.state.compactMode ?? defaultTimerSettings.compactMode)
const countdownPresets = computed(() => props.context.state.countdownPresets ?? defaultTimerSettings.countdownPresets)
const maxLapsDisplayed = computed(() => props.context.state.maxLapsDisplayed ?? defaultTimerSettings.maxLapsDisplayed)
const pomodoroWorkMinutes = computed(() => props.context.state.pomodoroWorkMinutes ?? defaultTimerSettings.pomodoroWorkMinutes)
const pomodoroShortBreakMinutes = computed(() => props.context.state.pomodoroShortBreakMinutes ?? defaultTimerSettings.pomodoroShortBreakMinutes)
const pomodoroLongBreakMinutes = computed(() => props.context.state.pomodoroLongBreakMinutes ?? defaultTimerSettings.pomodoroLongBreakMinutes)
const sessionsUntilLongBreak = computed(() => props.context.state.sessionsUntilLongBreak ?? defaultTimerSettings.sessionsUntilLongBreak)
const autoStartBreaks = computed(() => props.context.state.autoStartBreaks ?? defaultTimerSettings.autoStartBreaks)
const autoStartWork = computed(() => props.context.state.autoStartWork ?? defaultTimerSettings.autoStartWork)
const defaultCountdownMinutes = computed(() => props.context.state.defaultCountdownMinutes ?? defaultTimerSettings.defaultCountdownMinutes)
const soundEnabled = computed(() => props.context.state.soundEnabled ?? defaultTimerSettings.soundEnabled)
const soundVolume = computed(() => props.context.state.soundVolume ?? defaultTimerSettings.soundVolume)
const notificationSound = computed(() => props.context.state.notificationSound ?? defaultTimerSettings.notificationSound)

// Derived state
const isRunning = computed(() => status.value === 'running')
const isPaused = computed(() => status.value === 'paused')
const isBreak = computed(() => status.value === 'break')
const isIdle = computed(() => status.value === 'idle')
const isStopwatch = computed(() => mode.value === 'stopwatch')
const isCountdown = computed(() => mode.value === 'countdown')
const isPomodoro = computed(() => mode.value === 'pomodoro')

// Progress percent
const progressPercent = computed(() => {
  if (isStopwatch.value) return 0
  if (targetSeconds.value === 0) return 0
  const elapsed = targetSeconds.value - currentSeconds.value
  return Math.round((elapsed / targetSeconds.value) * 100)
})

// Display time formatted
const displayTime = computed(() => {
  const totalSeconds = currentSeconds.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0 || isStopwatch.value) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Mode options for button group
const modeOptions = [
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'countdown', label: 'Countdown' },
  { value: 'stopwatch', label: 'Stopwatch' },
]

// Status label
const statusLabel = computed(() => {
  if (isBreak.value) {
    return pomodoroPhase.value === 'long-break' ? 'Long Break' : 'Break'
  }
  if (isPomodoro.value && !isIdle.value) {
    return `Session ${pomodoroSessionCount.value + 1}`
  }
  return ''
})

// Progress color
const progressColor = computed(() => {
  if (isBreak.value) return 'text-green-500'
  return 'text-primary'
})

// SVG circle calculations
const circleSize = 140
const strokeWidth = 6
const radius = (circleSize - strokeWidth) / 2
const circumference = 2 * Math.PI * radius
const strokeDashoffset = computed(() => {
  if (isStopwatch.value) return circumference
  return circumference * (1 - progressPercent.value / 100)
})

// === Helpers ===

function getInitialSeconds(timerMode: TimerMode): number {
  if (timerMode === 'pomodoro') {
    return pomodoroWorkMinutes.value * 60
  }
  if (timerMode === 'countdown') {
    return defaultCountdownMinutes.value * 60
  }
  return 0
}

function getBreakSeconds(): number {
  const count = pomodoroSessionCount.value
  const until = sessionsUntilLongBreak.value
  if (count > 0 && count % until === 0) {
    return pomodoroLongBreakMinutes.value * 60
  }
  return pomodoroShortBreakMinutes.value * 60
}

function getSessionType(): SessionType {
  if (isStopwatch.value) return 'stopwatch'
  if (isCountdown.value) return 'countdown'
  if (isBreak.value) {
    const count = pomodoroSessionCount.value
    const until = sessionsUntilLongBreak.value
    if (count > 0 && count % until === 0) {
      return 'long-break'
    }
    return 'short-break'
  }
  return 'work'
}

function createSession(duration: number, skipped = false): TimerSession {
  return {
    id: nanoid(),
    mode: mode.value,
    type: getSessionType(),
    duration,
    completedAt: new Date().toISOString(),
    taskRef: linkedTask.value
      ? {
          widgetId: linkedTask.value.widgetId,
          taskId: linkedTask.value.taskId,
          taskLabel: linkedTask.value.taskLabel,
          sourceType: linkedTask.value.sourceType,
        }
      : undefined,
    skipped,
  }
}

// === Interval Management ===

function startInterval() {
  console.log('[Timer] startInterval called, existing interval:', timerInterval.value)
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = window.setInterval(tick, 1000)
  console.log('[Timer] New interval created:', timerInterval.value)
}

function stopInterval() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// === Tick Logic ===

function tick() {
  console.log('[Timer] tick called', {
    status: status.value,
    isStopwatch: isStopwatch.value,
    currentSeconds: currentSeconds.value,
  })
  if (isStopwatch.value) {
    props.context.updateState({
      currentSeconds: currentSeconds.value + 1,
    })
  } else {
    if (currentSeconds.value <= 0) {
      stopInterval()
      completeSession()
      return
    }
    props.context.updateState({
      currentSeconds: currentSeconds.value - 1,
    })
  }
}

// === Session Completion ===

function completeSession(skipped = false) {
  const actualDuration = isStopwatch.value
    ? currentSeconds.value
    : targetSeconds.value - currentSeconds.value

  const session = createSession(actualDuration, skipped)
  const newHistory = [...sessionHistory.value, session]

  if (soundEnabled.value) {
    playSound()
  }

  if (isPomodoro.value && !isBreak.value) {
    const newSessionCount = pomodoroSessionCount.value + 1
    const breakSeconds = getBreakSeconds()
    const until = sessionsUntilLongBreak.value
    const isLongBreak = newSessionCount % until === 0

    props.context.updateState({
      status: autoStartBreaks.value ? 'running' : 'break',
      currentSeconds: breakSeconds,
      targetSeconds: breakSeconds,
      startedAt: autoStartBreaks.value ? new Date().toISOString() : null,
      pomodoroSessionCount: newSessionCount,
      pomodoroPhase: isLongBreak ? 'long-break' : 'short-break',
      sessionHistory: newHistory,
    })

    if (autoStartBreaks.value) {
      startInterval()
    }
  } else if (isPomodoro.value && isBreak.value) {
    const workSeconds = pomodoroWorkMinutes.value * 60

    props.context.updateState({
      status: autoStartWork.value ? 'running' : 'idle',
      currentSeconds: workSeconds,
      targetSeconds: workSeconds,
      startedAt: autoStartWork.value ? new Date().toISOString() : null,
      pomodoroPhase: 'work',
      sessionHistory: newHistory,
    })

    if (autoStartWork.value) {
      startInterval()
    }
  } else if (isCountdown.value) {
    const countdownSeconds = defaultCountdownMinutes.value * 60

    props.context.updateState({
      status: 'idle',
      currentSeconds: countdownSeconds,
      targetSeconds: countdownSeconds,
      startedAt: null,
      sessionHistory: newHistory,
    })
  } else if (isStopwatch.value) {
    props.context.updateState({
      status: 'idle',
      startedAt: null,
      sessionHistory: newHistory,
    })
  }

  return session
}

// === Actions ===

function handleModeChange(value: string | string[]) {
  if (typeof value !== 'string') return
  const newMode = value as TimerMode

  stopInterval()

  const seconds = getInitialSeconds(newMode)

  props.context.updateState({
    mode: newMode,
    status: 'idle',
    currentSeconds: seconds,
    targetSeconds: seconds,
    startedAt: null,
    pomodoroSessionCount: 0,
    pomodoroPhase: 'work',
    laps: [],
  })
}

function handleStart() {
  console.log('[Timer] handleStart called', {
    mode: mode.value,
    status: status.value,
    isIdle: isIdle.value,
    isStopwatch: isStopwatch.value,
    currentSeconds: currentSeconds.value,
  })

  if (isIdle.value || (isStopwatch.value && currentSeconds.value === 0)) {
    const seconds = getInitialSeconds(mode.value)
    console.log('[Timer] Starting fresh, seconds:', seconds)
    props.context.updateState({
      status: 'running',
      currentSeconds: isStopwatch.value ? 0 : seconds,
      targetSeconds: isStopwatch.value ? 0 : seconds,
      startedAt: new Date().toISOString(),
      laps: isStopwatch.value ? [] : laps.value,
    })
    console.log('[Timer] After updateState, status:', props.context.state.status)
  } else {
    console.log('[Timer] Resuming')
    props.context.updateState({
      status: 'running',
      startedAt: new Date().toISOString(),
    })
    console.log('[Timer] After updateState, status:', props.context.state.status)
  }

  startInterval()
  console.log('[Timer] Interval started, timerInterval:', timerInterval.value)
}

function handlePause() {
  props.context.updateState({
    status: 'paused',
    startedAt: null,
  })
  stopInterval()
}

function handleReset() {
  stopInterval()

  const seconds = getInitialSeconds(mode.value)
  props.context.updateState({
    status: 'idle',
    currentSeconds: isStopwatch.value ? 0 : seconds,
    targetSeconds: isStopwatch.value ? 0 : seconds,
    startedAt: null,
    laps: [],
    pomodoroPhase: 'work',
  })
}

function handleSkip() {
  stopInterval()
  completeSession(true)
}

function handlePresetSelect(minutes: number) {
  if (isRunning.value) return

  const seconds = minutes * 60
  props.context.updateState({
    currentSeconds: seconds,
    targetSeconds: seconds,
  })
}

function handleRecordLap() {
  if (!isStopwatch.value || !isRunning.value) return

  const currentLaps = laps.value
  const lapNumber = currentLaps.length + 1
  const elapsedSeconds = currentSeconds.value
  const previousLap = currentLaps[currentLaps.length - 1]
  const splitSeconds = previousLap ? elapsedSeconds - previousLap.elapsedSeconds : elapsedSeconds

  const newLap: LapRecord = {
    id: nanoid(),
    number: lapNumber,
    elapsedSeconds,
    splitSeconds,
  }

  props.context.updateState({
    laps: [...currentLaps, newLap],
  })
}

// === Audio ===

let audioContext: AudioContext | null = null

function playSound() {
  if (!soundEnabled.value) return

  try {
    if (!audioContext && typeof AudioContext !== 'undefined') {
      audioContext = new AudioContext()
    }
    if (!audioContext) return

    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    const volume = soundVolume.value / 100
    const now = audioContext.currentTime

    gainNode.gain.setValueAtTime(volume, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    oscillator.start(now)
    oscillator.stop(now + 0.5)
  } catch {
    // Audio playback failed silently
  }
}

// === Stats ===

const todayStats = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessionHistory.value.filter((s) => s.completedAt.startsWith(today))

  const workSessions = todaySessions.filter(
    (s) => s.type === 'work' || s.type === 'countdown' || s.type === 'stopwatch'
  )

  return {
    sessionsTotal: todaySessions.length,
    workSessions: workSessions.length,
    workSeconds: workSessions.reduce((sum, s) => sum + s.duration, 0),
  }
})

const recentSessions = computed(() => {
  return [...sessionHistory.value].reverse().slice(0, 3)
})

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatSessionTime(session: TimerSession): string {
  const date = new Date(session.completedAt)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// === Lifecycle ===

onMounted(() => {
  if (isRunning.value) {
    startInterval()
  }
})

onUnmounted(() => {
  stopInterval()
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close()
    } catch {
      // Ignore close errors
    }
  }
})

// Watch status for interval management
watch(status, (newStatus) => {
  if (newStatus === 'running' && !timerInterval.value) {
    startInterval()
  } else if (newStatus !== 'running' && timerInterval.value) {
    stopInterval()
  }
})

// === Data Sharing ===

useProvideData(props.context, timerStatusContractV1, {
  project: (state): PublicTimerStatus => ({
    widgetId: props.context.widgetId,
    mode: state.mode,
    status: state.status,
    displaySeconds: state.currentSeconds,
    targetSeconds: state.mode === 'stopwatch' ? null : state.targetSeconds,
    progressPercent:
      state.mode === 'stopwatch' || state.targetSeconds === 0
        ? 0
        : Math.round(((state.targetSeconds - state.currentSeconds) / state.targetSeconds) * 100),
    isBreak: state.status === 'break',
    linkedTask: state.linkedTask
      ? {
          widgetId: state.linkedTask.widgetId,
          taskId: state.linkedTask.taskId,
          taskLabel: state.linkedTask.taskLabel,
          sourceType: state.linkedTask.sourceType,
        }
      : null,
  }),
})

useProvideData(props.context, timerHistoryContractV1, {
  project: (state): PublicTimerHistory => {
    const today = new Date().toISOString().split('T')[0]
    const todaySessionsList = (state.sessionHistory || []).filter((s) => s.completedAt.startsWith(today))

    const taskMap = new Map<string, TaskTimeEntry>()
    for (const session of state.sessionHistory || []) {
      if (!session.taskRef) continue
      const isWork = session.type === 'work' || session.type === 'countdown' || session.type === 'stopwatch'
      if (!isWork) continue

      const key = `${session.taskRef.widgetId}-${session.taskRef.taskId}`
      const existing = taskMap.get(key)
      if (existing) {
        existing.totalSeconds += session.duration
        existing.sessionCount += 1
      } else {
        taskMap.set(key, {
          taskId: session.taskRef.taskId,
          taskLabel: session.taskRef.taskLabel,
          widgetId: session.taskRef.widgetId,
          totalSeconds: session.duration,
          sessionCount: 1,
        })
      }
    }

    const isWorkSession = (type: string) => type === 'work' || type === 'countdown' || type === 'stopwatch'
    const isBreakSession = (type: string) => type === 'short-break' || type === 'long-break'

    const workSessions = (state.sessionHistory || []).filter((s) => isWorkSession(s.type))
    const breakSessions = (state.sessionHistory || []).filter((s) => isBreakSession(s.type))
    const todayWork = todaySessionsList.filter((s) => isWorkSession(s.type))

    return {
      widgetId: props.context.widgetId,
      sessions: (state.sessionHistory || []).map((s) => ({
        id: s.id,
        mode: s.mode,
        type: s.type,
        duration: s.duration,
        completedAt: s.completedAt,
        taskRef: s.taskRef
          ? {
              widgetId: s.taskRef.widgetId,
              taskId: s.taskRef.taskId,
              taskLabel: s.taskRef.taskLabel,
            }
          : undefined,
        skipped: s.skipped,
      })),
      totalWorkSeconds: workSessions.reduce((sum, s) => sum + s.duration, 0),
      totalBreakSeconds: breakSessions.reduce((sum, s) => sum + s.duration, 0),
      sessionsToday: todaySessionsList.length,
      workSessionsToday: todayWork.length,
      workSecondsToday: todayWork.reduce((sum, s) => sum + s.duration, 0),
      taskTimeEntries: Array.from(taskMap.values()),
    }
  },
})
</script>

<template>
  <div class="timer-widget h-full flex flex-col">
    <!-- Mode Selector -->
    <div class="px-3 pt-3 pb-2">
      <BkButtonGroup
        :model-value="mode"
        :options="modeOptions"
        size="sm"
        full-width
        :disabled="isRunning"
        @update:model-value="handleModeChange"
      />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 gap-4">
      <!-- Countdown Presets (countdown mode, idle state) -->
      <div
        v-if="isCountdown && isIdle"
        class="flex flex-wrap justify-center gap-1.5"
      >
        <button
          v-for="preset in countdownPresets"
          :key="preset.id"
          class="px-2.5 py-1 text-xs rounded-md border border-border hover:border-primary hover:text-primary transition-colors"
          @click="handlePresetSelect(preset.minutes)"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Timer Display -->
      <div class="relative flex items-center justify-center">
        <svg
          class="-rotate-90"
          :width="circleSize"
          :height="circleSize"
          :viewBox="`0 0 ${circleSize} ${circleSize}`"
        >
          <!-- Background circle -->
          <circle
            :cx="circleSize / 2"
            :cy="circleSize / 2"
            :r="radius"
            fill="none"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            class="text-muted"
          />
          <!-- Progress circle -->
          <circle
            v-if="!isStopwatch"
            :cx="circleSize / 2"
            :cy="circleSize / 2"
            :r="radius"
            fill="none"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            :class="progressColor"
            class="transition-all duration-300"
          />
        </svg>

        <!-- Time display -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold text-foreground font-mono tracking-tight">
            {{ displayTime }}
          </span>
          <span
            v-if="statusLabel"
            :class="isBreak ? 'text-green-500' : 'text-muted-foreground'"
            class="text-xs mt-0.5"
          >
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-2">
        <!-- Play/Resume -->
        <BkButton
          v-if="!isRunning"
          variant="default"
          size="sm"
          @click="handleStart"
        >
          <BkIcon icon="play" :size="16" />
          {{ isPaused || isBreak ? 'Resume' : 'Start' }}
        </BkButton>

        <!-- Pause -->
        <BkButton
          v-if="isRunning"
          variant="secondary"
          size="sm"
          @click="handlePause"
        >
          <BkIcon icon="pause" :size="16" />
          Pause
        </BkButton>

        <!-- Reset -->
        <BkButton
          v-if="!isIdle"
          variant="ghost"
          size="sm"
          @click="handleReset"
        >
          <BkIcon icon="rotate-ccw" :size="16" />
        </BkButton>

        <!-- Lap (stopwatch only) -->
        <BkButton
          v-if="isStopwatch && isRunning"
          variant="ghost"
          size="sm"
          @click="handleRecordLap"
        >
          <BkIcon icon="flag" :size="16" />
        </BkButton>

        <!-- Skip (countdown modes only) -->
        <BkButton
          v-if="!isStopwatch && (isRunning || isPaused || isBreak)"
          variant="ghost"
          size="sm"
          @click="handleSkip"
        >
          <BkIcon icon="skip-forward" :size="16" />
        </BkButton>
      </div>

      <!-- Stopwatch Laps -->
      <div
        v-if="isStopwatch && laps.length > 0 && !compactMode"
        class="w-full max-w-xs"
      >
        <div class="text-xs font-medium text-muted-foreground mb-1.5">Laps</div>
        <div class="space-y-0.5 max-h-20 overflow-y-auto">
          <div
            v-for="lap in [...laps].reverse().slice(0, maxLapsDisplayed)"
            :key="lap.id"
            class="flex items-center justify-between px-2 py-1 text-xs rounded bg-muted/50"
          >
            <span class="text-muted-foreground">#{{ lap.number }}</span>
            <span class="font-mono text-foreground">
              {{ Math.floor(lap.elapsedSeconds / 60).toString().padStart(2, '0') }}:{{ (lap.elapsedSeconds % 60).toString().padStart(2, '0') }}
            </span>
            <span class="text-muted-foreground font-mono">
              +{{ Math.floor(lap.splitSeconds / 60).toString().padStart(2, '0') }}:{{ (lap.splitSeconds % 60).toString().padStart(2, '0') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Stats -->
    <div
      v-if="!compactMode && todayStats.sessionsTotal > 0"
      class="border-t border-border px-4 py-2"
    >
      <div class="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <BkIcon icon="check-circle" :size="12" />
          {{ todayStats.workSessions }} session{{ todayStats.workSessions !== 1 ? 's' : '' }}
        </div>
        <div
          v-if="todayStats.workSeconds > 0"
          class="flex items-center gap-1"
        >
          <BkIcon icon="clock" :size="12" />
          {{ formatDuration(todayStats.workSeconds) }}
        </div>
      </div>
    </div>

    <!-- Session History -->
    <div
      v-if="showSessionHistory && !compactMode && recentSessions.length > 0"
      class="border-t border-border px-3 py-2 max-h-24 overflow-y-auto"
    >
      <div
        v-for="session in recentSessions"
        :key="session.id"
        class="flex items-center gap-2 py-1 text-xs"
      >
        <BkIcon
          :icon="session.type === 'work' || session.type === 'countdown' || session.type === 'stopwatch' ? 'briefcase' : 'coffee'"
          :size="12"
          :class="session.type.includes('break') ? 'text-green-500' : 'text-muted-foreground'"
        />
        <span class="text-foreground">
          {{ formatDuration(session.duration) }}
        </span>
        <span
          v-if="session.taskRef"
          class="flex-1 truncate text-muted-foreground"
        >
          - {{ session.taskRef.taskLabel }}
        </span>
        <span class="text-muted-foreground ml-auto">
          {{ formatSessionTime(session) }}
        </span>
      </div>
    </div>
  </div>
</template>
