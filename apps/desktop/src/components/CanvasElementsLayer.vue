<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useBoardStore, useToolStore, type CanvasElement, type AnchorPosition } from '@boardkit/core'
import { ElementRenderer, GroupSelectionBox, AnchorPointsOverlay } from '@boardkit/ui'

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
  /** Current viewport (pan offset x, y and zoom) */
  viewport?: { x: number; y: number; zoom: number }
  /** Drag offset in canvas coordinates (for CSS transform during drag) */
  dragOffset?: { x: number; y: number }
  /** IDs of elements currently being dragged */
  draggingElementIds?: string[]
  /** Whether group rotation is in progress */
  isRotatingGroup?: boolean
  /** Group rotation transform (angle in radians, center coordinates) */
  groupRotation?: {
    angle: number
    centerX: number
    centerY: number
  }
  /** IDs of shapes that are candidates for arrow binding (show anchors) */
  bindingCandidates?: string[]
  /** Currently active binding anchor */
  activeBinding?: {
    elementId: string
    anchor: AnchorPosition
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1,
  viewport: () => ({ x: 0, y: 0, zoom: 1 }),
  dragOffset: () => ({ x: 0, y: 0 }),
  draggingElementIds: () => [],
  isRotatingGroup: false,
  groupRotation: undefined,
  bindingCandidates: () => [],
  activeBinding: null,
})

const emit = defineEmits<{
  elementSelect: [id: string, event: MouseEvent]
  elementMoveStart: [id: string, event: MouseEvent]
  elementResizeStart: [id: string, handle: string, event: MouseEvent]
  elementRotateStart: [id: string, event: MouseEvent]
  elementEditStart: [id: string, type: 'text' | 'label']
  elementContextMenu: [id: string, event: MouseEvent]
  elementDoubleClick: [id: string, event: MouseEvent]
  groupResizeStart: [handle: string, bounds: { x: number; y: number; width: number; height: number }, event: MouseEvent]
  groupMoveStart: [event: MouseEvent]
  groupRotateStart: [bounds: { x: number; y: number; width: number; height: number }, event: MouseEvent]
}>()

const boardStore = useBoardStore()
const toolStore = useToolStore()

// Get elements from store
const elements = computed(() => boardStore.elements)
const selectedElementIds = computed(() => boardStore.selectedElementIds)
const previewElement = computed(() => toolStore.previewElement)

// Get widgets from store (for multi-selection bounds calculation)
const widgets = computed(() => boardStore.widgets)
const selectedWidgetIds = computed(() => boardStore.selectedWidgetIds)

// Create a Set for O(1) selection lookups
const selectedElementIdSet = computed(() => new Set(selectedElementIds.value))

// ============================================================================
// Viewport Culling - Only render elements visible in viewport
// ============================================================================

/**
 * Check if two rectangles intersect.
 */
function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

/**
 * Calculate viewport bounds in canvas coordinates.
 * Includes a margin to prevent pop-in when panning.
 */
const viewportBounds = computed(() => {
  const vp = props.viewport
  const margin = 200 / vp.zoom // 200px screen margin to prevent pop-in
  return {
    x: -vp.x / vp.zoom - margin,
    y: -vp.y / vp.zoom - margin,
    width: (typeof window !== 'undefined' ? window.innerWidth : 1920) / vp.zoom + margin * 2,
    height: (typeof window !== 'undefined' ? window.innerHeight : 1080) / vp.zoom + margin * 2,
  }
})

/**
 * Filter elements to only those visible in viewport.
 * Selected elements are always included to ensure proper interaction.
 */
const visibleElements = computed(() => {
  const bounds = viewportBounds.value
  const selectedSet = selectedElementIdSet.value

  return elements.value.filter(el => {
    // Always include selected elements (for interaction continuity)
    if (selectedSet.has(el.id)) return true
    // Always include elements being dragged
    if (props.draggingElementIds.includes(el.id)) return true
    // Check viewport intersection
    return rectsIntersect(el.rect, bounds)
  })
})

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

// Sort visible elements by z-index for proper layering
// Uses visibleElements (viewport-culled) for performance
const sortedElements = computed(() => {
  return [...visibleElements.value].sort((a, b) => a.zIndex - b.zIndex)
})

// Check if we have multi-selection (2+ items selected - elements and/or widgets)
const totalSelectedCount = computed(() => selectedElementIds.value.length + selectedWidgetIds.value.length)
const isMultiSelection = computed(() => totalSelectedCount.value >= 2)

// Check if any element is being dragged
const isAnyDragging = computed(() => props.draggingElementIds.length > 0)

// Calculate bounding box for all selected items (elements + widgets)
const selectionBounds = computed(() => {
  // Need at least 2 selected items total (elements + widgets)
  if (totalSelectedCount.value < 2) return null

  const selectedElements = selectedElementIds.value
    .map(id => elements.value.find(el => el.id === id))
    .filter((el): el is CanvasElement => el !== undefined)

  const selectedWidgets = selectedWidgetIds.value
    .map(id => widgets.value.find(w => w.id === id))
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  // Need at least 2 items found
  if (selectedElements.length + selectedWidgets.length < 2) return null

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  // Include element bounds
  for (const el of selectedElements) {
    minX = Math.min(minX, el.rect.x)
    minY = Math.min(minY, el.rect.y)
    maxX = Math.max(maxX, el.rect.x + el.rect.width)
    maxY = Math.max(maxY, el.rect.y + el.rect.height)
  }

  // Include widget bounds
  for (const w of selectedWidgets) {
    minX = Math.min(minX, w.rect.x)
    minY = Math.min(minY, w.rect.y)
    maxX = Math.max(maxX, w.rect.x + w.rect.width)
    maxY = Math.max(maxY, w.rect.y + w.rect.height)
  }

  // Apply drag offset if items are being dragged
  if (isAnyDragging.value) {
    minX += props.dragOffset.x
    minY += props.dragOffset.y
    maxX += props.dragOffset.x
    maxY += props.dragOffset.y
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
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

function handleElementDoubleClick(id: string, event: MouseEvent) {
  emit('elementDoubleClick', id, event)
}

function handleGroupResizeStart(handle: string, event: MouseEvent) {
  if (selectionBounds.value) {
    emit('groupResizeStart', handle, selectionBounds.value, event)
  }
}

function handleGroupMoveStart(event: MouseEvent) {
  emit('groupMoveStart', event)
}

function handleGroupRotateStart(event: MouseEvent) {
  if (selectionBounds.value) {
    emit('groupRotateStart', selectionBounds.value, event)
  }
}

// Get elements that are binding candidates (for showing anchor points)
const bindingCandidateElements = computed(() => {
  return props.bindingCandidates
    .map(id => elements.value.find(el => el.id === id))
    .filter((el): el is CanvasElement => el !== undefined)
})
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
      :group-rotation="isRotatingGroup && selectionStateMap[element.id] ? groupRotation : undefined"
      :zoom="zoom"
      @select="handleElementSelect"
      @move-start="handleElementMoveStart"
      @resize-start="handleElementResizeStart"
      @rotate-start="handleElementRotateStart"
      @edit-start="handleElementEditStart"
      @context-menu="handleElementContextMenu"
      @double-click="handleElementDoubleClick"
    />

    <!-- Render preview element during drawing -->
    <ElementRenderer
      v-if="previewElement"
      :element="previewElement"
      :is-preview="true"
      :zoom="zoom"
    />

    <!-- Anchor points overlay for arrow binding candidates -->
    <AnchorPointsOverlay
      v-for="element in bindingCandidateElements"
      :key="`anchor-${element.id}`"
      :element="element"
      :active-anchor="activeBinding?.elementId === element.id ? activeBinding.anchor : null"
      :zoom="zoom"
    />

    <!-- Group selection bounding box (for multi-selection) -->
    <!-- Hidden during rotation to avoid confusing visual feedback -->
    <GroupSelectionBox
      v-if="isMultiSelection && selectionBounds && !isRotatingGroup"
      :bounds="selectionBounds"
      :zoom="zoom"
      :is-dragging="isAnyDragging"
      :show-handles="!isAnyDragging"
      @resize-start="handleGroupResizeStart"
      @move-start="handleGroupMoveStart"
      @rotate-start="handleGroupRotateStart"
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
