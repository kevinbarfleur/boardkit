import { defineModule } from '@boardkit/core'
import TextWidget from './TextWidget.vue'
import type { TextState } from './types'
import { defaultTextSettings } from './types'

export const TextModule = defineModule<TextState>({
  moduleId: 'text',
  version: '0.1.0',
  displayName: 'Text',
  component: TextWidget,
  defaultState: () => ({
    content: '',
    ...defaultTextSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => ({
    // Merge with defaults to handle legacy data without settings
    ...defaultTextSettings,
    content: '',
    ...(data as Partial<TextState>),
  }),
  minWidth: 200,
  minHeight: 100,
  defaultWidth: 300,
  defaultHeight: 200,
})

export type { TextState }
export { defaultTextSettings }
