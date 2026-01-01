import { defineModule, kanbanContractV1, kanbanStatsContractV1 } from '@boardkit/core'
import type { SettingsSchema } from '@boardkit/core'
import KanbanWidget from './KanbanWidget.vue'
import type { KanbanState, KanbanItem } from './types'
import { defaultKanbanSettings, defaultKanbanColumns } from './types'

/**
 * Settings schema for Kanban module
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          key: 'showItemCount',
          type: 'toggle',
          label: 'Show item count',
          hint: 'Display card count per column',
        },
        {
          key: 'showWipLimits',
          type: 'toggle',
          label: 'Show WIP limits',
          hint: 'Display work-in-progress limits',
        },
        {
          key: 'showCompletionRate',
          type: 'toggle',
          label: 'Show completion rate',
          hint: 'Display overall completion percentage',
        },
        {
          key: 'compactMode',
          type: 'toggle',
          label: 'Compact mode',
          hint: 'Use smaller cards',
        },
      ],
    },
    {
      id: 'features',
      title: 'Card Features',
      icon: 'layers',
      fields: [
        {
          key: 'showDueDate',
          type: 'toggle',
          label: 'Due dates',
          hint: 'Enable due dates on cards',
        },
        {
          key: 'showPriority',
          type: 'toggle',
          label: 'Priority levels',
          hint: 'Enable priority on cards',
        },
        {
          key: 'showTags',
          type: 'toggle',
          label: 'Tags',
          hint: 'Enable colored tags on cards',
        },
        {
          key: 'showChecklist',
          type: 'toggle',
          label: 'Checklists',
          hint: 'Enable checklists on cards',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: 'zap',
      fields: [
        {
          key: 'confirmDeleteCard',
          type: 'toggle',
          label: 'Confirm card delete',
          hint: 'Ask before deleting cards',
        },
        {
          key: 'confirmDeleteColumn',
          type: 'toggle',
          label: 'Confirm column delete',
          hint: 'Ask before deleting columns',
        },
      ],
    },
  ],
}

// Legacy type for migration
interface LegacyKanbanItem extends Omit<KanbanItem, 'tags'> {
  labels?: string[]
  tags?: string[]
}

export const KanbanModule = defineModule<KanbanState>({
  moduleId: 'kanban',
  version: '0.3.0',
  displayName: 'Kanban',
  icon: 'columns',
  component: KanbanWidget,
  defaultState: () => ({
    title: 'Kanban',
    columns: [...defaultKanbanColumns],
    items: [],
    ...defaultKanbanSettings,
  }),
  serialize: (state) => state,
  deserialize: (data) => {
    const saved = data as Partial<KanbanState> & { labels?: unknown }
    return {
      title: saved.title ?? 'Kanban',
      columns: saved.columns?.length ? saved.columns : [...defaultKanbanColumns],
      items: (saved.items ?? []).map((item: LegacyKanbanItem) => ({
        ...item,
        // V2 migration: convert labels to tags
        tags: item.tags ?? item.labels ?? [],
        checklist: item.checklist ?? [],
      })),
      ...defaultKanbanSettings,
      // Migrate showLabels → showTags
      showTags: (saved as { showLabels?: boolean }).showLabels ?? saved.showTags ?? defaultKanbanSettings.showTags,
      ...saved,
    }
  },
  minWidth: 400,
  minHeight: 250,
  defaultWidth: 600,
  defaultHeight: 400,
  provides: [kanbanContractV1, kanbanStatsContractV1],
  settingsSchema,
})

export type {
  KanbanState,
  KanbanItem,
  KanbanColumn,
  KanbanPriority,
  ChecklistItem,
} from './types'
export { defaultKanbanSettings, defaultKanbanColumns, getTagColor, tagColorPalette } from './types'
