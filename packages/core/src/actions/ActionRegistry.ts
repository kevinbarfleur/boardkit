import type {
  ActionDefinition,
  ActionContext,
  ActionFilterOptions,
  ModuleActionDefinition,
  ActionGroup,
} from '../types/action'

/**
 * ActionRegistry - Central registry for all actions in Boardkit.
 *
 * Single source of truth for:
 * - Command Palette entries
 * - Context menu items
 * - Keyboard shortcut handlers
 *
 * Actions can be registered by:
 * - Core (board operations, view controls)
 * - Modules (module-specific operations)
 */
export class ActionRegistry {
  private actions = new Map<string, ActionDefinition>()

  /**
   * Register an action.
   * @throws Error if action with same ID already exists
   */
  register(action: ActionDefinition): void {
    if (this.actions.has(action.id)) {
      console.warn(`[ActionRegistry] Action "${action.id}" already registered, overwriting.`)
    }
    this.actions.set(action.id, {
      ...action,
      priority: action.priority ?? 0,
    })
  }

  /**
   * Register multiple actions at once.
   */
  registerAll(actions: ActionDefinition[]): void {
    for (const action of actions) {
      this.register(action)
    }
  }

  /**
   * Register actions from a module.
   * Automatically sets group to 'module' and adds moduleId.
   */
  registerModuleActions(moduleId: string, actions: ModuleActionDefinition[]): void {
    for (const action of actions) {
      this.register({
        ...action,
        id: `${moduleId}.${action.id}`,
        group: 'module',
        moduleId,
      })
    }
  }

  /**
   * Unregister an action by ID.
   */
  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  /**
   * Unregister all actions from a module.
   */
  unregisterModule(moduleId: string): void {
    for (const [id, action] of this.actions) {
      if (action.moduleId === moduleId) {
        this.actions.delete(id)
      }
    }
  }

  /**
   * Get an action by ID.
   */
  get(actionId: string): ActionDefinition | undefined {
    return this.actions.get(actionId)
  }

  /**
   * Check if an action exists.
   */
  has(actionId: string): boolean {
    return this.actions.has(actionId)
  }

  /**
   * Get all actions, optionally filtered.
   */
  getAll(options?: ActionFilterOptions): ActionDefinition[] {
    let result = Array.from(this.actions.values())

    if (options?.context) {
      result = result.filter((a) => a.contexts.includes(options.context!))
    }

    if (options?.group) {
      result = result.filter((a) => a.group === options.group)
    }

    if (options?.moduleId) {
      result = result.filter((a) => a.moduleId === options.moduleId)
    }

    // Sort by group, then by priority (descending), then by title
    return result.sort((a, b) => {
      const groupOrder: Record<ActionGroup, number> = {
        board: 0,
        widget: 1,
        view: 2,
        module: 3,
      }
      const groupDiff = groupOrder[a.group] - groupOrder[b.group]
      if (groupDiff !== 0) return groupDiff

      const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0)
      if (priorityDiff !== 0) return priorityDiff

      return a.title.localeCompare(b.title)
    })
  }

  /**
   * Get actions available for a given context.
   * Filters by context type and evaluates `when` conditions.
   */
  getAvailable(ctx: ActionContext, options?: Omit<ActionFilterOptions, 'includeDisabled'>): ActionDefinition[] {
    const all = this.getAll(options)
    return all.filter((action) => {
      if (action.when && !action.when(ctx)) {
        return false
      }
      return true
    })
  }

  /**
   * Execute an action by ID.
   * @throws Error if action not found
   */
  async execute(actionId: string, ctx: ActionContext): Promise<void> {
    const action = this.get(actionId)
    if (!action) {
      throw new Error(`[ActionRegistry] Action "${actionId}" not found`)
    }

    // Check if action is available
    if (action.when && !action.when(ctx)) {
      console.warn(`[ActionRegistry] Action "${actionId}" is not available in current context`)
      return
    }

    await action.run(ctx)
  }

  /**
   * Search actions by query (fuzzy matching on title, subtitle, keywords).
   */
  search(query: string, ctx?: ActionContext): ActionDefinition[] {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) {
      return ctx ? this.getAvailable(ctx) : this.getAll()
    }

    const all = ctx ? this.getAvailable(ctx) : this.getAll()

    return all
      .map((action) => {
        let score = 0

        // Title match (highest weight)
        const titleLower = action.title.toLowerCase()
        if (titleLower === normalizedQuery) {
          score += 100
        } else if (titleLower.startsWith(normalizedQuery)) {
          score += 80
        } else if (titleLower.includes(normalizedQuery)) {
          score += 60
        }

        // Subtitle match
        if (action.subtitle?.toLowerCase().includes(normalizedQuery)) {
          score += 30
        }

        // Keywords match
        if (action.keywords) {
          for (const keyword of action.keywords) {
            if (keyword.toLowerCase().includes(normalizedQuery)) {
              score += 40
              break
            }
          }
        }

        // ID match (for power users)
        if (action.id.toLowerCase().includes(normalizedQuery)) {
          score += 20
        }

        return { action, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.action)
  }

  /**
   * Clear all registered actions.
   */
  clear(): void {
    this.actions.clear()
  }

  /**
   * Get count of registered actions.
   */
  get size(): number {
    return this.actions.size
  }
}

// Singleton instance
export const actionRegistry = new ActionRegistry()
