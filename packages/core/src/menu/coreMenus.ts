/**
 * Core Menu Definitions for Boardkit
 *
 * Defines the default menu bar structure:
 * - File: New, Open, Export, Settings
 * - Edit: Undo, Redo, Cut, Copy, Paste, Delete, Duplicate
 * - View: Zoom, Grid
 * - Vault (desktop only): Change Vault, Board Secrets, Reveal
 */

import type { MenuDefinition } from '../types/menu'
import { menuSeparator, CORE_MENU_IDS } from '../types/menu'
import { menuRegistry } from './MenuRegistry'

/**
 * File Menu
 */
const fileMenu: MenuDefinition = {
  id: CORE_MENU_IDS.FILE,
  label: 'File',
  position: 1,
  items: [
    {
      id: 'new',
      label: 'New Board',
      icon: 'plus',
      shortcutHint: '⌘N',
      actionId: 'board.new',
    },
    {
      id: 'open',
      label: 'Open...',
      icon: 'folder-open',
      shortcutHint: '⌘O',
      actionId: 'board.open',
    },
    {
      id: 'recent',
      label: 'Open Recent',
      icon: 'clock',
      submenu: [], // Dynamically populated
    },
    menuSeparator(),
    {
      id: 'export',
      label: 'Export...',
      icon: 'download',
      shortcutHint: '⇧⌘E',
      actionId: 'board.export',
    },
    menuSeparator(),
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      shortcutHint: '⌘,',
      actionId: 'app.settings',
    },
  ],
}

/**
 * Edit Menu
 */
const editMenu: MenuDefinition = {
  id: CORE_MENU_IDS.EDIT,
  label: 'Edit',
  position: 2,
  items: [
    {
      id: 'undo',
      label: 'Undo',
      icon: 'undo-2',
      shortcutHint: '⌘Z',
      actionId: 'board.undo',
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: 'redo-2',
      shortcutHint: '⇧⌘Z',
      actionId: 'board.redo',
    },
    menuSeparator(),
    {
      id: 'cut',
      label: 'Cut',
      icon: 'scissors',
      shortcutHint: '⌘X',
      actionId: 'edit.cut',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: 'copy',
      shortcutHint: '⌘C',
      actionId: 'edit.copy',
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: 'clipboard',
      shortcutHint: '⌘V',
      actionId: 'edit.paste',
    },
    menuSeparator(),
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash-2',
      shortcutHint: '⌫',
      actionId: 'widget.delete',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      shortcutHint: '⌘D',
      actionId: 'widget.duplicate',
    },
  ],
}

/**
 * View Menu
 */
const viewMenu: MenuDefinition = {
  id: CORE_MENU_IDS.VIEW,
  label: 'View',
  position: 3,
  items: [
    {
      id: 'zoom-in',
      label: 'Zoom In',
      icon: 'zoom-in',
      shortcutHint: '⌘+',
      actionId: 'view.zoom-in',
    },
    {
      id: 'zoom-out',
      label: 'Zoom Out',
      icon: 'zoom-out',
      shortcutHint: '⌘-',
      actionId: 'view.zoom-out',
    },
    {
      id: 'fit-screen',
      label: 'Fit to Screen',
      icon: 'maximize-2',
      shortcutHint: '⌘0',
      actionId: 'view.reset',
    },
    menuSeparator(),
    {
      id: 'toggle-grid',
      label: 'Toggle Grid',
      icon: 'grid-3x3',
      shortcutHint: "⌘'",
      actionId: 'view.toggle-grid',
    },
  ],
}

/**
 * Vault Menu (Desktop only)
 */
const vaultMenu: MenuDefinition = {
  id: CORE_MENU_IDS.VAULT,
  label: 'Vault',
  position: 4,
  platform: 'desktop',
  items: [
    {
      id: 'change-vault',
      label: 'Change Vault...',
      icon: 'folder',
      actionId: 'vault.change',
    },
    menuSeparator(),
    {
      id: 'secrets',
      label: 'Board Secrets...',
      icon: 'key-round',
      actionId: 'vault.secrets',
    },
    {
      id: 'reveal',
      label: 'Reveal in Finder',
      icon: 'external-link',
      actionId: 'vault.reveal',
    },
  ],
}

/**
 * All core menus
 */
export const coreMenus: MenuDefinition[] = [fileMenu, editMenu, viewMenu, vaultMenu]

/**
 * Register all core menus with the MenuRegistry.
 * Call this once at app startup.
 */
export function registerCoreMenus(): void {
  menuRegistry.registerCoreMenus(coreMenus)
}
