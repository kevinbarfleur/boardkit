import { defineModule, counterContractV1 } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import CounterWidget from './CounterWidget.vue'
import type { CounterState } from './types'
import { defaultCounterSettings } from './types'

/**
 * Settings schema for Counter module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'counter',
      title: 'Counter Settings',
      icon: 'settings-2',
      fields: [
        {
          key: 'step',
          type: 'number',
          label: 'Step',
          hint: 'Amount to add/subtract',
          min: 1,
          max: 100,
        },
        {
          key: 'minValue',
          type: 'number',
          label: 'Minimum',
          hint: 'Minimum allowed value',
        },
        {
          key: 'maxValue',
          type: 'number',
          label: 'Maximum',
          hint: 'Maximum allowed value',
        },
      ],
    },
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showProgress',
          type: 'toggle',
          label: 'Show progress',
          hint: 'Display progress bar when target is set',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: 'calendar',
      fields: [
        {
          key: 'resetDaily',
          type: 'toggle',
          label: 'Reset daily',
          hint: 'Reset counter to 0 each day',
        },
      ],
    },
  ],
}

export const CounterModule = defineModule<CounterState>({
  moduleId: 'counter',
  version: '0.1.0',
  displayName: 'Counter',
  icon: 'hash',
  component: CounterWidget,
  defaultState: () => ({
    label: 'Counter',
    value: 0,
    target: null,
    unit: '',
    ...defaultCounterSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    label: 'Counter',
    value: 0,
    target: null,
    unit: '',
    ...defaultCounterSettings,
    ...(data as Partial<CounterState>),
  }),
  minWidth: 200,
  minHeight: 150,
  defaultWidth: 240,
  defaultHeight: 200,
  provides: [counterContractV1],
  settingsSchema,
})

export type { CounterState } from './types'
export { defaultCounterSettings } from './types'
