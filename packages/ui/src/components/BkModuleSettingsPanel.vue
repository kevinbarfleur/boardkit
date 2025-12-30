<script setup lang="ts">
/**
 * BkModuleSettingsPanel
 *
 * Orchestrator component that manages Configure and Settings tabs.
 * - If module has configurationSchema: shows 2 tabs (Configure | Settings)
 * - If module has only settingsSchema: shows settings directly (no tabs)
 * - Automatically switches to Configure tab if module needs setup
 */
import { ref, computed, watch } from 'vue'
import type { ConfigurationSchema, SettingsSchema } from '@boardkit/core'
import BkTabs, { type Tab } from './BkTabs.vue'
import BkConfigurationPanel, { type ConfigPanelProvider } from './BkConfigurationPanel.vue'
import BkSettingsPanelGeneric from './BkSettingsPanelGeneric.vue'
import BkIcon from './BkIcon.vue'

interface Props {
  /** Module display name */
  moduleName: string
  /** Configuration schema (if module requires setup) */
  configurationSchema?: ConfigurationSchema
  /** Settings schema (for preferences) */
  settingsSchema?: SettingsSchema
  /** Current module state */
  state: Record<string, unknown>
  /** Available providers for data sources */
  providers?: ConfigPanelProvider[]
  /** Whether the module is configured */
  isConfigured?: boolean
  /** Initial tab to display (overrides default behavior) */
  initialTab?: string | null
  /** Custom components for configuration sections */
  customComponents?: Record<string, unknown>
  /** Module context (passed to custom components) */
  moduleContext?: unknown
}

const props = withDefaults(defineProps<Props>(), {
  providers: () => [],
  isConfigured: true,
  initialTab: null,
  customComponents: () => ({}),
  moduleContext: undefined,
})

const emit = defineEmits<{
  /** Emitted when a state field should be updated */
  update: [key: string, value: unknown]
}>()

// Determine if we need tabs
const hasTabs = computed(() => !!props.configurationSchema)

// Tab definitions
const tabs = computed<Tab[]>(() => {
  if (!hasTabs.value) return []

  const result: Tab[] = [
    {
      id: 'configure',
      label: 'Configure',
      icon: 'settings-2',
    },
  ]

  if (props.settingsSchema) {
    result.push({
      id: 'settings',
      label: 'Settings',
      icon: 'sliders-horizontal',
    })
  }

  return result
})

// Determine initial tab: prioritize initialTab prop, then check isConfigured
function getInitialTab(): string {
  if (props.initialTab) return props.initialTab
  return !props.isConfigured ? 'configure' : 'settings'
}

// Active tab
const activeTab = ref<string>(getInitialTab())

// Watch for initialTab prop changes (e.g., when opening panel with specific tab)
watch(
  () => props.initialTab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab
    }
  }
)

// Auto-switch to configure tab if module needs setup
watch(
  () => props.isConfigured,
  (isConfigured) => {
    // Only auto-switch if no explicit initialTab was provided
    if (!isConfigured && activeTab.value !== 'configure' && !props.initialTab) {
      activeTab.value = 'configure'
    }
  },
  { immediate: true }
)

// Handle state update
function handleUpdate(key: string, value: unknown) {
  emit('update', key, value)
}

// Compute content wrapper class based on active tab
// Only the corner under the active tab loses its radius
const contentWrapperClass = computed(() => {
  const base = ['border', 'border-border', 'bg-popover']

  const tabIds = tabs.value.map(t => t.id)
  const activeIndex = tabIds.indexOf(activeTab.value)
  const isFirstActive = activeIndex === 0

  // Bottom corners always rounded
  base.push('rounded-b-lg')

  // Top-right: always rounded (tabs are not full-width)
  base.push('rounded-tr-lg')

  // Top-left: rounded only if first tab is NOT active
  if (!isFirstActive) {
    base.push('rounded-tl-lg')
  }

  return base.join(' ')
})
</script>

<template>
  <div class="bk-module-settings-panel">
    <!-- With tabs (module has configuration requirements) -->
    <template v-if="hasTabs">
      <!-- Card tabs container -->
      <div class="px-3 pt-3">
        <!-- Tab navigation -->
        <BkTabs
          v-model="activeTab"
          :tabs="tabs"
          variant="card"
          :full-width="false"
        />

        <!-- Content area with border that connects to active tab -->
        <div :class="contentWrapperClass">
          <!-- Configure tab content -->
          <div v-show="activeTab === 'configure'" class="p-3">
            <!-- Configuration status indicator -->
            <div
              class="mb-3 flex items-center gap-2 px-3 py-2 rounded-md text-sm"
              :class="[
                isConfigured
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              ]"
            >
              <BkIcon :icon="isConfigured ? 'check-circle' : 'alert-circle'" :size="14" />
              <span>
                {{ isConfigured ? 'Configured' : 'Setup required' }}
              </span>
            </div>

            <!-- Configuration panel -->
            <BkConfigurationPanel
              v-if="configurationSchema"
              :schema="configurationSchema"
              :state="state"
              :providers="providers"
              :custom-components="customComponents"
              :module-context="moduleContext"
              @update="handleUpdate"
            />
          </div>

          <!-- Settings tab content -->
          <div v-show="activeTab === 'settings'" class="p-3">
            <BkSettingsPanelGeneric
              v-if="settingsSchema"
              :schema="settingsSchema"
              :state="state"
              @update="handleUpdate"
            />

            <!-- No settings available -->
            <div
              v-else
              class="py-8 text-center text-sm text-muted-foreground"
            >
              <BkIcon icon="settings" :size="24" class="mx-auto mb-2 opacity-50" />
              <p>No settings available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom spacing -->
      <div class="h-3" />
    </template>

    <!-- Without tabs (only settings, no configuration) -->
    <template v-else>
      <div class="px-3 py-3">
        <BkSettingsPanelGeneric
          v-if="settingsSchema"
          :schema="settingsSchema"
          :state="state"
          @update="handleUpdate"
        />

        <!-- No settings available -->
        <div
          v-else
          class="py-8 text-center text-sm text-muted-foreground"
        >
          <BkIcon icon="settings" :size="24" class="mx-auto mb-2 opacity-50" />
          <p>No settings available for this module</p>
        </div>
      </div>
    </template>
  </div>
</template>
