import type { ActionDefinition } from '../types/action'
import type { TextElement } from '../types/element'
import { useBoardStore } from '../stores/boardStore'
import { DEFAULT_ELEMENT_STYLE, DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY } from '../types/element'

/**
 * Element Actions
 *
 * Actions for manipulating canvas elements (shapes, lines, arrows, text, freehand).
 * These mirror widget actions but operate on elements.
 */

/**
 * Creates element manipulation actions.
 * Must be called after Pinia is initialized.
 */
export function createElementActions(): ActionDefinition[] {
  const boardStore = useBoardStore()

  return [
    // ============================================
    // ELEMENT MANIPULATION
    // ============================================
    {
      id: 'element.duplicate',
      title: 'Duplicate Element',
      subtitle: 'Create a copy of the selected element',
      keywords: ['copy', 'clone', 'duplicate', 'element'],
      icon: 'copy',
      group: 'element',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌘D',
      priority: 90,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          boardStore.duplicateElement(ctx.selectedElementId)
        }
      },
    },
    {
      id: 'element.delete',
      title: 'Delete Element',
      subtitle: 'Remove the selected element',
      keywords: ['remove', 'trash', 'delete', 'element'],
      icon: 'trash-2',
      group: 'element',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌫',
      priority: 80,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          boardStore.removeElement(ctx.selectedElementId)
        }
      },
    },
    {
      id: 'element.bring-to-front',
      title: 'Bring to Front',
      subtitle: 'Move element above all others',
      keywords: ['front', 'top', 'above', 'layer', 'element'],
      icon: 'layers',
      group: 'element',
      contexts: ['canvas'],
      priority: 70,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          boardStore.bringElementToFront(ctx.selectedElementId)
        }
      },
    },
    {
      id: 'element.send-to-back',
      title: 'Send to Back',
      subtitle: 'Move element below all others',
      keywords: ['back', 'bottom', 'below', 'layer', 'element'],
      icon: 'layers',
      group: 'element',
      contexts: ['canvas'],
      priority: 69,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          boardStore.sendElementToBack(ctx.selectedElementId)
        }
      },
    },

    // ============================================
    // ELEMENT CREATION (via context menu)
    // ============================================
    {
      id: 'element.add-rectangle',
      title: 'Add Rectangle',
      subtitle: 'Create a new rectangle',
      keywords: ['add', 'create', 'rectangle', 'shape'],
      icon: 'square',
      group: 'element',
      contexts: ['canvas'],
      priority: 60,
      run: (ctx) => {
        const x = ctx.pointerPosition?.x ?? 100
        const y = ctx.pointerPosition?.y ?? 100
        boardStore.addElement({
          type: 'rectangle',
          rect: { x, y, width: 150, height: 100 },
          style: { ...DEFAULT_ELEMENT_STYLE },
        })
      },
    },
    {
      id: 'element.add-ellipse',
      title: 'Add Ellipse',
      subtitle: 'Create a new ellipse',
      keywords: ['add', 'create', 'ellipse', 'circle', 'shape'],
      icon: 'circle',
      group: 'element',
      contexts: ['canvas'],
      priority: 59,
      run: (ctx) => {
        const x = ctx.pointerPosition?.x ?? 100
        const y = ctx.pointerPosition?.y ?? 100
        boardStore.addElement({
          type: 'ellipse',
          rect: { x, y, width: 120, height: 120 },
          style: { ...DEFAULT_ELEMENT_STYLE },
        })
      },
    },
    {
      id: 'element.add-text',
      title: 'Add Text',
      subtitle: 'Create a new text element',
      keywords: ['add', 'create', 'text', 'label'],
      icon: 'type',
      group: 'element',
      contexts: ['canvas'],
      priority: 58,
      run: (ctx) => {
        const x = ctx.pointerPosition?.x ?? 100
        const y = ctx.pointerPosition?.y ?? 100
        boardStore.addElement({
          type: 'text',
          rect: { x, y, width: 200, height: 40 },
          style: { ...DEFAULT_ELEMENT_STYLE },
          content: 'Text',
          fontFamily: DEFAULT_FONT_FAMILY,
          fontSize: DEFAULT_FONT_SIZE,
          fontWeight: 'normal',
          textAlign: 'left',
        } as Omit<TextElement, 'id' | 'zIndex'>)
      },
    },

    // ============================================
    // SELECTION
    // ============================================
    {
      id: 'element.clear-selection',
      title: 'Clear Element Selection',
      subtitle: 'Deselect the current element',
      keywords: ['deselect', 'clear', 'none', 'element'],
      icon: 'x',
      group: 'element',
      contexts: ['global'],
      shortcutHint: 'Esc',
      priority: 50,
      when: (ctx) => ctx.selectedElementId !== null,
      run: () => {
        boardStore.clearSelection()
      },
    },

    // ============================================
    // NUDGE ACTIONS
    // ============================================
    {
      id: 'element.nudge.up',
      title: 'Nudge Element Up',
      subtitle: 'Move selected element up by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'up', 'element'],
      group: 'element',
      contexts: ['global'],
      shortcutHint: '↑',
      priority: 40,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          const amount = ctx.shiftKey ? 10 : 1
          boardStore.nudgeElement(ctx.selectedElementId, 0, -amount)
        }
      },
    },
    {
      id: 'element.nudge.down',
      title: 'Nudge Element Down',
      subtitle: 'Move selected element down by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'down', 'element'],
      group: 'element',
      contexts: ['global'],
      shortcutHint: '↓',
      priority: 39,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          const amount = ctx.shiftKey ? 10 : 1
          boardStore.nudgeElement(ctx.selectedElementId, 0, amount)
        }
      },
    },
    {
      id: 'element.nudge.left',
      title: 'Nudge Element Left',
      subtitle: 'Move selected element left by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'left', 'element'],
      group: 'element',
      contexts: ['global'],
      shortcutHint: '←',
      priority: 38,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          const amount = ctx.shiftKey ? 10 : 1
          boardStore.nudgeElement(ctx.selectedElementId, -amount, 0)
        }
      },
    },
    {
      id: 'element.nudge.right',
      title: 'Nudge Element Right',
      subtitle: 'Move selected element right by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'right', 'element'],
      group: 'element',
      contexts: ['global'],
      shortcutHint: '→',
      priority: 37,
      when: (ctx) => ctx.selectedElementId !== null,
      run: (ctx) => {
        if (ctx.selectedElementId) {
          const amount = ctx.shiftKey ? 10 : 1
          boardStore.nudgeElement(ctx.selectedElementId, amount, 0)
        }
      },
    },
  ]
}
