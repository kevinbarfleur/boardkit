/**
 * Counter Module Types
 *
 * Simple counter with optional target and progress tracking.
 */

export interface CounterState {
  // Core state
  label: string
  value: number
  target: number | null
  unit: string

  // Settings
  step: number
  minValue: number | null
  maxValue: number | null
  showProgress: boolean
  resetDaily: boolean
  lastResetDate: string | null
}

export const defaultCounterSettings: Omit<CounterState, 'label' | 'value' | 'target' | 'unit'> = {
  step: 1,
  minValue: 0,
  maxValue: null,
  showProgress: true,
  resetDaily: false,
  lastResetDate: null,
}
