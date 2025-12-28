import type { Widget, Viewport } from './document'
import type { CanvasElement } from './element'
import type { ToolType } from './tool'

/**
 * Action System for Boardkit
 *
 * Actions are the single source of truth for all user-triggered operations.
 * They can be invoked from:
 * - Command Palette (Cmd/Ctrl + K)
 * - Context Menus (right-click)
 * - Keyboard Shortcuts
 *
 * This prevents duplication of logic across different UI entry points.
 */

/**
 * Context provided to actions when executed.
 * Contains all information needed to determine action availability and behavior.
 */
export interface ActionContext {
  /** Currently selected widget, if any */
  selectedWidget: Widget | null
  /** ID of the selected widget */
  selectedWidgetId: string | null
  /** Currently selected element, if any */
  selectedElement: CanvasElement | null
  /** ID of the selected element */
  selectedElementId: string | null
  /** Current active tool */
  activeTool: ToolType
  /** Current viewport state */
  viewport: Viewport
  /** All widgets on the board */
  widgets: Widget[]
  /** All elements on the board */
  elements: CanvasElement[]
  /** Pointer position in canvas coordinates (for "add here" actions) */
  pointerPosition?: { x: number; y: number }
  /** Platform detection */
  platform: 'web' | 'desktop'
  /** Whether the board has unsaved changes */
  isDirty: boolean
}

/**
 * Groups for organizing actions in menus and palette.
 */
export type ActionGroup = 'board' | 'widget' | 'element' | 'tool' | 'view' | 'module'

/**
 * Context types for filtering actions.
 * - 'global': Always available (palette, shortcuts)
 * - 'canvas': Available when right-clicking on empty canvas
 * - 'widget': Available when a widget is selected or right-clicked
 */
export type ActionContextType = 'global' | 'canvas' | 'widget'

/**
 * Definition of an action in the system.
 */
export interface ActionDefinition {
  /** Unique stable identifier (e.g., 'widget.duplicate', 'board.reset-view') */
  id: string
  /** Display title shown in palette and menus */
  title: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Keywords for fuzzy search in command palette */
  keywords?: string[]
  /** Lucide icon name (must be registered in BkIcon) */
  icon?: string
  /** Group for organization */
  group: ActionGroup
  /** Context types where this action should appear */
  contexts: ActionContextType[]
  /** Display-only shortcut hints (e.g., ['Cmd+D', 'Ctrl+D']) */
  shortcutHint?: string
  /** Priority for ordering (higher = shown first within group) */
  priority?: number
  /** Module ID if this action is contributed by a module */
  moduleId?: string
  /** Determine if action is visible/enabled based on context */
  when?: (ctx: ActionContext) => boolean
  /** Execute the action */
  run: (ctx: ActionContext) => Promise<void> | void
}

/**
 * Simplified action definition for module contributions.
 * Automatically sets group to 'module' and adds moduleId.
 */
export interface ModuleActionDefinition {
  id: string
  title: string
  subtitle?: string
  keywords?: string[]
  icon?: string
  contexts: ActionContextType[]
  shortcutHint?: string
  priority?: number
  when?: (ctx: ActionContext) => boolean
  run: (ctx: ActionContext) => Promise<void> | void
}

/**
 * Options for filtering actions.
 */
export interface ActionFilterOptions {
  /** Filter by context type */
  context?: ActionContextType
  /** Filter by group */
  group?: ActionGroup
  /** Filter by module */
  moduleId?: string
  /** Include disabled actions (those where when() returns false) */
  includeDisabled?: boolean
}
