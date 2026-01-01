import { defineModule } from '@boardkit/core'
import type { ModuleDefinition } from '@boardkit/core'
import type { PluginDefinition } from './types'

/**
 * Define a Boardkit plugin.
 *
 * This is the main entry point for creating plugins.
 * It wraps the internal `defineModule` function and adds plugin-specific
 * lifecycle hooks.
 *
 * @example
 * ```typescript
 * import { definePlugin } from '@boardkit/plugin-api'
 *
 * export default definePlugin({
 *   pluginId: 'my-plugin',
 *   version: '1.0.0',
 *   displayName: 'My Plugin',
 *   component: MyPluginWidget,
 *   defaultState: () => ({ count: 0 }),
 *   serialize: (state) => state,
 *   deserialize: (data) => data as MyPluginState,
 *
 *   // Lifecycle hooks (optional)
 *   onInstall: async () => {
 *     console.log('Plugin installed!')
 *   },
 *   onEnable: () => {
 *     console.log('Plugin enabled!')
 *   },
 * })
 * ```
 */
export function definePlugin<TState>(
  definition: PluginDefinition<TState>
): ModuleDefinition<TState> & {
  __pluginMeta: {
    pluginId: string
    version: string
    lifecycle: {
      onInstall?: () => Promise<void> | void
      onEnable?: () => void
      onDisable?: () => void
      onUninstall?: () => Promise<void> | void
      onUpdate?: (previousVersion: string) => Promise<void> | void
    }
  }
} {
  // Extract lifecycle hooks
  const {
    pluginId,
    version,
    onInstall,
    onEnable,
    onDisable,
    onUninstall,
    onUpdate,
    ...moduleDefinition
  } = definition

  // Create the base module definition
  const module = defineModule<TState>({
    ...moduleDefinition,
    // Use pluginId as moduleId for consistency
    moduleId: pluginId,
    version,
  })

  // Attach plugin metadata for the PluginManager to use
  return {
    ...module,
    __pluginMeta: {
      pluginId,
      version,
      lifecycle: {
        onInstall,
        onEnable,
        onDisable,
        onUninstall,
        onUpdate,
      },
    },
  }
}
