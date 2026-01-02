<script setup lang="ts">
import { computed } from 'vue'

/**
 * GroupSelectionBox
 *
 * Displays a bounding box around multiple selected elements.
 * Shows resize handles for resizing the entire selection.
 */

interface Props {
  /** Bounding box coordinates and dimensions */
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  /** Whether to show resize handles */
  showHandles?: boolean
  /** Size of the handles */
  handleSize?: number
  /** Current zoom level (for stroke scaling) */
  zoom?: number
  /** Whether drag is in progress (hides handles) */
  isDragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHandles: true,
  handleSize: 8,
  zoom: 1,
  isDragging: false,
})

const emit = defineEmits<{
  resizeStart: [handle: string, event: MouseEvent]
  moveStart: [event: MouseEvent]
  rotateStart: [event: MouseEvent]
}>()

// Scale-compensated values for consistent visual appearance
const strokeWidth = computed(() => 1.5 / props.zoom)
const scaledHandleSize = computed(() => props.handleSize / props.zoom)

// Rotation handle position (above the element)
const ROTATION_HANDLE_OFFSET = 24
const ROTATION_HANDLE_SIZE = 10
const scaledRotationOffset = computed(() => ROTATION_HANDLE_OFFSET / props.zoom)
const scaledRotationSize = computed(() => ROTATION_HANDLE_SIZE / props.zoom)

const rotationHandleX = computed(() => props.bounds.x + props.bounds.width / 2)
const rotationHandleY = computed(() => props.bounds.y - scaledRotationOffset.value)

// Handle positions (corners only for group selection)
const handles = [
  { id: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
  { id: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
  { id: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
  { id: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
]

function getHandleX(handle: { x: number }): number {
  return props.bounds.x + handle.x * props.bounds.width - scaledHandleSize.value / 2
}

function getHandleY(handle: { y: number }): number {
  return props.bounds.y + handle.y * props.bounds.height - scaledHandleSize.value / 2
}

// Dash array scaled for zoom
const dashArray = computed(() => `${4 / props.zoom} ${2 / props.zoom}`)

function handleMouseDown(handle: string, event: MouseEvent) {
  event.stopPropagation()
  emit('resizeStart', handle, event)
}

function handleBoxMouseDown(event: MouseEvent) {
  event.stopPropagation()
  emit('moveStart', event)
}

function handleRotateMouseDown(event: MouseEvent) {
  event.stopPropagation()
  emit('rotateStart', event)
}
</script>

<template>
  <g class="group-selection-box">
    <!-- Draggable fill area (transparent but clickable) -->
    <rect
      class="group-drag-area"
      :x="bounds.x"
      :y="bounds.y"
      :width="bounds.width"
      :height="bounds.height"
      fill="transparent"
      @mousedown="handleBoxMouseDown"
      @click.stop
    />

    <!-- Outer bounding box (dashed) -->
    <rect
      class="group-bounds"
      :x="bounds.x"
      :y="bounds.y"
      :width="bounds.width"
      :height="bounds.height"
      fill="none"
      stroke="hsl(var(--primary))"
      :stroke-width="strokeWidth"
      :stroke-dasharray="dashArray"
    />

    <!-- Corner handles -->
    <template v-if="showHandles && !isDragging">
      <rect
        v-for="handle in handles"
        :key="handle.id"
        class="group-handle"
        :x="getHandleX(handle)"
        :y="getHandleY(handle)"
        :width="scaledHandleSize"
        :height="scaledHandleSize"
        rx="2"
        fill="hsl(var(--popover))"
        stroke="hsl(var(--primary))"
        :stroke-width="strokeWidth"
        :style="{ cursor: handle.cursor }"
        @mousedown="handleMouseDown(handle.id, $event)"
        @click.stop
      />
    </template>

    <!-- Rotation Handle (above element) -->
    <g v-if="showHandles && !isDragging" class="rotation-handle-group">
      <!-- Line connecting to top edge -->
      <line
        class="rotation-line"
        :x1="rotationHandleX"
        :y1="bounds.y"
        :x2="rotationHandleX"
        :y2="rotationHandleY"
        stroke="hsl(var(--primary))"
        :stroke-width="strokeWidth"
        stroke-dasharray="2 2"
      />
      <!-- Rotation handle circle -->
      <circle
        class="rotation-handle"
        :cx="rotationHandleX"
        :cy="rotationHandleY"
        :r="scaledRotationSize / 2"
        stroke="hsl(var(--primary))"
        :stroke-width="strokeWidth"
        @mousedown="handleRotateMouseDown"
        @click.stop
      />
    </g>
  </g>
</template>

<style scoped>
.group-drag-area {
  pointer-events: auto;
  cursor: move;
}

.group-bounds {
  pointer-events: none;
}

.group-handle {
  pointer-events: auto;
}

.group-handle:hover {
  fill: hsl(var(--primary));
}

.rotation-line {
  pointer-events: none;
}

.rotation-handle {
  pointer-events: auto;
  fill: hsl(var(--popover));
  cursor: grab;
}

.rotation-handle:hover {
  fill: hsl(var(--primary));
}

.rotation-handle:active {
  cursor: grabbing;
}
</style>
