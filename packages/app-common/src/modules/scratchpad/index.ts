import { defineModule } from '@boardkit/core'
import ScratchpadWidget from './ScratchpadWidget.vue'
import type { ScratchpadState } from './types'
import { defaultScratchpadSettings } from './types'

export const ScratchpadModule = defineModule<ScratchpadState>({
  moduleId: 'scratchpad',
  version: '0.1.0',
  displayName: 'Quick Notes',
  component: ScratchpadWidget,
  defaultState: () => ({
    content: '',
    ...defaultScratchpadSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    content: '',
    ...defaultScratchpadSettings,
    ...(data as Partial<ScratchpadState>),
  }),
  minWidth: 200,
  minHeight: 100,
  defaultWidth: 280,
  defaultHeight: 200,
})

export type { ScratchpadState, FontSize } from './types'
export { defaultScratchpadSettings } from './types'
