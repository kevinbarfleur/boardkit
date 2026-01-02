import type { ActionDefinition } from '../types/action'
import { actionRegistry } from './ActionRegistry'
import { moduleRegistry } from '../modules/ModuleRegistry'
import { useBoardStore } from '../stores/boardStore'
import { createToolActions } from './toolActions'
import { createElementActions } from './elementActions'
import { createDataActions } from './dataActions'

/**
 * Menu Action Bus
 *
 * Event bus for menu bar actions that need to be handled by the app layer.
 * Actions like "New Board", "Open...", "Export..." emit events that the
 * app (web or desktop) subscribes to and handles appropriately.
 */
export type MenuActionEvent =
  | { type: 'board.new' }
  | { type: 'board.open' }
  | { type: 'board.export' }
  | { type: 'app.settings' }
  | { type: 'vault.change' }
  | { type: 'vault.secrets' }
  | { type: 'vault.reveal' }

type MenuActionEventHandler = (event: MenuActionEvent) => void

class MenuActionBus {
  private handlers: Set<MenuActionEventHandler> = new Set()

  subscribe(handler: MenuActionEventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  emit(eventType: MenuActionEvent['type']): void {
    const event = { type: eventType } as MenuActionEvent
    for (const handler of this.handlers) {
      handler(event)
    }
  }
}

export const menuActionBus = new MenuActionBus()

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
      icon: module.icon ?? 'plus',
      group: 'module',
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
      subtitle: 'Remove selected items',
      keywords: ['remove', 'trash', 'delete'],
      icon: 'trash-2',
      group: 'widget',
      contexts: ['global', 'widget'],
      shortcutHint: '⌫',
      priority: 80,
      when: (ctx) => ctx.selectionCount > 0,
      run: (ctx) => {
        // For multi-selection, use removeSelection
        if (ctx.isMultiSelection) {
          store.removeSelection()
        } else if (ctx.selectedWidgetId) {
          store.removeWidget(ctx.selectedWidgetId)
        } else if (ctx.selectedElementId) {
          store.removeElement(ctx.selectedElementId)
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
    // UNDO/REDO ACTIONS
    // ============================================
    {
      id: 'board.undo',
      title: 'Undo',
      subtitle: 'Undo the last action',
      keywords: ['undo', 'back', 'revert', 'cancel'],
      icon: 'undo-2',
      group: 'board',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌘Z',
      priority: 200,
      when: () => store.canUndo,
      run: () => {
        store.undo()
      },
    },
    {
      id: 'board.redo',
      title: 'Redo',
      subtitle: 'Redo the last undone action',
      keywords: ['redo', 'forward', 'repeat'],
      icon: 'redo-2',
      group: 'board',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌘⇧Z',
      priority: 199,
      when: () => store.canRedo,
      run: () => {
        store.redo()
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
    {
      id: 'view.toggle-grid',
      title: 'Toggle Grid Snapping',
      subtitle: 'Enable or disable snap to grid',
      keywords: ['grid', 'snap', 'align', 'toggle'],
      icon: 'grid-3x3',
      group: 'view',
      contexts: ['global', 'canvas'],
      shortcutHint: "⌘'",
      priority: 85,
      run: () => {
        store.toggleGrid()
      },
    },

    // ============================================
    // MENU BAR ACTIONS
    // These emit events for apps to handle.
    // ============================================
    {
      id: 'board.new',
      title: 'New Board',
      subtitle: 'Create a new board',
      keywords: ['new', 'create', 'board'],
      icon: 'plus',
      group: 'board',
      contexts: ['global'],
      shortcutHint: '⌘N',
      priority: 200,
      run: () => {
        menuActionBus.emit('board.new')
      },
    },
    {
      id: 'board.open',
      title: 'Open Board',
      subtitle: 'Open an existing board',
      keywords: ['open', 'load', 'board'],
      icon: 'folder-open',
      group: 'board',
      contexts: ['global'],
      shortcutHint: '⌘O',
      priority: 199,
      run: () => {
        menuActionBus.emit('board.open')
      },
    },
    {
      id: 'board.export',
      title: 'Export',
      subtitle: 'Export the current board',
      keywords: ['export', 'download', 'save'],
      icon: 'download',
      group: 'board',
      contexts: ['global'],
      shortcutHint: '⇧⌘E',
      priority: 195,
      run: () => {
        menuActionBus.emit('board.export')
      },
    },
    {
      id: 'app.settings',
      title: 'Settings',
      subtitle: 'Open application settings',
      keywords: ['settings', 'preferences', 'options'],
      icon: 'settings',
      group: 'board',
      contexts: ['global'],
      shortcutHint: '⌘,',
      priority: 50,
      run: () => {
        menuActionBus.emit('app.settings')
      },
    },
    {
      id: 'edit.cut',
      title: 'Cut',
      subtitle: 'Cut selected items to clipboard',
      keywords: ['cut', 'remove'],
      icon: 'scissors',
      group: 'widget',
      contexts: ['global', 'widget'],
      shortcutHint: '⌘X',
      priority: 75,
      when: (ctx) => ctx.selectionCount > 0,
      run: () => {
        store.cutSelection()
      },
    },
    {
      id: 'edit.copy',
      title: 'Copy',
      subtitle: 'Copy selected items to clipboard',
      keywords: ['copy', 'duplicate'],
      icon: 'copy',
      group: 'widget',
      contexts: ['global', 'widget'],
      shortcutHint: '⌘C',
      priority: 74,
      when: (ctx) => ctx.selectionCount > 0,
      run: () => {
        store.copySelection()
      },
    },
    {
      id: 'edit.paste',
      title: 'Paste',
      subtitle: 'Paste items from clipboard',
      keywords: ['paste', 'insert'],
      icon: 'clipboard',
      group: 'widget',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌘V',
      priority: 73,
      when: () => store.hasClipboardContent(),
      run: () => {
        store.pasteFromClipboard()
      },
    },
    {
      id: 'vault.change',
      title: 'Change Vault',
      subtitle: 'Select a different vault folder',
      keywords: ['vault', 'folder', 'change'],
      icon: 'folder',
      group: 'board',
      contexts: ['global'],
      priority: 40,
      when: (ctx) => ctx.platform === 'desktop',
      run: () => {
        menuActionBus.emit('vault.change')
      },
    },
    {
      id: 'vault.secrets',
      title: 'Board Secrets',
      subtitle: 'Manage secrets for this board',
      keywords: ['secrets', 'keys', 'credentials'],
      icon: 'key-round',
      group: 'board',
      contexts: ['global'],
      priority: 39,
      when: (ctx) => ctx.platform === 'desktop',
      run: () => {
        menuActionBus.emit('vault.secrets')
      },
    },
    {
      id: 'vault.reveal',
      title: 'Reveal in Finder',
      subtitle: 'Open vault folder in Finder',
      keywords: ['reveal', 'finder', 'open'],
      icon: 'external-link',
      group: 'board',
      contexts: ['global'],
      priority: 38,
      when: (ctx) => ctx.platform === 'desktop',
      run: () => {
        menuActionBus.emit('vault.reveal')
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
    // NUDGE ACTIONS
    // ============================================
    {
      id: 'widget.nudge.up',
      title: 'Nudge Up',
      subtitle: 'Move selected widget up by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'up'],
      icon: 'move-up',
      group: 'widget',
      contexts: ['global'],
      shortcutHint: '↑',
      priority: 40,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          const amount = ctx.shiftKey ? 10 : 1
          store.nudgeWidget(ctx.selectedWidgetId, 0, -amount)
        }
      },
    },
    {
      id: 'widget.nudge.down',
      title: 'Nudge Down',
      subtitle: 'Move selected widget down by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'down'],
      icon: 'move-down',
      group: 'widget',
      contexts: ['global'],
      shortcutHint: '↓',
      priority: 39,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          const amount = ctx.shiftKey ? 10 : 1
          store.nudgeWidget(ctx.selectedWidgetId, 0, amount)
        }
      },
    },
    {
      id: 'widget.nudge.left',
      title: 'Nudge Left',
      subtitle: 'Move selected widget left by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'left'],
      icon: 'move-left',
      group: 'widget',
      contexts: ['global'],
      shortcutHint: '←',
      priority: 38,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          const amount = ctx.shiftKey ? 10 : 1
          store.nudgeWidget(ctx.selectedWidgetId, -amount, 0)
        }
      },
    },
    {
      id: 'widget.nudge.right',
      title: 'Nudge Right',
      subtitle: 'Move selected widget right by 1px (or 10px with Shift)',
      keywords: ['nudge', 'move', 'right'],
      icon: 'move-right',
      group: 'widget',
      contexts: ['global'],
      shortcutHint: '→',
      priority: 37,
      when: (ctx) => ctx.selectedWidgetId !== null,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          const amount = ctx.shiftKey ? 10 : 1
          store.nudgeWidget(ctx.selectedWidgetId, amount, 0)
        }
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
