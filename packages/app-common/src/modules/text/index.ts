import { defineModule } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import TextWidget from './TextWidget.vue'
import type { TextState } from './types'
import { defaultTextSettings } from './types'

/**
 * Settings schema for Text module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'typography',
      title: 'Typography',
      icon: 'type',
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
          key: 'lineHeight',
          type: 'button-group',
          label: 'Line height',
          options: [
            { value: 'compact', label: 'Compact' },
            { value: 'normal', label: 'Normal' },
            { value: 'spacious', label: 'Spacious' },
          ],
          fullWidth: true,
        },
      ],
    },
    {
      id: 'editing',
      title: 'Editing',
      icon: 'settings-2',
      fields: [
        {
          key: 'enableShortcuts',
          type: 'toggle',
          label: 'Keyboard shortcuts',
          hint: 'Enable formatting shortcuts',
        },
        {
          key: 'autoLinks',
          type: 'toggle',
          label: 'Auto-links',
          hint: 'Convert URLs to clickable links',
        },
        {
          key: 'smartTypography',
          type: 'toggle',
          label: 'Smart typography',
          hint: 'Auto-correct quotes and dashes',
        },
      ],
    },
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showWordCount',
          type: 'toggle',
          label: 'Show word count',
          hint: 'Display word count at bottom',
        },
      ],
    },
  ],
}

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
  settingsSchema,
})

export type { TextState }
export { defaultTextSettings }
