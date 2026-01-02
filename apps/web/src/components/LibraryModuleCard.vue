<script setup lang="ts">
import { computed } from 'vue'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import type { ModuleContext, HistoryOptions, ModuleContextMenuEvent } from '@boardkit/core'
import { BkIcon, BkIconButton, BkTooltip } from '@boardkit/ui'
import { useSettingsPanel } from '../composables/useSettingsPanel'

interface Props {
  /** Widget ID */
  widgetId: string
  /** Module ID */
  moduleId: string
  /** Display name of the module type */
  displayName: string
  /** Icon name for the module */
  icon: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Emitted when user wants to open in canvas */
  'open-in-canvas': [widgetId: string]
  /** Emitted when user wants to open settings */
  'open-settings': [widgetId: string]
}>()

const boardStore = useBoardStore()
const { openForWidget } = useSettingsPanel()

// ============================================================================
// Module Definition & State
// ============================================================================

// Access moduleRegistry.version to make this computed reactive to registry changes
const moduleDef = computed(() => {
  moduleRegistry.version.value
  return moduleRegistry.get(props.moduleId)
})

const moduleState = computed(() => {
  return boardStore.getModuleState(props.widgetId)
})

const isSelected = computed(() => boardStore.selectedWidgetId === props.widgetId)

// Get title from module state if available
const widgetTitle = computed(() => {
  const state = moduleState.value as Record<string, unknown> | null
  if (!state) return null

  const titleFields = ['title', 'name', 'label']
  for (const field of titleFields) {
    const value = state[field]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return null
})

// ============================================================================
// Module Context (same pattern as WidgetRenderer)
// ============================================================================

const context = computed<ModuleContext>(() => ({
  widgetId: props.widgetId,
  moduleId: props.moduleId,
  state: moduleState.value ?? {},
  updateState: (partial, options?: HistoryOptions) =>
    boardStore.updateModuleState(props.widgetId, partial, options),
  setState: (state, options?: HistoryOptions) =>
    boardStore.setModuleState(props.widgetId, state, options),
  isSelected: isSelected.value,
}))

const ModuleComponent = computed(() => {
  if (!moduleDef.value) return null
  return moduleDef.value.component
})

// ============================================================================
// Handlers
// ============================================================================

function handleOpenSettings(options?: { tab?: string }) {
  openForWidget(props.widgetId, options)
  emit('open-settings', props.widgetId)
}

function handleModuleContextMenu(_event: ModuleContextMenuEvent) {
  // Context menus are not fully supported in library view
  // Could be expanded in future iterations
}

function handleOpenInCanvas() {
  emit('open-in-canvas', props.widgetId)
}
</script>

<template>
  <div
    class="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
      <div class="flex items-center gap-2 min-w-0">
        <BkIcon :icon="icon" class="w-4 h-4 text-muted-foreground shrink-0" />
        <span class="text-sm font-medium text-foreground truncate">
          {{ widgetTitle ?? displayName }}
        </span>
        <span
          v-if="widgetTitle"
          class="text-xs text-muted-foreground truncate"
        >
          · {{ displayName }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <BkTooltip content="Open in Canvas" side="top">
          <BkIconButton
            icon="external-link"
            size="sm"
            variant="ghost"
            ariaLabel="Open in Canvas"
            @click="handleOpenInCanvas"
          />
        </BkTooltip>
        <BkTooltip content="Settings" side="top">
          <BkIconButton
            icon="settings"
            size="sm"
            variant="ghost"
            ariaLabel="Settings"
            @click="handleOpenSettings()"
          />
        </BkTooltip>
      </div>
    </div>

    <!-- Module Content -->
    <div class="flex-1 min-h-[200px] max-h-[400px] overflow-auto p-4">
      <component
        v-if="ModuleComponent && moduleState !== null"
        :is="ModuleComponent"
        :context="context"
        @open-settings="handleOpenSettings"
        @module-context-menu="handleModuleContextMenu"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-muted-foreground text-sm"
      >
        <div class="text-center">
          <BkIcon icon="alert-circle" class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Module not found: {{ moduleId }}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-4 py-2 border-t border-border bg-muted/20">
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        @click="handleOpenInCanvas"
      >
        <BkIcon icon="arrow-right" class="w-4 h-4" />
        Open in Canvas
      </button>
    </div>
  </div>
</template>
