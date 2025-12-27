import { defineModule } from '@boardkit/core'
import TextWidget from './TextWidget.vue'
import type { TextState } from './types'

export const TextModule = defineModule<TextState>({
  moduleId: 'text',
  version: '0.1.0',
  displayName: 'Text',
  component: TextWidget,
  defaultState: () => ({
    content: '',
  }),
  serialize: (state) => state,
  deserialize: (data) => data as TextState,
  minWidth: 200,
  minHeight: 100,
  defaultWidth: 300,
  defaultHeight: 200,
})

export type { TextState }
