/**
 * Timer Module Types v2
 *
 * Multi-mode timer with task linking support.
 * Modes: Pomodoro, Countdown, Stopwatch
 */

// === Timer Modes ===

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch'

// === Timer Status ===

export type TimerStatus = 'idle' | 'running' | 'paused' | 'break'

// === Session Types ===

export type SessionType = 'work' | 'short-break' | 'long-break' | 'countdown' | 'stopwatch'

// === Task Reference (for linking timer to tasks) ===

export interface TaskReference {
  /** Widget ID of the todo/kanban provider */
  widgetId: string
  /** Task ID within that widget */
  taskId: string
  /** Snapshot of task label (for history display) */
  taskLabel: string
  /** Source type for display */
  sourceType: 'todo' | 'kanban'
}

// === Timer Session (History Record) ===

export interface TimerSession {
  id: string
  mode: TimerMode
  type: SessionType
  /** Duration in seconds (actual elapsed time) */
  duration: number
  /** ISO timestamp when session was completed */
  completedAt: string
  /** Optional task reference if timer was linked */
  taskRef?: TaskReference
  /** Was this session skipped instead of completed? */
  skipped?: boolean
}

// === Countdown Preset ===

export interface CountdownPreset {
  id: string
  label: string
  /** Duration in minutes */
  minutes: number
}

// === Lap Record (for stopwatch) ===

export interface LapRecord {
  id: string
  /** Lap number (1-based) */
  number: number
  /** Time when lap was recorded (elapsed seconds from start) */
  elapsedSeconds: number
  /** Difference from previous lap in seconds */
  splitSeconds: number
}

// === Pomodoro Phase ===

export type PomodoroPhase = 'work' | 'short-break' | 'long-break'

// === Main State ===

export interface TimerState {
  // === Mode and Status ===
  mode: TimerMode
  status: TimerStatus

  // === Time Tracking ===
  /** Current seconds (remaining for countdown/pomodoro, elapsed for stopwatch) */
  currentSeconds: number
  /** Target seconds for current session (countdown/pomodoro only, 0 for stopwatch) */
  targetSeconds: number
  /** Timestamp when timer was last started (for drift correction) */
  startedAt: string | null

  // === Pomodoro State ===
  /** Work sessions completed in current cycle */
  pomodoroSessionCount: number
  /** Current phase in pomodoro cycle */
  pomodoroPhase: PomodoroPhase

  // === Stopwatch State ===
  laps: LapRecord[]

  // === Task Linking ===
  linkedTask: TaskReference | null
  /** Provider widget IDs for available tasks */
  connectedTaskProviders: string[]

  // === Session History (persisted) ===
  sessionHistory: TimerSession[]

  // === Settings - Pomodoro ===
  pomodoroWorkMinutes: number
  pomodoroShortBreakMinutes: number
  pomodoroLongBreakMinutes: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartWork: boolean

  // === Settings - Countdown ===
  countdownPresets: CountdownPreset[]
  defaultCountdownMinutes: number

  // === Settings - Stopwatch ===
  showLaps: boolean
  maxLapsDisplayed: number

  // === Settings - Sound & Notifications ===
  soundEnabled: boolean
  soundVolume: number
  notificationSound: 'bell' | 'chime' | 'ding' | 'none'

  // === Settings - Display ===
  showLinkedTask: boolean
  showSessionHistory: boolean
  compactMode: boolean
}

// === Default Settings ===

export const defaultTimerSettings: Omit<
  TimerState,
  | 'mode'
  | 'status'
  | 'currentSeconds'
  | 'targetSeconds'
  | 'startedAt'
  | 'pomodoroSessionCount'
  | 'pomodoroPhase'
  | 'laps'
  | 'linkedTask'
  | 'connectedTaskProviders'
  | 'sessionHistory'
> = {
  // Pomodoro
  pomodoroWorkMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,

  // Countdown
  countdownPresets: [
    { id: 'p5', label: '5 min', minutes: 5 },
    { id: 'p10', label: '10 min', minutes: 10 },
    { id: 'p15', label: '15 min', minutes: 15 },
    { id: 'p30', label: '30 min', minutes: 30 },
  ],
  defaultCountdownMinutes: 10,

  // Stopwatch
  showLaps: true,
  maxLapsDisplayed: 5,

  // Sound
  soundEnabled: true,
  soundVolume: 50,
  notificationSound: 'bell',

  // Display
  showLinkedTask: true,
  showSessionHistory: true,
  compactMode: false,
}

// === Helper to create initial state ===

export function createInitialTimerState(): TimerState {
  const workMinutes = defaultTimerSettings.pomodoroWorkMinutes
  return {
    mode: 'pomodoro',
    status: 'idle',
    currentSeconds: workMinutes * 60,
    targetSeconds: workMinutes * 60,
    startedAt: null,
    pomodoroSessionCount: 0,
    pomodoroPhase: 'work',
    laps: [],
    linkedTask: null,
    connectedTaskProviders: [],
    sessionHistory: [],
    ...defaultTimerSettings,
  }
}
