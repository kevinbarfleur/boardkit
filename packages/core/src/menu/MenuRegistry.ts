/**
 * MenuRegistry - Central registry for application menus.
 *
 * Single source of truth for the menu bar structure.
 * Manages core menus and plugin contributions.
 *
 * @example
 * ```typescript
 * import { menuRegistry } from '@boardkit/core'
 *
 * // Register a core menu
 * menuRegistry.registerCoreMenu({
 *   id: 'file',
 *   label: 'File',
 *   items: [...]
 * })
 *
 * // Plugin contribution
 * menuRegistry.registerContribution('my-plugin', {
 *   items: [{
 *     menuId: 'file',
 *     afterId: 'export',
 *     items: [{ id: 'sync', label: 'Sync...' }]
 *   }]
 * })
 * ```
 */

import type {
  MenuDefinition,
  MenuContribution,
  MenuItem,
  MenuItemContribution,
} from '../types/menu'

export class MenuRegistry {
  /** Core menus (registered by the app) */
  private coreMenus = new Map<string, MenuDefinition>()

  /** Plugin contributions (moduleId -> contribution) */
  private contributions = new Map<string, MenuContribution>()

  /** Event listeners for menu changes */
  private listeners = new Set<() => void>()

  /**
   * Register a core menu.
   * Core menus are the base menus (File, Edit, View, etc.)
   */
  registerCoreMenu(menu: MenuDefinition): void {
    if (this.coreMenus.has(menu.id)) {
      console.warn(`[MenuRegistry] Core menu "${menu.id}" already registered, overwriting.`)
    }
    this.coreMenus.set(menu.id, menu)
    this.notifyListeners()
  }

  /**
   * Register multiple core menus at once.
   */
  registerCoreMenus(menus: MenuDefinition[]): void {
    for (const menu of menus) {
      this.coreMenus.set(menu.id, menu)
    }
    this.notifyListeners()
  }

  /**
   * Register a plugin's menu contribution.
   * Contributions can add new menus or items to existing menus.
   */
  registerContribution(pluginId: string, contribution: MenuContribution): void {
    if (this.contributions.has(pluginId)) {
      console.warn(`[MenuRegistry] Contribution from "${pluginId}" already registered, overwriting.`)
    }
    this.contributions.set(pluginId, contribution)
    this.notifyListeners()
  }

  /**
   * Unregister a plugin's menu contribution.
   */
  unregisterContribution(pluginId: string): void {
    if (this.contributions.delete(pluginId)) {
      this.notifyListeners()
    }
  }

  /**
   * Get all menus, merged with plugin contributions.
   * Returns menus sorted by position.
   */
  getMenus(platform?: 'web' | 'desktop'): MenuDefinition[] {
    // Start with core menus
    const menus = new Map<string, MenuDefinition>()

    for (const [id, menu] of this.coreMenus) {
      // Filter by platform
      if (platform && menu.platform && menu.platform !== platform) {
        continue
      }
      menus.set(id, { ...menu, items: [...menu.items] })
    }

    // Process plugin contributions
    for (const [pluginId, contribution] of this.contributions) {
      // Add new menus from plugins
      if (contribution.menus) {
        for (const menu of contribution.menus) {
          if (platform && menu.platform && menu.platform !== platform) {
            continue
          }
          // Prefix plugin menu IDs to avoid collisions
          const prefixedId = `${pluginId}.${menu.id}`
          const prefixedMenu: MenuDefinition = {
            ...menu,
            id: prefixedId,
            items: menu.items.map((item) => ({
              ...item,
              id: `${pluginId}.${item.id}`,
            })),
          }
          menus.set(prefixedId, prefixedMenu)
        }
      }

      // Insert items into existing menus
      if (contribution.items) {
        for (const itemContrib of contribution.items) {
          const targetMenu = menus.get(itemContrib.menuId)
          if (!targetMenu) {
            console.warn(
              `[MenuRegistry] Plugin "${pluginId}" tried to contribute to non-existent menu "${itemContrib.menuId}"`
            )
            continue
          }

          // Prefix contributed item IDs
          const prefixedItems = itemContrib.items.map((item) => ({
            ...item,
            id: `${pluginId}.${item.id}`,
          }))

          this.insertItems(targetMenu, itemContrib, prefixedItems)
        }
      }
    }

    // Sort by position
    return Array.from(menus.values()).sort((a, b) => {
      const posA = this.getPositionValue(a.position)
      const posB = this.getPositionValue(b.position)
      return posA - posB
    })
  }

  /**
   * Get a specific menu by ID, merged with contributions.
   */
  getMenu(menuId: string, platform?: 'web' | 'desktop'): MenuDefinition | undefined {
    return this.getMenus(platform).find((m) => m.id === menuId)
  }

  /**
   * Subscribe to menu changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Clear all registered menus and contributions.
   */
  clear(): void {
    this.coreMenus.clear()
    this.contributions.clear()
    this.notifyListeners()
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private insertItems(
    menu: MenuDefinition,
    contrib: MenuItemContribution,
    items: MenuItem[]
  ): void {
    if (contrib.beforeId) {
      const index = menu.items.findIndex((i) => i.id === contrib.beforeId)
      if (index !== -1) {
        menu.items.splice(index, 0, ...items)
        return
      }
    }

    if (contrib.afterId) {
      const index = menu.items.findIndex((i) => i.id === contrib.afterId)
      if (index !== -1) {
        menu.items.splice(index + 1, 0, ...items)
        return
      }
    }

    // Default: append at end
    menu.items.push(...items)
  }

  private getPositionValue(position: MenuDefinition['position']): number {
    if (position === undefined) return 50 // Default middle
    if (position === 'start') return 0
    if (position === 'end') return 100
    return position
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        console.error('[MenuRegistry] Error in listener:', error)
      }
    }
  }
}

/**
 * Global menu registry singleton.
 */
export const menuRegistry = new MenuRegistry()
