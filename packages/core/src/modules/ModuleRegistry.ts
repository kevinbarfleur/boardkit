import { ref, type Ref } from 'vue'
import type { ModuleDefinition } from '../types/module'

/**
 * Registry for all available modules.
 * Modules must be registered before they can be used.
 *
 * The registry is reactive - Vue components can watch for changes
 * using the `version` ref which increments on any mutation.
 */
class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map()

  /**
   * Reactive version counter - increments on any registry change.
   * Use this in computed properties to react to registry changes.
   */
  readonly version: Ref<number> = ref(0)

  /**
   * Register a module with the registry.
   * @throws Error if a module with the same ID is already registered
   */
  register<TState>(module: ModuleDefinition<TState>): void {
    if (this.modules.has(module.moduleId)) {
      throw new Error(`Module "${module.moduleId}" is already registered`)
    }
    this.modules.set(module.moduleId, module as ModuleDefinition)
    this.version.value++
  }

  /**
   * Get a module by its ID.
   * @returns The module definition or undefined if not found
   */
  get<TState = unknown>(moduleId: string): ModuleDefinition<TState> | undefined {
    return this.modules.get(moduleId) as ModuleDefinition<TState> | undefined
  }

  /**
   * Check if a module is registered.
   */
  has(moduleId: string): boolean {
    return this.modules.has(moduleId)
  }

  /**
   * Get all registered modules.
   */
  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values())
  }

  /**
   * Get all module IDs.
   */
  getIds(): string[] {
    return Array.from(this.modules.keys())
  }

  /**
   * Unregister a module.
   * @returns true if the module was unregistered, false if it wasn't registered
   */
  unregister(moduleId: string): boolean {
    const result = this.modules.delete(moduleId)
    if (result) {
      this.version.value++
    }
    return result
  }

  /**
   * Clear all registered modules.
   */
  clear(): void {
    this.modules.clear()
    this.version.value++
  }
}

// Export a singleton instance
export const moduleRegistry = new ModuleRegistry()

// Also export the class for testing
export { ModuleRegistry }
