<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useBoardStore, useToolStore, type CanvasElement } from '@boardkit/core'
import { ElementRenderer } from '@boardkit/ui'

// SVG ref for RoughJS rendering
const svgRef = ref<SVGSVGElement | null>(null)
provide('canvasSvg', svgRef)

/**
 * CanvasElementsLayer
 *
 * SVG layer for rendering canvas elements.
 * Shares the same coordinate system as the widget layer.
 */

interface Props {
  /** Current zoom level */
  zoom?: number
  /** Drag offset in canvas coordinates (for CSS transform during drag) */
  dragOffset?: { x: number; y: number }
  /** IDs of elements currently being dragged */
  draggingElementIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1,
  dragOffset: () => ({ x: 0, y: 0 }),
  draggingElementIds: () => [],
})

const emit = defineEmits<{
  elementSelect: [id: string, event: MouseEvent]
  elementMoveStart: [id: string, event: MouseEvent]
  elementResizeStart: [id: string, handle: string, event: MouseEvent]
  elementRotateStart: [id: string, event: MouseEvent]
  elementEditStart: [id: string, type: 'text' | 'label']
  elementContextMenu: [id: string, event: MouseEvent]
}>()

const boardStore = useBoardStore()
const toolStore = useToolStore()

// Get elements from store
const elements = computed(() => boardStore.elements)
const selectedElementIds = computed(() => boardStore.selectedElementIds)
const previewElement = computed(() => toolStore.previewElement)

// Create a Set for O(1) selection lookups
const selectedElementIdSet = computed(() => new Set(selectedElementIds.value))

// Create a reactive map of element ID -> selected state
// This ensures Vue properly tracks changes for each element
const selectionStateMap = computed(() => {
  const map: Record<string, boolean> = {}
  const selectedSet = selectedElementIdSet.value
  for (const el of elements.value) {
    map[el.id] = selectedSet.has(el.id)
  }
  return map
})

// Check if element is currently being dragged
function isElementDragging(id: string): boolean {
  return props.draggingElementIds.includes(id)
}

// Sort elements by z-index for proper layering
const sortedElements = computed(() => {
  return [...elements.value].sort((a, b) => a.zIndex - b.zIndex)
})

function handleElementSelect(id: string, event: MouseEvent) {
  emit('elementSelect', id, event)
}

function handleElementMoveStart(id: string, event: MouseEvent) {
  emit('elementMoveStart', id, event)
}

function handleElementResizeStart(id: string, handle: string, event: MouseEvent) {
  emit('elementResizeStart', id, handle, event)
}

function handleElementEditStart(id: string, type: 'text' | 'label') {
  emit('elementEditStart', id, type)
}

function handleElementContextMenu(id: string, event: MouseEvent) {
  emit('elementContextMenu', id, event)
}

function handleElementRotateStart(id: string, event: MouseEvent) {
  emit('elementRotateStart', id, event)
}
</script>

<template>
  <svg
    ref="svgRef"
    class="elements-layer"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Render existing elements -->
    <ElementRenderer
      v-for="element in sortedElements"
      :key="element.id"
      :element="element"
      :selected="selectionStateMap[element.id] || false"
      :is-dragging="isElementDragging(element.id)"
      :drag-offset="isElementDragging(element.id) ? dragOffset : { x: 0, y: 0 }"
      :zoom="zoom"
      @select="handleElementSelect"
      @move-start="handleElementMoveStart"
      @resize-start="handleElementResizeStart"
      @rotate-start="handleElementRotateStart"
      @edit-start="handleElementEditStart"
      @context-menu="handleElementContextMenu"
    />

    <!-- Render preview element during drawing -->
    <ElementRenderer
      v-if="previewElement"
      :element="previewElement"
      :is-preview="true"
      :zoom="zoom"
    />
  </svg>
</template>

<style scoped>
.elements-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.elements-layer :deep(.element-renderer) {
  pointer-events: auto;
}

.elements-layer :deep(.element-renderer.preview) {
  pointer-events: none;
}
</style>
