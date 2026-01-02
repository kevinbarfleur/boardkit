/**
 * Menu System Types for Boardkit
 *
 * Defines the structure for the macOS-style menu bar.
 * Menus can be contributed by core and by plugins.
 */

import type { ActionContext } from './action'

/**
 * Represents a single item in a menu.
 */
export interface MenuItem {
  /** Unique identifier for this item */
  id: string
  /** Display label */
  label: string
  /** Lucide icon name (optional) */
  icon?: string
  /** Keyboard shortcut hint (display only, e.g., "⌘N") */
  shortcutHint?: string
  /**
   * Action ID to execute from ActionRegistry.
   * If provided, clicking this item will execute the action.
   */
  actionId?: string
  /**
   * Direct run function (alternative to actionId).
   * Use for simple items that don't need ActionRegistry.
   */
  run?: (ctx: ActionContext) => void | Promise<void>
  /**
   * Condition for displaying/enabling this item.
   * Return false to hide or disable.
   */
  when?: (ctx: ActionContext) => boolean
  /** Nested submenu items */
  submenu?: MenuItem[]
  /** If true, this is a separator (id and label are ignored) */
  separator?: boolean
  /** If true, styled as destructive action (red text) */
  destructive?: boolean
  /** Priority for ordering within the menu (higher = first) */
  priority?: number
}

/**
 * Creates a separator item for use in menus.
 */
export function menuSeparator(): MenuItem {
  return { id: '__separator__', label: '', separator: true }
}

/**
 * Definition of a top-level menu.
 */
export interface MenuDefinition {
  /** Unique identifier for this menu */
  id: string
  /** Display label for the menu */
  label: string
  /**
   * Position in the menu bar.
   * - 'start': Left side (after logo)
   * - 'end': Right side (before actions)
   * - number: Specific order (lower = more left)
   */
  position?: 'start' | 'end' | number
  /** Menu items */
  items: MenuItem[]
  /**
   * Condition for displaying this entire menu.
   * Return false to hide.
   */
  when?: (ctx: ActionContext) => boolean
  /** Platform restriction: 'web' | 'desktop' | undefined (both) */
  platform?: 'web' | 'desktop'
}

/**
 * Menu contribution from a plugin/module.
 * Allows adding new menus or items to existing menus.
 */
export interface MenuContribution {
  /**
   * New top-level menus to add.
   */
  menus?: MenuDefinition[]
  /**
   * Items to insert into existing menus.
   */
  items?: MenuItemContribution[]
}

/**
 * Contribution of items to an existing menu.
 */
export interface MenuItemContribution {
  /** ID of the target menu (e.g., 'file', 'edit') */
  menuId: string
  /**
   * ID of the item after which to insert.
   * If not provided, items are appended at the end.
   */
  afterId?: string
  /**
   * ID of the item before which to insert.
   * Takes precedence over afterId if both are provided.
   */
  beforeId?: string
  /** Items to add */
  items: MenuItem[]
}

/**
 * Core menu IDs used by Boardkit.
 */
export const CORE_MENU_IDS = {
  FILE: 'file',
  EDIT: 'edit',
  VIEW: 'view',
  VAULT: 'vault', // Desktop only
} as const

export type CoreMenuId = (typeof CORE_MENU_IDS)[keyof typeof CORE_MENU_IDS]
