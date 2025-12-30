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
}

const props = withDefaults(defineProps<Props>(), {
  providers: () => [],
  isConfigured: true,
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

// Active tab
const activeTab = ref<string>(
  !props.isConfigured ? 'configure' : 'settings'
)

// Auto-switch to configure tab if module needs setup
watch(
  () => props.isConfigured,
  (isConfigured) => {
    if (!isConfigured && activeTab.value !== 'configure') {
      activeTab.value = 'configure'
    }
  },
  { immediate: true }
)

// Handle state update
function handleUpdate(key: string, value: unknown) {
  emit('update', key, value)
}
</script>

<template>
  <div class="bk-module-settings-panel">
    <!-- With tabs (module has configuration requirements) -->
    <template v-if="hasTabs">
      <!-- Tab navigation -->
      <div class="px-3 pt-3 pb-2">
        <BkTabs
          v-model="activeTab"
          :tabs="tabs"
          variant="pills"
        />
      </div>

      <!-- Configure tab content -->
      <div v-show="activeTab === 'configure'" class="px-3 pb-3">
        <!-- Configuration status indicator -->
        <div
          class="mb-3 flex items-center gap-2 px-3 py-2 rounded-md text-sm"
          :class="[
            isConfigured
              ? 'bg-green-500/10 text-green-600'
              : 'bg-amber-500/10 text-amber-600',
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
          @update="handleUpdate"
        />
      </div>

      <!-- Settings tab content -->
      <div v-show="activeTab === 'settings'" class="px-3 pb-3">
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
