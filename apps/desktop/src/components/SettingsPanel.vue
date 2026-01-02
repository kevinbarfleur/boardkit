<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useBoardStore,
  moduleRegistry,
  useConfigurationProviders,
  isModuleConfigured,
  DEFAULT_WIDGET_VISIBILITY,
  type WidgetVisibilityMode,
  type ModuleContext,
} from '@boardkit/core'
import { useSettingsPanel } from '../composables/useSettingsPanel'
import { useVault } from '../composables/useVault'
import {
  BkIcon,
  BkToggle,
  BkSelect,
  BkButtonGroup,
  BkFormRow,
  BkFormSection,
  BkModuleSettingsPanel,
  BkPluginSettings,
  BkTabs,
  useTheme,
  type ConfigPanelProvider,
  type BkTab,
} from '@boardkit/ui'
import { usePlugins } from '@boardkit/app-common'

const boardStore = useBoardStore()
const { isOpen, widgetId, initialTab, isAppSettings, close } = useSettingsPanel()
const { getAllProviders, extractContractIdsFromSchema } = useConfigurationProviders()
const vault = useVault()
const { theme, setTheme } = useTheme()

// Plugins
const {
  plugins,
  loading: pluginsLoading,
  installPlugin,
  togglePlugin,
  uninstallPlugin,
  updatePlugin,
  checkForUpdates,
} = usePlugins()

// App Settings Tabs
const appSettingsTab = ref<'general' | 'plugins'>('general')

const appSettingsTabs: BkTab[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'plugins', label: 'Plugins', icon: 'puzzle' },
]

// Sync appSettingsTab with initialTab when opening app settings
watch(
  () => [isOpen.value, isAppSettings.value, initialTab.value] as const,
  ([open, isApp, tab]) => {
    if (open && isApp && tab && (tab === 'general' || tab === 'plugins')) {
      appSettingsTab.value = tab
    }
  },
  { immediate: true }
)

// Plugin handlers
function handlePluginInstall(url: string) {
  installPlugin(url)
}

function handlePluginToggle(pluginId: string, enabled: boolean) {
  togglePlugin(pluginId, enabled)
}

function handlePluginUpdate(pluginId: string) {
  updatePlugin(pluginId)
}

function handlePluginUninstall(pluginId: string) {
  uninstallPlugin(pluginId)
}

function handleCheckUpdates() {
  checkForUpdates()
}

// =============================================================================
// App Settings
// =============================================================================

const handleChangeVault = async () => {
  close()
  await vault.selectVaultFolder()
}

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

// =============================================================================
// Widget & Module
// =============================================================================

const widget = computed(() => {
  if (!widgetId.value) return null
  return boardStore.widgets.find((w) => w.id === widgetId.value) ?? null
})

const moduleType = computed(() => widget.value?.moduleId ?? null)

const moduleDef = computed(() => {
  if (!moduleType.value) return null
  return moduleRegistry.get(moduleType.value)
})

const moduleIcon = computed(() => moduleDef.value?.icon ?? 'settings')

const moduleLabel = computed(() => moduleDef.value?.displayName ?? 'Widget')

// =============================================================================
// Module State
// =============================================================================

const moduleState = computed(() => {
  if (!widgetId.value) return null
  return boardStore.getModuleState(widgetId.value)
})

function updateModuleState(updates: Record<string, unknown>) {
  if (!widgetId.value || !moduleState.value) return
  boardStore.setModuleState(widgetId.value, {
    ...(moduleState.value as Record<string, unknown>),
    ...updates,
  })
}

// =============================================================================
// Configuration & Settings Schemas
// =============================================================================

const configurationSchema = computed(() => moduleDef.value?.configurationSchema)
const settingsSchema = computed(() => moduleDef.value?.settingsSchema)

const hasAnySchema = computed(() => !!configurationSchema.value || !!settingsSchema.value)

const isConfigured = computed(() => {
  if (!moduleType.value || !moduleState.value) return true
  return isModuleConfigured(moduleType.value, moduleState.value)
})

// Build providers list for BkConfigurationPanel
const providers = computed<ConfigPanelProvider[]>(() => {
  if (!configurationSchema.value) return []
  const contractIds = extractContractIdsFromSchema(configurationSchema.value.sections)
  return getAllProviders(contractIds)
})

// Handle settings update from BkModuleSettingsPanel
function handleSettingsUpdate(key: string, value: unknown) {
  updateModuleState({ [key]: value })
}

// =============================================================================
// Custom Configuration Components
// Retrieved from the module definition (supports both core modules and plugins)
// =============================================================================

const customComponents = computed<Record<string, unknown>>(() => {
  if (!moduleType.value) return {}
  const moduleDef = moduleRegistry.get(moduleType.value)
  return moduleDef?.configurationComponents ?? {}
})

// Construct module context for custom components that need full context access
const moduleContext = computed<ModuleContext | null>(() => {
  if (!widgetId.value || !moduleType.value || !moduleState.value) return null

  return {
    widgetId: widgetId.value,
    moduleId: moduleType.value,
    state: moduleState.value,
    updateState: (partial: Record<string, unknown>) => {
      updateModuleState(partial)
    },
    setState: (state: unknown) => {
      if (widgetId.value) {
        boardStore.setModuleState(widgetId.value, state)
      }
    },
    isSelected: false,
  }
})

// =============================================================================
// Data Sharing - Sharing Section (for provider modules)
// =============================================================================

// Check if this is a data provider module (for V0, only 'todo')
const isProviderModule = computed(() => moduleType.value === 'todo')

// Get consumers for provider modules (who is reading my data)
const dataConsumers = computed(() => {
  if (!widgetId.value || !isProviderModule.value) return []

  return boardStore.permissions
    .filter((p) => p.providerWidgetId === widgetId.value)
    .map((p) => {
      const consumerWidget = boardStore.widgets.find((w) => w.id === p.consumerWidgetId)
      const module = consumerWidget ? moduleRegistry.get(consumerWidget.moduleId) : null

      return {
        permissionId: p.id,
        consumerWidgetId: p.consumerWidgetId,
        title: module?.displayName || 'Unknown',
        moduleId: consumerWidget?.moduleId || 'unknown',
        icon: module?.icon || 'box',
        exists: !!consumerWidget,
      }
    })
})

// =============================================================================
// Widget Visibility Settings
// =============================================================================

const widgetRestMode = computed(
  () => widget.value?.visibility?.restMode ?? DEFAULT_WIDGET_VISIBILITY.restMode
)
const widgetHoverMode = computed(
  () => widget.value?.visibility?.hoverMode ?? DEFAULT_WIDGET_VISIBILITY.hoverMode
)

// Sync visibility across same module type
const SYNC_STORAGE_KEY = 'boardkit:visibility-sync'

function loadSyncPreferences(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(SYNC_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveSyncPreferences(prefs: Record<string, boolean>) {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

const syncPreferences = ref(loadSyncPreferences())

const isSyncEnabled = computed(() => {
  if (!moduleType.value) return false
  return syncPreferences.value[moduleType.value] ?? false
})

function toggleSync() {
  if (!moduleType.value) return

  const newValue = !isSyncEnabled.value
  syncPreferences.value = { ...syncPreferences.value, [moduleType.value]: newValue }
  saveSyncPreferences(syncPreferences.value)

  // If enabling sync, apply current widget's visibility to all widgets of same type
  if (newValue && widget.value) {
    const currentVisibility = {
      restMode: widgetRestMode.value,
      hoverMode: widgetHoverMode.value,
    }
    applyVisibilityToSameType(currentVisibility)
  }
}

function applyVisibilityToSameType(visibility: {
  restMode: WidgetVisibilityMode
  hoverMode: WidgetVisibilityMode
}) {
  if (!moduleType.value) return

  for (const w of boardStore.widgets) {
    if (w.moduleId === moduleType.value && w.id !== widgetId.value) {
      boardStore.updateWidgetVisibility(w.id, visibility)
    }
  }
}

function updateWidgetVisibility(updates: {
  restMode?: WidgetVisibilityMode
  hoverMode?: WidgetVisibilityMode
}) {
  if (!widgetId.value) return
  boardStore.updateWidgetVisibility(widgetId.value, updates)

  // If sync is enabled, apply to all widgets of same type
  if (isSyncEnabled.value) {
    const fullVisibility = {
      restMode: updates.restMode ?? widgetRestMode.value,
      hoverMode: updates.hoverMode ?? widgetHoverMode.value,
    }
    applyVisibilityToSameType(fullVisibility)
  }
}

// =============================================================================
// Options
// =============================================================================

const visibilityOptions = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'visible', label: 'Visible' },
]
</script>

<template>
  <!-- Click-outside-to-close (transparent, doesn't block canvas interactions) -->
  <div v-if="isOpen" class="fixed inset-0 top-14 z-30" @mousedown="close" />

  <!-- Floating Panel -->
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="translate-x-4 opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-4 opacity-0"
  >
    <!-- App Settings Panel -->
    <aside
      v-if="isOpen && isAppSettings"
      class="fixed right-4 top-[4.5rem] bottom-4 z-40 w-80 rounded-xl border border-border bg-popover flex flex-col shadow-2xl"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <BkIcon icon="settings" :size="14" class="text-muted-foreground" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-sm font-medium font-serif text-foreground">Settings</h2>
        </div>
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-accent"
          @click="close"
        >
          <BkIcon icon="x" :size="14" class="text-muted-foreground" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-border px-4">
        <BkTabs
          v-model="appSettingsTab"
          :tabs="appSettingsTabs"
          size="sm"
        />
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- General Tab -->
        <template v-if="appSettingsTab === 'general'">
          <!-- Vault Section -->
          <BkFormSection title="Vault">
            <div class="p-3">
              <div class="flex items-center gap-3 mb-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BkIcon icon="folder" :size="16" class="text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">
                    {{ vault.vaultName.value || 'No vault' }}
                  </p>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ vault.vaultPath.value || 'Not configured' }}
                  </p>
                </div>
              </div>
              <button
                class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
                @click="handleChangeVault"
              >
                <BkIcon icon="folder" :size="14" />
                Change vault
              </button>
            </div>
          </BkFormSection>

          <!-- Appearance Section -->
          <BkFormSection title="Appearance">
            <BkFormRow label="Theme" icon="palette" layout="stacked">
              <BkButtonGroup
                :model-value="theme"
                :options="themeOptions"
                full-width
                @update:model-value="(v) => setTheme(v as 'light' | 'dark' | 'system')"
              />
            </BkFormRow>
          </BkFormSection>
        </template>

        <!-- Plugins Tab -->
        <template v-else-if="appSettingsTab === 'plugins'">
          <BkPluginSettings
            :plugins="plugins"
            :loading="pluginsLoading"
            @install="handlePluginInstall"
            @toggle="handlePluginToggle"
            @update="handlePluginUpdate"
            @uninstall="handlePluginUninstall"
            @check-updates="handleCheckUpdates"
          />
        </template>
      </div>

      <!-- Footer -->
      <div class="shrink-0 border-t border-border p-3">
        <p class="text-xs text-muted-foreground text-center">Boardkit v0.1.0</p>
      </div>
    </aside>

    <!-- Widget Settings Panel -->
    <aside
      v-else-if="isOpen && widget"
      class="fixed right-4 top-[4.5rem] bottom-4 z-40 w-80 rounded-xl border border-border bg-popover flex flex-col shadow-2xl"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <BkIcon :icon="moduleIcon" :size="14" class="text-muted-foreground" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-sm font-medium font-serif text-foreground truncate">{{ moduleLabel }}</h2>
        </div>
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-accent"
          @click="close"
        >
          <BkIcon icon="x" :size="14" class="text-muted-foreground" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Sharing Section (for provider modules) -->
        <BkFormSection
          v-if="isProviderModule && dataConsumers.length > 0"
          title="Sharing"
          class="mx-4 mt-4"
        >
          <div class="p-3">
            <div class="flex items-center gap-2 mb-3">
              <BkIcon icon="share-2" :size="14" class="text-muted-foreground" />
              <span class="text-sm text-foreground">This data is shared with:</span>
            </div>

            <div class="space-y-2">
              <div
                v-for="consumer in dataConsumers"
                :key="consumer.permissionId"
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <BkIcon :icon="consumer.icon" :size="14" />
                <span>{{ consumer.title }}</span>
              </div>
            </div>

            <p class="mt-3 text-xs text-muted-foreground">
              {{ dataConsumers.length }} widget{{ dataConsumers.length !== 1 ? 's' : '' }} reading
              this data
            </p>
          </div>
        </BkFormSection>

        <!-- Module Configuration & Settings via BkModuleSettingsPanel -->
        <BkModuleSettingsPanel
          v-if="moduleState && hasAnySchema"
          :module-name="moduleLabel"
          :configuration-schema="configurationSchema"
          :settings-schema="settingsSchema"
          :state="(moduleState as Record<string, unknown>)"
          :providers="providers"
          :is-configured="isConfigured"
          :initial-tab="initialTab"
          :custom-components="customComponents"
          :module-context="moduleContext"
          @update="handleSettingsUpdate"
        />

        <!-- Fallback for modules without any schema -->
        <div
          v-else-if="moduleState && !hasAnySchema"
          class="px-4 py-8 text-center text-sm text-muted-foreground"
        >
          <BkIcon icon="settings" :size="24" class="mx-auto mb-2 opacity-50" />
          <p>No settings available for this module</p>
        </div>
      </div>

      <!-- Footer with visibility settings -->
      <div class="shrink-0 border-t border-border">
        <!-- Visibility Controls -->
        <div class="p-3 space-y-3">
          <div class="flex items-center gap-2">
            <BkIcon icon="eye" :size="12" class="text-muted-foreground" />
            <span class="text-xs text-muted-foreground">Visibility</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-muted-foreground shrink-0">At rest</span>
              <BkSelect
                :model-value="widgetRestMode"
                :options="visibilityOptions"
                size="sm"
                class="w-26"
                @update:model-value="
                  (v) => updateWidgetVisibility({ restMode: v as WidgetVisibilityMode })
                "
              />
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-muted-foreground shrink-0">On hover</span>
              <BkSelect
                :model-value="widgetHoverMode"
                :options="visibilityOptions"
                size="sm"
                class="w-26"
                @update:model-value="
                  (v) => updateWidgetVisibility({ hoverMode: v as WidgetVisibilityMode })
                "
              />
            </div>
          </div>
          <!-- Sync toggle -->
          <div class="flex items-center justify-between gap-3 pt-1">
            <span class="text-xs text-muted-foreground">Apply to all {{ moduleLabel }}s</span>
            <BkToggle :model-value="isSyncEnabled" size="sm" @update:model-value="toggleSync" />
          </div>
        </div>
      </div>
    </aside>
  </Transition>
</template>
