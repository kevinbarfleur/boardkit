<script setup lang="ts">
/**
 * Timer Widget v3
 *
 * Multi-mode timer with water fill effect and task linking.
 * Modes: Pomodoro, Countdown, Stopwatch
 *
 * Features:
 * - Drift-free timing using useTimestamp
 * - Water fill animation for visual progress
 * - Task linking to todo/kanban items
 * - Session history tracking
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTimestamp } from '@vueuse/core'
import { nanoid } from 'nanoid'
import type { ModuleContext } from '@boardkit/core'
import {
  useProvideData,
  useConsumeData,
  useModuleConfiguration,
  timerStatusContractV1,
  timerHistoryContractV1,
  todoContractV1,
  kanbanContractV1,
} from '@boardkit/core'
import type {
  PublicTimerStatus,
  PublicTimerHistory,
  TaskTimeEntry,
  PublicTodoList,
  PublicKanbanBoard,
} from '@boardkit/core'
import { BkIcon, BkButton, BkIconButton, BkTabs, type BkTab } from '@boardkit/ui'
import type { TimerState, TimerMode, TimerSession, SessionType, LapRecord, TaskReference } from './types'
import { defaultTimerSettings } from './types'
import { WaterTimer, TaskLinkChip, TaskLinkPopover, StopwatchDisplay } from './components'

interface Props {
  context: ModuleContext<TimerState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'open-settings': [options?: { tab?: string }]
}>()

// === Drift-free Timer with useTimestamp ===
const now = useTimestamp({ interval: 100 })

// === Computed State ===
const mode = computed(() => props.context.state.mode)
const status = computed(() => props.context.state.status)
const startedAt = computed(() => props.context.state.startedAt)
const targetSeconds = computed(() => props.context.state.targetSeconds)
const pausedSeconds = computed(() => props.context.state.currentSeconds) // Seconds when paused
const pomodoroPhase = computed(() => props.context.state.pomodoroPhase)
const pomodoroSessionCount = computed(() => props.context.state.pomodoroSessionCount)
const laps = computed(() => props.context.state.laps || [])
const linkedTask = computed(() => props.context.state.linkedTask)
const sessionHistory = computed(() => props.context.state.sessionHistory || [])

// Settings with defaults
const showLinkedTask = computed(() => props.context.state.showLinkedTask ?? defaultTimerSettings.showLinkedTask)
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

// Derived state
const isRunning = computed(() => status.value === 'running')
const isPaused = computed(() => status.value === 'paused')
const isBreak = computed(() => status.value === 'break')
const isIdle = computed(() => status.value === 'idle')
const isStopwatch = computed(() => mode.value === 'stopwatch')
const isCountdown = computed(() => mode.value === 'countdown')
const isPomodoro = computed(() => mode.value === 'pomodoro')

// === Drift-free Time Calculation ===
const currentSeconds = computed(() => {
  if (isStopwatch.value) {
    // Stopwatch: count up from startedAt
    if (!startedAt.value || !isRunning.value) {
      return pausedSeconds.value
    }
    const elapsedMs = now.value - new Date(startedAt.value).getTime()
    return pausedSeconds.value + Math.floor(elapsedMs / 1000)
  } else {
    // Countdown/Pomodoro: count down from target
    if (!startedAt.value || !isRunning.value) {
      return pausedSeconds.value
    }
    const elapsedMs = now.value - new Date(startedAt.value).getTime()
    const elapsed = Math.floor(elapsedMs / 1000)
    return Math.max(0, pausedSeconds.value - elapsed)
  }
})

// Progress percent (0-100)
const progressPercent = computed(() => {
  if (isStopwatch.value) return 0
  if (targetSeconds.value === 0) return 0

  // For breaks, progress goes from 100 to 0 (water drains)
  if (isBreak.value) {
    return Math.round((currentSeconds.value / targetSeconds.value) * 100)
  }

  // For work/countdown, progress goes from 0 to 100 (water fills)
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

// Mode tabs for BkTabs (disabled when running to prevent mode switch)
const modeTabs = computed<BkTab[]>(() => [
  { id: 'pomodoro', label: 'Pomodoro', disabled: isRunning.value },
  { id: 'countdown', label: 'Countdown', disabled: isRunning.value },
  { id: 'stopwatch', label: 'Stopwatch', disabled: isRunning.value },
])

// Dynamic class for tab content container (card tabs pattern)
const modeContentClass = computed(() => {
  const base = ['border', 'border-border', 'bg-popover', 'rounded-b-lg', 'rounded-tr-lg', 'flex-1', 'flex', 'flex-col', 'gap-3', 'p-3', 'overflow-auto']
  const tabIds = modeTabs.value.map((t) => t.id)
  const activeIndex = tabIds.indexOf(mode.value)
  // Add rounded top-left corner if active tab is not the first one
  if (activeIndex !== 0) {
    base.push('rounded-tl-lg')
  }
  return base.join(' ')
})

// Status label for WaterTimer
const statusLabel = computed(() => {
  if (isBreak.value) {
    return pomodoroPhase.value === 'long-break' ? 'Long Break' : 'Break'
  }
  if (isPomodoro.value && !isIdle.value) {
    return `Session ${pomodoroSessionCount.value + 1}`
  }
  return ''
})

// === Task Linking ===
const { needsSetup } = useModuleConfiguration(props.context)

// Consume todo and kanban data for task selection
// Use stateKey matching TimerState.connectedTaskProviders
const { allData: todoData } = useConsumeData<TimerState, PublicTodoList>(
  props.context,
  todoContractV1,
  { multi: true, stateKey: 'connectedTaskProviders' }
)

const { allData: kanbanData } = useConsumeData<TimerState, PublicKanbanBoard>(
  props.context,
  kanbanContractV1,
  { multi: true, stateKey: 'connectedTaskProviders' }
)

// Build task groups for the popover
const taskGroups = computed(() => {
  const groups: Array<{
    widgetId: string
    title: string
    icon: string
    tasks: Array<{
      widgetId: string
      widgetTitle: string
      taskId: string
      taskLabel: string
      sourceType: 'todo' | 'kanban'
    }>
  }> = []

  // Add todo tasks
  for (const todoList of todoData.value) {
    const pendingItems = todoList.items.filter((item) => !item.completed)
    if (pendingItems.length > 0) {
      groups.push({
        widgetId: todoList.widgetId,
        title: todoList.title || 'Todo List',
        icon: 'check-square',
        tasks: pendingItems.map((item) => ({
          widgetId: todoList.widgetId,
          widgetTitle: todoList.title || 'Todo List',
          taskId: item.id,
          taskLabel: item.label,
          sourceType: 'todo' as const,
        })),
      })
    }
  }

  // Add kanban tasks
  for (const board of kanbanData.value) {
    if (board.items.length > 0) {
      groups.push({
        widgetId: board.widgetId,
        title: board.title || 'Kanban Board',
        icon: 'columns-3',
        tasks: board.items.map((item) => ({
          widgetId: board.widgetId,
          widgetTitle: board.title || 'Kanban Board',
          taskId: item.id,
          taskLabel: item.title,
          sourceType: 'kanban' as const,
        })),
      })
    }
  }

  return groups
})

const noTaskProviders = computed(() => {
  return todoData.value.length === 0 && kanbanData.value.length === 0
})

function handleLinkTask(task: TaskReference) {
  props.context.updateState({ linkedTask: task })
}

function handleUnlinkTask() {
  props.context.updateState({ linkedTask: null })
}

function handleConfigureProviders() {
  emit('open-settings', { tab: 'configure' })
}

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
      currentSeconds: currentSeconds.value,
      startedAt: null,
      sessionHistory: newHistory,
    })
  }

  return session
}

// Watch for timer completion
watch(currentSeconds, (value) => {
  if (!isStopwatch.value && value <= 0 && isRunning.value) {
    completeSession()
  }
})

// === Actions ===

function handleModeChange(value: string | string[]) {
  if (typeof value !== 'string') return
  const newMode = value as TimerMode

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
  if (isIdle.value || (isStopwatch.value && pausedSeconds.value === 0)) {
    // Starting fresh
    // For countdown mode, use already-set targetSeconds (from presets)
    // For other modes, calculate initial seconds
    const seconds = isCountdown.value
      ? targetSeconds.value
      : getInitialSeconds(mode.value)

    props.context.updateState({
      status: 'running',
      currentSeconds: isStopwatch.value ? 0 : seconds,
      targetSeconds: isStopwatch.value ? 0 : seconds,
      startedAt: new Date().toISOString(),
      laps: isStopwatch.value ? [] : laps.value,
    })
  } else {
    // Resuming - store current seconds and start fresh
    props.context.updateState({
      status: 'running',
      currentSeconds: pausedSeconds.value,
      startedAt: new Date().toISOString(),
    })
  }
}

function handlePause() {
  // Store the current calculated seconds when pausing
  props.context.updateState({
    status: 'paused',
    currentSeconds: currentSeconds.value,
    startedAt: null,
  })
}

function handleReset() {
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
    const nowTime = audioContext.currentTime

    gainNode.gain.setValueAtTime(volume, nowTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, nowTime + 0.5)

    oscillator.start(nowTime)
    oscillator.stop(nowTime + 0.5)
  } catch {
    // Audio playback failed silently
  }
}

// === Lifecycle ===

onUnmounted(() => {
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close()
    } catch {
      // Ignore close errors
    }
  }
})

// === Data Sharing ===

useProvideData(props.context, timerStatusContractV1, {
  project: (state): PublicTimerStatus => ({
    widgetId: props.context.widgetId,
    mode: state.mode,
    status: state.status,
    displaySeconds: currentSeconds.value,
    targetSeconds: state.mode === 'stopwatch' ? null : state.targetSeconds,
    progressPercent: progressPercent.value,
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

// === UI Helpers ===

// Today's stats computed
const todaySessions = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return sessionHistory.value.filter((s) => s.completedAt?.startsWith(today))
})

const workSessionCount = computed(() => {
  return todaySessions.value.filter(
    (s) => s.type === 'work' || s.type === 'countdown' || s.type === 'stopwatch'
  ).length
})

const totalFocusedSeconds = computed(() => {
  return todaySessions.value
    .filter((s) => s.type === 'work' || s.type === 'countdown' || s.type === 'stopwatch')
    .reduce((total, session) => total + (session.duration || 0), 0)
})

const formattedFocusTime = computed(() => {
  const seconds = totalFocusedSeconds.value
  if (seconds === 0) return '0m'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

// Format lap time
function formatLapTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Preset button class
function presetClass(preset: { minutes: number }): string {
  const isSelected = targetSeconds.value === preset.minutes * 60
  const base = 'px-2.5 py-1 text-xs rounded-md border transition-colors'
  if (isSelected) {
    return `${base} bg-primary text-primary-foreground border-transparent`
  }
  return `${base} border-border text-muted-foreground hover:border-primary hover:text-foreground`
}
</script>

<template>
  <div class="timer-widget h-full flex flex-col p-3">
    <!-- Mode Selector (BkTabs card) -->
    <BkTabs
      :model-value="mode"
      :tabs="modeTabs"
      variant="card"
      :full-width="false"
      @update:model-value="handleModeChange"
    />

    <!-- Tab Content Container (connected to tabs) -->
    <div :class="modeContentClass">
      <!-- Countdown Presets (contextuel) -->
      <div v-if="isCountdown && isIdle" class="flex flex-wrap justify-center gap-1.5 py-2">
        <button
          v-for="preset in countdownPresets"
          :key="preset.id"
          :class="presetClass(preset)"
          @click="handlePresetSelect(preset.minutes)"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Timer Display (HERO - centré) -->
      <div class="flex-1 flex items-center justify-center min-h-[180px]">
        <WaterTimer
          v-if="!isStopwatch"
          :progress="progressPercent"
          :time="displayTime"
          :status-label="statusLabel"
          :is-break="isBreak"
          :size="180"
        />
        <StopwatchDisplay v-else :time="displayTime" :size="180" />
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-2 py-2">
        <BkButton
          :variant="isRunning ? 'secondary' : 'default'"
          @click="isRunning ? handlePause() : handleStart()"
        >
          <BkIcon :icon="isRunning ? 'pause' : 'play'" :size="16" />
          {{ isRunning ? 'Pause' : (isPaused || isBreak ? 'Resume' : 'Start') }}
        </BkButton>

        <BkIconButton v-if="!isIdle" ariaLabel="Reset" size="sm" @click="handleReset">
          <BkIcon icon="rotate-ccw" :size="16" />
        </BkIconButton>

        <BkIconButton
          v-if="isStopwatch && isRunning"
          ariaLabel="Lap"
          size="sm"
          @click="handleRecordLap"
        >
          <BkIcon icon="flag" :size="16" />
        </BkIconButton>

        <BkIconButton
          v-if="!isStopwatch && (isRunning || isPaused || isBreak)"
          ariaLabel="Skip"
          size="sm"
          @click="handleSkip"
        >
          <BkIcon icon="skip-forward" :size="16" />
        </BkIconButton>
      </div>

      <!-- Divider before Task Link -->
      <hr v-if="showLinkedTask" class="border-border" />

      <!-- Task Link (optionnel) -->
      <div v-if="showLinkedTask" class="flex items-center justify-center py-2">
        <TaskLinkChip v-if="linkedTask" :task="linkedTask" @unlink="handleUnlinkTask" />
        <TaskLinkPopover
          v-else
          :task-groups="taskGroups"
          :no-providers="noTaskProviders"
          @select="handleLinkTask"
          @configure="handleConfigureProviders"
        />
      </div>

      <!-- Laps (Stopwatch) -->
      <template v-if="isStopwatch && laps.length > 0 && !compactMode">
        <hr class="border-border" />
        <div class="divide-y divide-border max-h-[120px] overflow-y-auto">
          <div
            v-for="lap in [...laps].reverse().slice(0, maxLapsDisplayed)"
            :key="lap.id"
            class="px-3 py-2 flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">#{{ lap.number }}</span>
            <span class="font-mono">{{ formatLapTime(lap.elapsedSeconds) }}</span>
            <span class="text-muted-foreground font-mono text-xs">
              +{{ formatLapTime(lap.splitSeconds) }}
            </span>
          </div>
        </div>
      </template>

      <!-- Spacer to push stats to bottom -->
      <div class="flex-1" />

      <!-- Stats (always at bottom) -->
      <template v-if="!compactMode">
        <hr class="border-border" />
        <div class="flex items-center justify-center gap-4 text-sm py-2">
          <span class="flex items-center gap-1.5 text-muted-foreground">
            <BkIcon icon="zap" :size="14" />
            {{ workSessionCount }} session{{ workSessionCount !== 1 ? 's' : '' }}
          </span>
          <span class="text-border">•</span>
          <span class="flex items-center gap-1.5 text-muted-foreground">
            <BkIcon icon="clock" :size="14" />
            {{ formattedFocusTime }} focused
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
