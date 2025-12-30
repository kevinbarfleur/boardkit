import { defineModule } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import ScratchpadWidget from './ScratchpadWidget.vue'
import type { ScratchpadState } from './types'
import { defaultScratchpadSettings } from './types'

/**
 * Settings schema for Scratchpad module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'fontSize',
          type: 'button-group',
          label: 'Font size',
          options: [
            { value: 'small', label: 'S' },
            { value: 'medium', label: 'M' },
            { value: 'large', label: 'L' },
          ],
          fullWidth: true,
        },
        {
          key: 'showWordCount',
          type: 'toggle',
          label: 'Show word count',
          hint: 'Display word count at bottom',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: 'settings-2',
      fields: [
        {
          key: 'placeholder',
          type: 'text',
          label: 'Placeholder',
          placeholder: 'Enter placeholder text...',
        },
      ],
    },
  ],
}

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
  settingsSchema,
})

export type { ScratchpadState, FontSize } from './types'
export { defaultScratchpadSettings } from './types'
