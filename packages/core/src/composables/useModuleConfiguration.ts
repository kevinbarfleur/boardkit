/**
 * useModuleConfiguration
 *
 * Composable for checking if a module is properly configured.
 * Used by widgets to show "Setup Required" state when configuration is needed.
 */

import { computed, type ComputedRef } from 'vue'
import { moduleRegistry } from '../modules/ModuleRegistry'
import type { ModuleContext } from '../types/module'
import type { ConfigurationSchema, ConfigurationSection } from '../types/configurationSchema'
import type { SettingsSchema } from '../types/settingsSchema'

// ============================================================================
// Types
// ============================================================================

export interface UseModuleConfigurationReturn {
  /**
   * Whether the module has a configuration schema defined.
   * If false, the module is ready to use without configuration.
   */
  hasConfigurationSchema: ComputedRef<boolean>

  /**
   * Whether the module has a settings schema defined.
   */
  hasSettingsSchema: ComputedRef<boolean>

  /**
   * The configuration schema (if defined).
   */
  configurationSchema: ComputedRef<ConfigurationSchema | undefined>

  /**
   * The settings schema (if defined).
   */
  settingsSchema: ComputedRef<SettingsSchema | undefined>

  /**
   * Whether the module is properly configured.
   * Returns true if:
   * - Module has no configurationSchema (ready to use), or
   * - Module's isConfigured() returns true
   */
  isConfigured: ComputedRef<boolean>

  /**
   * Whether the module needs setup (inverse of isConfigured).
   * Useful for conditionally rendering setup UI.
   */
  needsSetup: ComputedRef<boolean>

  /**
   * Setup message to display (from configurationSchema).
   */
  setupMessage: ComputedRef<string>

  /**
   * Setup icon to display (from configurationSchema).
   */
  setupIcon: ComputedRef<string>

  /**
   * Configuration sections to render (from configurationSchema).
   */
  configurationSections: ComputedRef<ConfigurationSection[]>
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Check if a module is configured and get its schemas.
 *
 * @param context - The module context
 * @returns Configuration state and schema information
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { needsSetup, setupMessage, setupIcon } = useModuleConfiguration(props.context)
 * </script>
 *
 * <template>
 *   <BkSetupRequired
 *     v-if="needsSetup"
 *     :icon="setupIcon"
 *     :message="setupMessage"
 *     @configure="openSettings"
 *   />
 *   <template v-else>
 *     <!-- Normal widget content -->
 *   </template>
 * </template>
 * ```
 */
export function useModuleConfiguration<TState>(
  context: ModuleContext<TState>
): UseModuleConfigurationReturn {
  // Get module definition from registry
  const moduleDefinition = computed(() => {
    return moduleRegistry.get(context.moduleId)
  })

  // Check if module has configuration schema
  const hasConfigurationSchema = computed(() => {
    return !!moduleDefinition.value?.configurationSchema
  })

  // Check if module has settings schema
  const hasSettingsSchema = computed(() => {
    return !!moduleDefinition.value?.settingsSchema
  })

  // Get configuration schema
  const configurationSchema = computed(() => {
    return moduleDefinition.value?.configurationSchema
  })

  // Get settings schema
  const settingsSchema = computed(() => {
    return moduleDefinition.value?.settingsSchema
  })

  // Check if module is configured
  const isConfigured = computed(() => {
    const schema = configurationSchema.value
    if (!schema) {
      // No configuration schema = always configured
      return true
    }
    return schema.isConfigured(context.state)
  })

  // Inverse for convenience
  const needsSetup = computed(() => !isConfigured.value)

  // Get setup message
  const setupMessage = computed(() => {
    return configurationSchema.value?.setupMessage ?? 'Configuration required'
  })

  // Get setup icon
  const setupIcon = computed(() => {
    return configurationSchema.value?.setupIcon ?? 'settings'
  })

  // Get configuration sections
  const configurationSections = computed(() => {
    return configurationSchema.value?.sections ?? []
  })

  return {
    hasConfigurationSchema,
    hasSettingsSchema,
    configurationSchema,
    settingsSchema,
    isConfigured,
    needsSetup,
    setupMessage,
    setupIcon,
    configurationSections,
  }
}

// ============================================================================
// Standalone helper (for use outside Vue components)
// ============================================================================

/**
 * Check if a module state is configured (non-reactive version).
 * Useful for validation or outside of Vue components.
 *
 * @param moduleId - The module ID
 * @param state - The module state
 * @returns Whether the module is configured
 */
export function isModuleConfigured(moduleId: string, state: unknown): boolean {
  const definition = moduleRegistry.get(moduleId)
  if (!definition?.configurationSchema) {
    return true
  }
  return definition.configurationSchema.isConfigured(state)
}

/**
 * Get the configuration schema for a module (non-reactive version).
 *
 * @param moduleId - The module ID
 * @returns The configuration schema or undefined
 */
export function getModuleConfigurationSchema(moduleId: string): ConfigurationSchema | undefined {
  return moduleRegistry.get(moduleId)?.configurationSchema
}

/**
 * Get the settings schema for a module (non-reactive version).
 *
 * @param moduleId - The module ID
 * @returns The settings schema or undefined
 */
export function getModuleSettingsSchema(moduleId: string): SettingsSchema | undefined {
  return moduleRegistry.get(moduleId)?.settingsSchema
}
