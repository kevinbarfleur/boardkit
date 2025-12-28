import type { ActionDefinition } from '../types/action'
import { useBoardStore } from '../stores/boardStore'

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
          content: 'Text',
          fontFamily: 'system',
          fontSize: 16,
          fontWeight: 'normal',
          textAlign: 'left',
        })
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
  ]
}
