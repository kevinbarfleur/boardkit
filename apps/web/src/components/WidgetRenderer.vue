<script setup lang="ts">
import { computed, h, defineComponent } from 'vue'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import type { ModuleContext } from '@boardkit/core'

interface Props {
  widgetId: string
  moduleId: string
}

const props = defineProps<Props>()
const boardStore = useBoardStore()

const moduleDef = computed(() => moduleRegistry.get(props.moduleId))

const moduleState = computed(() => {
  return boardStore.getModuleState(props.widgetId)
})

const isSelected = computed(() => boardStore.selectedWidgetId === props.widgetId)

const context = computed<ModuleContext>(() => ({
  widgetId: props.widgetId,
  moduleId: props.moduleId,
  state: moduleState.value ?? {},
  updateState: (partial) => boardStore.updateModuleState(props.widgetId, partial),
  setState: (state) => boardStore.setModuleState(props.widgetId, state),
  isSelected: isSelected.value,
}))

const ModuleComponent = computed(() => {
  if (!moduleDef.value) return null
  return moduleDef.value.component
})
</script>

<template>
  <component
    v-if="ModuleComponent && moduleState !== null"
    :is="ModuleComponent"
    :context="context"
  />
  <div v-else class="flex items-center justify-center h-full text-muted-foreground text-sm">
    Module not found: {{ moduleId }}
  </div>
</template>
