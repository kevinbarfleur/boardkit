import { defineModule, counterContractV1 } from '@boardkit/core'
import CounterWidget from './CounterWidget.vue'
import type { CounterState } from './types'
import { defaultCounterSettings } from './types'

export const CounterModule = defineModule<CounterState>({
  moduleId: 'counter',
  version: '0.1.0',
  displayName: 'Counter',
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
})

export type { CounterState } from './types'
export { defaultCounterSettings } from './types'
