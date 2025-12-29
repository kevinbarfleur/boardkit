import type { ActionDefinition } from '../types/action'
import { actionRegistry } from './ActionRegistry'
import { moduleRegistry } from '../modules/ModuleRegistry'
import { useBoardStore } from '../stores/boardStore'
import { createToolActions } from './toolActions'
import { createElementActions } from './elementActions'
import { createDataActions } from './dataActions'

/**
 * Core actions for Boardkit.
 * These are the fundamental operations available in the application.
 */

/**
 * Creates action definitions with store access.
 * Must be called after Pinia is initialized.
 */
function createCoreActions(): ActionDefinition[] {
  const store = useBoardStore()

  return [
    // ============================================
    // BOARD ACTIONS
    // ============================================

    // Dynamic "Add Widget" actions - one per registered module
    ...moduleRegistry.getAll().map((module): ActionDefinition => ({
      id: `board.add-${module.moduleId}`,
      title: `Add ${module.displayName}`,
      subtitle: 'Create a new widget on the board',
      keywords: ['create', 'new', 'widget', module.moduleId, module.displayName.toLowerCase()],
      icon: 'plus',
      group: 'board',
      contexts: ['global', 'canvas'],
      priority: 100,
      run: (ctx) => {
        // If pointer position is available (from context menu), use it
        if (ctx.pointerPosition) {
          store.addWidget(module.moduleId, ctx.pointerPosition.x, ctx.pointerPosition.y)
        } else {
          store.addWidget(module.moduleId)
        }
      },
    })),

    // ============================================
    // WIDGET ACTIONS
    // ============================================
    {
      id: 'widget.duplicate',
      title: 'Duplicate',
      subtitle: 'Create a copy of the selected widget',
      keywords: ['copy', 'clone', 'duplicate'],
      icon: 'copy',
      group: 'widget',
      contexts: ['global', 'widget'],
      shortcutHint: '⌘D',
      priority: 90,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          store.duplicateWidget(ctx.selectedWidgetId)
        }
      },
    },
    {
      id: 'widget.delete',
      title: 'Delete',
      subtitle: 'Remove the selected widget',
      keywords: ['remove', 'trash', 'delete'],
      icon: 'trash-2',
      group: 'widget',
      contexts: ['global', 'widget'],
      shortcutHint: '⌫',
      priority: 80,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          store.removeWidget(ctx.selectedWidgetId)
        }
      },
    },
    {
      id: 'widget.bring-to-front',
      title: 'Bring to Front',
      subtitle: 'Move widget above all others',
      keywords: ['front', 'top', 'above', 'layer'],
      icon: 'layers',
      group: 'widget',
      contexts: ['widget'],
      priority: 70,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          // Re-select to bring to front (existing behavior in selectWidget)
          store.selectWidget(ctx.selectedWidgetId)
        }
      },
    },

    // ============================================
    // VIEW ACTIONS
    // ============================================
    {
      id: 'view.reset',
      title: 'Reset View',
      subtitle: 'Reset zoom and pan to default',
      keywords: ['reset', 'zoom', 'center', 'home', 'fit'],
      icon: 'rotate-ccw',
      group: 'view',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌘0',
      priority: 100,
      run: () => {
        store.updateViewport({ x: 0, y: 0, zoom: 1 })
      },
    },
    {
      id: 'view.zoom-in',
      title: 'Zoom In',
      subtitle: 'Increase zoom level',
      keywords: ['zoom', 'in', 'larger', 'bigger'],
      icon: 'zoom-in',
      group: 'view',
      contexts: ['global'],
      shortcutHint: '⌘+',
      priority: 90,
      run: (ctx) => {
        const newZoom = Math.min(3, ctx.viewport.zoom * 1.25)
        store.updateViewport({ zoom: newZoom })
      },
    },
    {
      id: 'view.zoom-out',
      title: 'Zoom Out',
      subtitle: 'Decrease zoom level',
      keywords: ['zoom', 'out', 'smaller'],
      icon: 'zoom-out',
      group: 'view',
      contexts: ['global'],
      shortcutHint: '⌘-',
      priority: 89,
      run: (ctx) => {
        const newZoom = Math.max(0.1, ctx.viewport.zoom * 0.8)
        store.updateViewport({ zoom: newZoom })
      },
    },

    // ============================================
    // SELECTION ACTIONS
    // ============================================
    {
      id: 'selection.clear',
      title: 'Clear Selection',
      subtitle: 'Deselect the current widget or element',
      keywords: ['deselect', 'clear', 'none'],
      icon: 'x',
      group: 'widget',
      contexts: ['global'],
      shortcutHint: 'Esc',
      priority: 60,
      when: (ctx) => ctx.selectedWidgetId !== null || ctx.selectedElementId !== null,
      run: () => {
        store.clearSelection()
      },
    },

    // ============================================
    // TOOL ACTIONS
    // ============================================
    ...createToolActions(),

    // ============================================
    // ELEMENT ACTIONS
    // ============================================
    ...createElementActions(),

    // ============================================
    // DATA SHARING ACTIONS
    // ============================================
    ...createDataActions(),
  ]
}

/**
 * Register all core actions.
 * Call this once after Pinia and module registry are initialized.
 */
export function registerCoreActions(): void {
  const actions = createCoreActions()
  actionRegistry.registerAll(actions)
}

/**
 * Refresh dynamic actions (e.g., after modules are registered).
 * Clears non-module actions and re-registers them.
 */
export function refreshCoreActions(): void {
  // Remove existing core actions (non-module ones)
  const coreActionIds = actionRegistry
    .getAll()
    .filter((a) => !a.moduleId)
    .map((a) => a.id)

  for (const id of coreActionIds) {
    actionRegistry.unregister(id)
  }

  // Re-register
  registerCoreActions()
}
