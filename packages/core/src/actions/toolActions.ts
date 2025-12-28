import type { ActionDefinition } from '../types/action'
import type { ToolType } from '../types/tool'
import { TOOL_SHORTCUTS } from '../types/tool'
import { useToolStore } from '../stores/toolStore'

/**
 * Tool Actions
 *
 * Actions for switching between canvas tools.
 * Each tool has a corresponding single-key shortcut (V, H, R, O, L, A, P, T).
 */

interface ToolActionConfig {
  id: ToolType
  title: string
  icon: string
  keywords: string[]
}

const TOOL_CONFIGS: ToolActionConfig[] = [
  {
    id: 'select',
    title: 'Select Tool',
    icon: 'mouse-pointer-2',
    keywords: ['select', 'pointer', 'cursor', 'move'],
  },
  {
    id: 'hand',
    title: 'Hand Tool',
    icon: 'hand',
    keywords: ['hand', 'pan', 'drag', 'move'],
  },
  {
    id: 'rectangle',
    title: 'Rectangle Tool',
    icon: 'square',
    keywords: ['rectangle', 'rect', 'box', 'shape', 'square'],
  },
  {
    id: 'ellipse',
    title: 'Ellipse Tool',
    icon: 'circle',
    keywords: ['ellipse', 'oval', 'circle', 'shape'],
  },
  {
    id: 'line',
    title: 'Line Tool',
    icon: 'minus',
    keywords: ['line', 'stroke', 'draw'],
  },
  {
    id: 'arrow',
    title: 'Arrow Tool',
    icon: 'arrow-right',
    keywords: ['arrow', 'pointer', 'connector'],
  },
  {
    id: 'pencil',
    title: 'Pencil Tool',
    icon: 'pencil',
    keywords: ['pencil', 'pen', 'freehand', 'draw', 'sketch'],
  },
  {
    id: 'text',
    title: 'Text Tool',
    icon: 'type',
    keywords: ['text', 'type', 'write', 'label'],
  },
]

/**
 * Creates tool switching actions.
 * Must be called after Pinia is initialized.
 */
export function createToolActions(): ActionDefinition[] {
  const toolStore = useToolStore()

  return TOOL_CONFIGS.map((config): ActionDefinition => ({
    id: `tool.${config.id}`,
    title: config.title,
    subtitle: `Switch to ${config.id} tool`,
    keywords: config.keywords,
    icon: config.icon,
    group: 'tool',
    contexts: ['global', 'canvas'],
    shortcutHint: TOOL_SHORTCUTS[config.id],
    priority: 100 - TOOL_CONFIGS.indexOf(config),
    when: (ctx) => ctx.activeTool !== config.id,
    run: () => {
      toolStore.setTool(config.id)
    },
  }))
}
