<script setup lang="ts">
import { computed } from 'vue'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import type { ModuleContext, HistoryOptions, ModuleContextMenuEvent } from '@boardkit/core'
import { useSettingsPanel } from '../composables/useSettingsPanel'

interface Props {
  widgetId: string
  moduleId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  moduleContextMenu: [event: ModuleContextMenuEvent]
}>()

const boardStore = useBoardStore()
const { openForWidget } = useSettingsPanel()

const moduleDef = computed(() => moduleRegistry.get(props.moduleId))

const moduleState = computed(() => {
  return boardStore.getModuleState(props.widgetId)
})

const isSelected = computed(() => boardStore.selectedWidgetId === props.widgetId)

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

/**
 * Handle open-settings event from module components.
 * Forwards to the settings panel with optional tab specification.
 */
function handleOpenSettings(options?: { tab?: string }) {
  openForWidget(props.widgetId, options)
}

/**
 * Handle module context menu event from module components.
 * Forwards to BoardCanvas for combined rendering with widget actions.
 */
function handleModuleContextMenu(event: ModuleContextMenuEvent) {
  emit('moduleContextMenu', event)
}
</script>

<template>
  <component
    v-if="ModuleComponent && moduleState !== null"
    :is="ModuleComponent"
    :context="context"
    @open-settings="handleOpenSettings"
    @module-context-menu="handleModuleContextMenu"
  />
  <div v-else class="flex items-center justify-center h-full text-muted-foreground text-sm">
    Module not found: {{ moduleId }}
  </div>
</template>
