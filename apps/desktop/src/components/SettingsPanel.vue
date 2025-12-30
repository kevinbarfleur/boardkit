<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useBoardStore,
  consumerRegistry,
  dataBus,
  moduleRegistry,
  DEFAULT_WIDGET_VISIBILITY,
  type WidgetVisibilityMode,
} from '@boardkit/core'
import { useSettingsPanel } from '../composables/useSettingsPanel'
import { useDataSharingUI } from '../composables/useDataSharingUI'
import {
  BkIcon,
  BkToggle,
  BkSelect,
  BkButtonGroup,
  BkFormRow,
  BkFormSection,
} from '@boardkit/ui'
import type { TextState, TodoState, FocusLensState, TaskRadarState } from '@boardkit/app-common'
import {
  defaultTextSettings,
  defaultTodoSettings,
  defaultFocusLensSettings,
  defaultTaskRadarSettings,
} from '@boardkit/app-common'

const boardStore = useBoardStore()
const { isOpen, widgetId, close } = useSettingsPanel()
const dataSharingUI = useDataSharingUI()

// Get the widget from the composable's widgetId
const widget = computed(() => {
  if (!widgetId.value) return null
  return boardStore.widgets.find((w) => w.id === widgetId.value) ?? null
})

const moduleType = computed(() => widget.value?.moduleId ?? null)

const moduleIcon = computed(() => {
  if (moduleType.value === 'text') return 'file-text'
  if (moduleType.value === 'todo') return 'check-square'
  if (moduleType.value === 'task-radar') return 'radar'
  if (moduleType.value === 'focus-lens') return 'target'
  return 'settings'
})

const moduleLabel = computed(() => {
  if (moduleType.value === 'text') return 'Text Widget'
  if (moduleType.value === 'todo') return 'Todo Widget'
  if (moduleType.value === 'task-radar') return 'Task Radar'
  if (moduleType.value === 'focus-lens') return 'Focus Lens'
  return 'Widget'
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

function applyVisibilityToSameType(visibility: { restMode: WidgetVisibilityMode; hoverMode: WidgetVisibilityMode }) {
  if (!moduleType.value) return

  for (const w of boardStore.widgets) {
    if (w.moduleId === moduleType.value && w.id !== widgetId.value) {
      boardStore.updateWidgetVisibility(w.id, visibility)
    }
  }
}

function updateWidgetVisibility(updates: { restMode?: WidgetVisibilityMode; hoverMode?: WidgetVisibilityMode }) {
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
// Module State Access
// =============================================================================

// Get module state
const moduleState = computed(() => {
  if (!widgetId.value) return null
  return boardStore.getModuleState(widgetId.value)
})

// Update module state
function updateModuleState(updates: Record<string, unknown>) {
  if (!widgetId.value || !moduleState.value) return
  boardStore.setModuleState(widgetId.value, {
    ...(moduleState.value as Record<string, unknown>),
    ...updates,
  })
}

// =============================================================================
// Text Settings
// =============================================================================

const textState = computed(() => moduleState.value as TextState | null)

const textFontSize = computed(() => textState.value?.fontSize ?? defaultTextSettings.fontSize)
const textLineHeight = computed(
  () => textState.value?.lineHeight ?? defaultTextSettings.lineHeight
)
const textEnableShortcuts = computed(
  () => textState.value?.enableShortcuts ?? defaultTextSettings.enableShortcuts
)
const textAutoLinks = computed(() => textState.value?.autoLinks ?? defaultTextSettings.autoLinks)
const textSmartTypography = computed(
  () => textState.value?.smartTypography ?? defaultTextSettings.smartTypography
)
const textShowWordCount = computed(
  () => textState.value?.showWordCount ?? defaultTextSettings.showWordCount
)

// =============================================================================
// Todo Settings
// =============================================================================

const todoState = computed(() => moduleState.value as TodoState | null)

const todoStrikeCompleted = computed(
  () => todoState.value?.strikeCompleted ?? defaultTodoSettings.strikeCompleted
)
const todoHideCompleted = computed(
  () => todoState.value?.hideCompleted ?? defaultTodoSettings.hideCompleted
)
const todoAutoSort = computed(() => todoState.value?.autoSort ?? defaultTodoSettings.autoSort)
const todoShowProgress = computed(
  () => todoState.value?.showProgress ?? defaultTodoSettings.showProgress
)
const todoEnableReorder = computed(
  () => todoState.value?.enableReorder ?? defaultTodoSettings.enableReorder
)
const todoShowDueDate = computed(
  () => todoState.value?.showDueDate ?? defaultTodoSettings.showDueDate
)
const todoShowPriority = computed(
  () => todoState.value?.showPriority ?? defaultTodoSettings.showPriority
)
const todoConfirmDelete = computed(
  () => todoState.value?.confirmDelete ?? defaultTodoSettings.confirmDelete
)

// =============================================================================
// Focus Lens Settings
// =============================================================================

const focusLensState = computed(() => moduleState.value as FocusLensState | null)

const focusLensAutoRefresh = computed(
  () => focusLensState.value?.autoRefresh ?? defaultFocusLensSettings.autoRefresh
)
const focusLensShowSourceName = computed(
  () => focusLensState.value?.showSourceName ?? defaultFocusLensSettings.showSourceName
)
const focusLensShowMode = computed(() => focusLensState.value?.showMode ?? 'next')

// =============================================================================
// Task Radar Settings
// =============================================================================

const taskRadarState = computed(() => moduleState.value as TaskRadarState | null)

const taskRadarShowEmptyLists = computed(
  () => taskRadarState.value?.showEmptyLists ?? defaultTaskRadarSettings.showEmptyLists
)
const taskRadarGroupBySource = computed(
  () => taskRadarState.value?.groupBySource ?? defaultTaskRadarSettings.groupBySource
)
const taskRadarViewMode = computed(() => taskRadarState.value?.viewMode ?? 'summary')

// =============================================================================
// Data Sharing
// =============================================================================

// Check if this is a data consumer module
const isConsumerModule = computed(() => {
  if (!moduleType.value) return false
  return consumerRegistry.isConsumer(moduleType.value)
})

// Check if this is a data provider module (for V0, only 'todo')
const isProviderModule = computed(() => moduleType.value === 'todo')

// Get connected data sources for consumer modules
const connectedSources = computed(() => {
  if (!widgetId.value || !isConsumerModule.value) return []

  return boardStore.permissions
    .filter((p) => p.consumerWidgetId === widgetId.value)
    .map((p) => {
      const providerWidget = boardStore.widgets.find((w) => w.id === p.providerWidgetId)
      const providerModuleState = boardStore.getModuleState(p.providerWidgetId) as Record<
        string,
        unknown
      > | null
      const module = providerWidget ? moduleRegistry.get(providerWidget.moduleId) : null

      // Get data from cache for preview
      const cachedData = dataBus.getData(p.providerWidgetId, p.contractId) as {
        progress?: { done: number; total: number }
        items?: unknown[]
      } | null

      let preview = ''
      if (cachedData?.progress) {
        preview = `${cachedData.progress.done}/${cachedData.progress.total} tasks`
      }

      return {
        permissionId: p.id,
        providerWidgetId: p.providerWidgetId,
        title: (providerModuleState?.title as string) || module?.displayName || 'Unknown',
        moduleId: providerWidget?.moduleId || 'unknown',
        preview,
        exists: !!providerWidget,
      }
    })
})

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
        exists: !!consumerWidget,
      }
    })
})

// Handle disconnect
function handleDisconnect(permissionId: string) {
  boardStore.revokeDataPermission(permissionId)
}

// Handle add data source
function handleAddDataSource() {
  if (!widgetId.value || !moduleType.value) return

  const consumerDefs = consumerRegistry.getByModule(moduleType.value)
  if (consumerDefs.length === 0) return

  const def = consumerDefs[0]
  dataSharingUI.openPicker({
    consumerWidgetId: widgetId.value,
    contractId: def.contractId,
    multiSelect: def.multiSelect,
  })
}

// =============================================================================
// Options
// =============================================================================

const fontSizes = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
]

const lineHeights = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'spacious', label: 'Spacious' },
]

const progressOptions = [
  { value: 'none', label: 'None' },
  { value: 'bar', label: 'Bar' },
  { value: 'counter', label: 'Counter' },
]

const showModeOptions = [
  { value: 'next', label: 'Next task' },
  { value: 'random', label: 'Random' },
]

const autoRefreshOptions = [
  { value: 0, label: 'Disabled' },
  { value: 15, label: '15 sec' },
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
]

const viewModeOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'detailed', label: 'Detailed' },
]

const visibilityOptions = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'visible', label: 'Visible' },
]
</script>

<template>
  <!-- Click-outside-to-close (transparent, doesn't block canvas interactions) -->
  <div
    v-if="isOpen"
    class="fixed inset-0 top-14 z-30"
    @mousedown="close"
  />

  <!-- Floating Panel -->
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="translate-x-4 opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-4 opacity-0"
  >
    <aside
      v-if="isOpen && widget"
      class="fixed right-4 top-[4.5rem] bottom-4 z-40 w-80 rounded-xl border border-border bg-popover flex flex-col shadow-2xl"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <BkIcon :icon="moduleIcon" :size="14" class="text-muted-foreground" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-sm font-medium text-foreground truncate">{{ moduleLabel }}</h2>
        </div>
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-accent"
          @click="close"
        >
          <BkIcon icon="x" :size="14" class="text-muted-foreground" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Data Sources Section (for consumer modules) -->
        <BkFormSection v-if="isConsumerModule" title="Data Sources">
          <!-- Connected sources -->
          <div
            v-for="source in connectedSources"
            :key="source.permissionId"
            class="p-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted">
                <BkIcon icon="check-square" :size="12" class="text-muted-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-foreground truncate">{{ source.title }}</div>
                <div v-if="source.preview" class="text-xs text-muted-foreground">
                  {{ source.preview }}
                </div>
              </div>
            </div>
            <button
              class="ml-2 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Disconnect"
              @click="handleDisconnect(source.permissionId)"
            >
              <BkIcon icon="unlink" :size="14" />
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="connectedSources.length === 0" class="p-4 text-center">
            <BkIcon icon="link" :size="20" class="mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">No data sources connected</p>
          </div>

          <!-- Add source button -->
          <button
            class="w-full p-3 flex items-center justify-center gap-2 text-sm text-primary hover:bg-accent transition-colors"
            @click="handleAddDataSource"
          >
            <BkIcon icon="plus" :size="14" />
            <span>Add data source</span>
          </button>
        </BkFormSection>

        <!-- Sharing Section (for provider modules) -->
        <BkFormSection v-if="isProviderModule && dataConsumers.length > 0" title="Sharing">
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
                <BkIcon
                  :icon="consumer.moduleId === 'task-radar' ? 'radar' : 'target'"
                  :size="14"
                />
                <span>{{ consumer.title }}</span>
              </div>
            </div>

            <p class="mt-3 text-xs text-muted-foreground">
              {{ dataConsumers.length }} widget{{ dataConsumers.length !== 1 ? 's' : '' }} reading
              this data
            </p>
          </div>
        </BkFormSection>

        <!-- Text Module Settings -->
        <template v-if="moduleType === 'text'">
          <BkFormSection title="Text">
            <BkFormRow label="Size" layout="stacked" icon="type">
              <BkButtonGroup
                :model-value="textFontSize"
                :options="fontSizes"
                full-width
                @update:model-value="(v) => updateModuleState({ fontSize: v })"
              />
            </BkFormRow>
            <BkFormRow label="Line height" layout="stacked" icon="align-left">
              <BkButtonGroup
                :model-value="textLineHeight"
                :options="lineHeights"
                full-width
                @update:model-value="(v) => updateModuleState({ lineHeight: v })"
              />
            </BkFormRow>
          </BkFormSection>

          <BkFormSection title="Features">
            <BkFormRow label="Keyboard shortcuts" icon="keyboard">
              <BkToggle
                :model-value="textEnableShortcuts"
                @update:model-value="(v) => updateModuleState({ enableShortcuts: v })"
              />
            </BkFormRow>
            <BkFormRow label="Auto links" icon="link">
              <BkToggle
                :model-value="textAutoLinks"
                @update:model-value="(v) => updateModuleState({ autoLinks: v })"
              />
            </BkFormRow>
            <BkFormRow label="Smart typography" icon="sparkles">
              <BkToggle
                :model-value="textSmartTypography"
                @update:model-value="(v) => updateModuleState({ smartTypography: v })"
              />
            </BkFormRow>
            <BkFormRow label="Word count" icon="hash">
              <BkToggle
                :model-value="textShowWordCount"
                @update:model-value="(v) => updateModuleState({ showWordCount: v })"
              />
            </BkFormRow>
          </BkFormSection>
        </template>

        <!-- Todo Module Settings -->
        <template v-if="moduleType === 'todo'">
          <BkFormSection title="Display">
            <BkFormRow label="Progress" layout="stacked" icon="bar-chart-3">
              <BkButtonGroup
                :model-value="todoShowProgress"
                :options="progressOptions"
                full-width
                @update:model-value="(v) => updateModuleState({ showProgress: v })"
              />
            </BkFormRow>
            <BkFormRow label="Show due dates" icon="calendar">
              <BkToggle
                :model-value="todoShowDueDate"
                @update:model-value="(v) => updateModuleState({ showDueDate: v })"
              />
            </BkFormRow>
            <BkFormRow label="Show priorities" icon="flag">
              <BkToggle
                :model-value="todoShowPriority"
                @update:model-value="(v) => updateModuleState({ showPriority: v })"
              />
            </BkFormRow>
          </BkFormSection>

          <BkFormSection title="Behavior">
            <BkFormRow label="Strike completed" icon="strikethrough">
              <BkToggle
                :model-value="todoStrikeCompleted"
                @update:model-value="(v) => updateModuleState({ strikeCompleted: v })"
              />
            </BkFormRow>
            <BkFormRow label="Hide completed" icon="eye-off">
              <BkToggle
                :model-value="todoHideCompleted"
                @update:model-value="(v) => updateModuleState({ hideCompleted: v })"
              />
            </BkFormRow>
            <BkFormRow label="Auto sort" icon="arrow-up-down">
              <BkToggle
                :model-value="todoAutoSort"
                @update:model-value="(v) => updateModuleState({ autoSort: v })"
              />
            </BkFormRow>
            <BkFormRow label="Reorder" icon="grip-vertical">
              <BkToggle
                :model-value="todoEnableReorder"
                @update:model-value="(v) => updateModuleState({ enableReorder: v })"
              />
            </BkFormRow>
            <BkFormRow label="Confirm delete" icon="trash-2">
              <BkToggle
                :model-value="todoConfirmDelete"
                @update:model-value="(v) => updateModuleState({ confirmDelete: v })"
              />
            </BkFormRow>
          </BkFormSection>
        </template>

        <!-- Focus Lens Module Settings -->
        <template v-if="moduleType === 'focus-lens'">
          <BkFormSection title="Display">
            <BkFormRow label="Mode" layout="stacked" icon="target">
              <BkSelect
                :model-value="focusLensShowMode"
                :options="showModeOptions"
                @update:model-value="(v) => updateModuleState({ showMode: v })"
              />
            </BkFormRow>
            <BkFormRow label="Show source" icon="list">
              <BkToggle
                :model-value="focusLensShowSourceName"
                @update:model-value="(v) => updateModuleState({ showSourceName: v })"
              />
            </BkFormRow>
          </BkFormSection>

          <BkFormSection title="Behavior">
            <BkFormRow label="Auto refresh" layout="stacked" icon="refresh-cw" hint="Only in random mode">
              <BkSelect
                :model-value="focusLensAutoRefresh"
                :options="autoRefreshOptions"
                :disabled="focusLensShowMode !== 'random'"
                @update:model-value="(v) => updateModuleState({ autoRefresh: v })"
              />
            </BkFormRow>
          </BkFormSection>
        </template>

        <!-- Task Radar Module Settings -->
        <template v-if="moduleType === 'task-radar'">
          <BkFormSection title="Display">
            <BkFormRow label="View" layout="stacked" icon="layout-grid">
              <BkSelect
                :model-value="taskRadarViewMode"
                :options="viewModeOptions"
                @update:model-value="(v) => updateModuleState({ viewMode: v })"
              />
            </BkFormRow>
            <BkFormRow label="Show empty lists" icon="list-x">
              <BkToggle
                :model-value="taskRadarShowEmptyLists"
                @update:model-value="(v) => updateModuleState({ showEmptyLists: v })"
              />
            </BkFormRow>
            <BkFormRow label="Group by source" icon="layers">
              <BkToggle
                :model-value="taskRadarGroupBySource"
                @update:model-value="(v) => updateModuleState({ groupBySource: v })"
              />
            </BkFormRow>
          </BkFormSection>
        </template>
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
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">At rest</span>
              <BkSelect
                :model-value="widgetRestMode"
                :options="visibilityOptions"
                size="sm"
                class="w-28"
                @update:model-value="(v) => updateWidgetVisibility({ restMode: v as WidgetVisibilityMode })"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">On hover</span>
              <BkSelect
                :model-value="widgetHoverMode"
                :options="visibilityOptions"
                size="sm"
                class="w-28"
                @update:model-value="(v) => updateWidgetVisibility({ hoverMode: v as WidgetVisibilityMode })"
              />
            </div>
          </div>
          <!-- Sync toggle -->
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-muted-foreground">Apply to all {{ moduleLabel }}s</span>
            <BkToggle :model-value="isSyncEnabled" size="sm" @update:model-value="toggleSync" />
          </div>
        </div>
      </div>
    </aside>
  </Transition>
</template>
