import {
  defineModule,
  timerStatusContractV1,
  timerHistoryContractV1,
  todoContractV1,
  kanbanContractV1,
} from '@boardkit/core'
import type { SettingsSchema, ConfigurationSchema } from '@boardkit/core'
import TimerWidget from './TimerWidget.vue'
import type { TimerState } from './types'
import { defaultTimerSettings, createInitialTimerState } from './types'

/**
 * Settings schema for Timer module v2
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'pomodoro',
      title: 'Pomodoro',
      icon: 'timer',
      fields: [
        {
          key: 'pomodoroWorkMinutes',
          type: 'slider',
          label: 'Work duration',
          hint: 'Minutes per work session',
          min: 5,
          max: 60,
          step: 5,
          unit: 'min',
        },
        {
          key: 'pomodoroShortBreakMinutes',
          type: 'slider',
          label: 'Short break',
          hint: 'Minutes for short breaks',
          min: 1,
          max: 15,
          step: 1,
          unit: 'min',
        },
        {
          key: 'pomodoroLongBreakMinutes',
          type: 'slider',
          label: 'Long break',
          hint: 'Minutes for long breaks',
          min: 10,
          max: 30,
          step: 5,
          unit: 'min',
        },
        {
          key: 'sessionsUntilLongBreak',
          type: 'slider',
          label: 'Sessions until long break',
          hint: 'Work sessions before a long break',
          min: 2,
          max: 8,
          step: 1,
        },
        {
          key: 'autoStartBreaks',
          type: 'toggle',
          label: 'Auto-start breaks',
          hint: 'Automatically start break timer',
        },
        {
          key: 'autoStartWork',
          type: 'toggle',
          label: 'Auto-start work',
          hint: 'Automatically start work timer after break',
        },
      ],
    },
    {
      id: 'countdown',
      title: 'Countdown',
      icon: 'clock',
      fields: [
        {
          key: 'defaultCountdownMinutes',
          type: 'slider',
          label: 'Default duration',
          hint: 'Default duration for countdown timer',
          min: 1,
          max: 120,
          step: 1,
          unit: 'min',
        },
      ],
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch',
      icon: 'timer-reset',
      fields: [
        {
          key: 'showLaps',
          type: 'toggle',
          label: 'Show lap times',
          hint: 'Display recorded lap times',
        },
        {
          key: 'maxLapsDisplayed',
          type: 'slider',
          label: 'Max laps displayed',
          hint: 'Maximum number of laps to show',
          min: 3,
          max: 20,
          step: 1,
          condition: 'state.showLaps === true',
        },
      ],
    },
    {
      id: 'sound',
      title: 'Sound',
      icon: 'volume-2',
      fields: [
        {
          key: 'soundEnabled',
          type: 'toggle',
          label: 'Sound notifications',
          hint: 'Play sound when timer completes',
        },
        {
          key: 'soundVolume',
          type: 'slider',
          label: 'Volume',
          min: 0,
          max: 100,
          step: 10,
          unit: '%',
          condition: 'state.soundEnabled === true',
        },
        {
          key: 'notificationSound',
          type: 'select',
          label: 'Notification sound',
          options: [
            { value: 'bell', label: 'Bell' },
            { value: 'chime', label: 'Chime' },
            { value: 'ding', label: 'Ding' },
            { value: 'none', label: 'None' },
          ],
          condition: 'state.soundEnabled === true',
        },
      ],
    },
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showLinkedTask',
          type: 'toggle',
          label: 'Show linked task',
          hint: 'Display the linked task in the timer',
        },
        {
          key: 'showSessionHistory',
          type: 'toggle',
          label: 'Show session history',
          hint: 'Display recent completed sessions',
        },
        {
          key: 'compactMode',
          type: 'toggle',
          label: 'Compact mode',
          hint: 'Smaller widget with minimal UI',
        },
      ],
    },
  ],
}

/**
 * Configuration schema for task sources
 */
const configurationSchema: ConfigurationSchema = {
  isConfigured: () => true, // Timer works without configuration
  setupMessage: 'Connect task sources to track time per task',
  setupIcon: 'link',
  sections: [
    {
      type: 'source-picker-group',
      title: 'Task Sources',
      icon: 'list-todo',
      description: 'Select todo lists or kanban boards to link tasks from',
      contracts: [
        {
          contractId: 'boardkit.todo.v1',
          stateKey: 'connectedTaskProviders',
          label: 'Todo Lists',
          icon: 'check-square',
        },
        {
          contractId: 'boardkit.kanban.v1',
          stateKey: 'connectedTaskProviders',
          label: 'Kanban Boards',
          icon: 'columns-3',
        },
      ],
    },
  ],
}

/**
 * Timer Module v2
 *
 * Multi-mode timer with task linking support.
 * Modes: Pomodoro, Countdown, Stopwatch
 */
export const TimerModule = defineModule<TimerState>({
  moduleId: 'timer',
  version: '0.2.0',
  displayName: 'Timer',
  icon: 'timer',
  component: TimerWidget,

  defaultState: createInitialTimerState,

  serialize: (state) => {
    // Persist all state including runtime values
    // startedAt is transient but removing it breaks runtime state updates
    // On next load, deserialize will handle resetting to idle
    return state
  },

  deserialize: (data) => {
    const saved = data as Partial<TimerState> & { freeTimerMinutes?: number; pomodoroBreakMinutes?: number }
    const initial = createInitialTimerState()

    // Migrate from old 'free' mode to 'countdown'
    let mode = saved.mode || initial.mode
    if ((mode as string) === 'free') {
      mode = 'countdown'
    }

    // Migrate old pomodoroBreakMinutes to pomodoroShortBreakMinutes
    const shortBreak = saved.pomodoroShortBreakMinutes ?? saved.pomodoroBreakMinutes ?? initial.pomodoroShortBreakMinutes

    // Migrate freeTimerMinutes to defaultCountdownMinutes
    const countdownMinutes = saved.defaultCountdownMinutes ?? saved.freeTimerMinutes ?? initial.defaultCountdownMinutes

    // Ensure 1-minute preset is always available (added later, might be missing in old data)
    let countdownPresets = saved.countdownPresets ?? initial.countdownPresets
    if (countdownPresets && !countdownPresets.some((p) => p.id === 'p1')) {
      countdownPresets = [{ id: 'p1', label: '1 min', minutes: 1 }, ...countdownPresets]
    }

    // Calculate default seconds based on mode (only used if not saved)
    const workMinutes = saved.pomodoroWorkMinutes ?? initial.pomodoroWorkMinutes
    const defaultSeconds = mode === 'pomodoro' ? workMinutes * 60 : mode === 'countdown' ? countdownMinutes * 60 : 0

    // Determine runtime state
    // If startedAt is stale (> 5 minutes old) and status is 'running', reset to idle
    // This handles the case where document was saved while timer was running
    let status = saved.status ?? 'idle'
    let startedAt = saved.startedAt ?? null
    let currentSeconds = saved.currentSeconds ?? defaultSeconds

    if (startedAt && status === 'running') {
      const startTime = new Date(startedAt).getTime()
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      if (startTime < fiveMinutesAgo) {
        // Stale session - reset to idle
        status = 'idle'
        startedAt = null
        currentSeconds = defaultSeconds
      }
    }

    return {
      ...initial,
      ...saved,
      // Apply migrations
      mode,
      pomodoroShortBreakMinutes: shortBreak,
      defaultCountdownMinutes: countdownMinutes,
      countdownPresets,
      // Runtime state with stale session handling
      status,
      currentSeconds,
      targetSeconds: saved.targetSeconds ?? defaultSeconds,
      startedAt,
      pomodoroPhase: saved.pomodoroPhase ?? 'work',
      laps: saved.laps ?? [],
      sessionHistory: saved.sessionHistory ?? [],
    }
  },

  minWidth: 260,
  minHeight: 320,
  defaultWidth: 300,
  defaultHeight: 400,

  provides: [timerStatusContractV1, timerHistoryContractV1],
  consumes: [
    {
      contract: todoContractV1,
      multi: true,
      stateKey: 'connectedTaskProviders',
      sourceLabel: 'Todo Lists',
    },
    {
      contract: kanbanContractV1,
      multi: true,
      stateKey: 'connectedTaskProviders',
      sourceLabel: 'Kanban Boards',
    },
  ],

  settingsSchema,
  configurationSchema,
})

// Export types
export type { TimerState, TimerSession, TimerMode, TimerStatus, TaskReference, LapRecord, CountdownPreset, PomodoroPhase, SessionType } from './types'
export { defaultTimerSettings, createInitialTimerState } from './types'
