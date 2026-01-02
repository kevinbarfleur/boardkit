<script setup lang="ts">
/**
 * SelectionHandles
 *
 * Resize and rotation handles displayed around a selected element.
 * This component renders SVG handles at corners, edges, and a rotation handle above.
 */

interface Props {
  /** Width of the element */
  width: number
  /** Height of the element */
  height: number
  /** Whether to show corner handles only (for lines) */
  cornersOnly?: boolean
  /** Size of the handles */
  handleSize?: number
  /** Whether to show the rotation handle */
  showRotationHandle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cornersOnly: false,
  handleSize: 8,
  showRotationHandle: true,
})

const emit = defineEmits<{
  resizeStart: [handle: string, event: MouseEvent]
  rotateStart: [event: MouseEvent]
}>()

import { computed } from 'vue'

// Rotation handle position (above the element)
const ROTATION_HANDLE_OFFSET = 24 // Distance above the top edge
const ROTATION_HANDLE_SIZE = 10

const rotationHandleX = computed(() => props.width / 2)
const rotationHandleY = computed(() => -ROTATION_HANDLE_OFFSET)

// Handle positions
const handles = [
  // Corners
  { id: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
  { id: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
  { id: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
  { id: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
  // Edges (optional)
  { id: 'n', x: 0.5, y: 0, cursor: 'ns-resize', edge: true },
  { id: 's', x: 0.5, y: 1, cursor: 'ns-resize', edge: true },
  { id: 'w', x: 0, y: 0.5, cursor: 'ew-resize', edge: true },
  { id: 'e', x: 1, y: 0.5, cursor: 'ew-resize', edge: true },
]

function getHandleX(handle: { x: number }): number {
  return handle.x * props.width - props.handleSize / 2
}

function getHandleY(handle: { y: number }): number {
  return handle.y * props.height - props.handleSize / 2
}

function handleMouseDown(handle: string, event: MouseEvent) {
  event.stopPropagation()
  emit('resizeStart', handle, event)
}

function handleRotateMouseDown(event: MouseEvent) {
  event.stopPropagation()
  emit('rotateStart', event)
}
</script>

<template>
  <g class="selection-handles">
    <!-- Bounding box -->
    <rect
      class="bounding-box"
      :x="0"
      :y="0"
      :width="width"
      :height="height"
      fill="none"
      stroke="hsl(var(--primary))"
      stroke-width="1"
      stroke-dasharray="4 2"
    />

    <!-- Resize Handles -->
    <rect
      v-for="handle in handles.filter((h) => !h.edge || !cornersOnly)"
      :key="handle.id"
      class="handle"
      :x="getHandleX(handle)"
      :y="getHandleY(handle)"
      :width="handleSize"
      :height="handleSize"
      rx="2"
      stroke="hsl(var(--primary))"
      stroke-width="1"
      :style="{ cursor: handle.cursor }"
      @mousedown="handleMouseDown(handle.id, $event)"
      @click.stop
    />

    <!-- Rotation Handle (above element) -->
    <g v-if="showRotationHandle && !cornersOnly" class="rotation-handle-group">
      <!-- Line connecting to top edge -->
      <line
        class="rotation-line"
        :x1="rotationHandleX"
        :y1="0"
        :x2="rotationHandleX"
        :y2="rotationHandleY"
        stroke="hsl(var(--primary))"
        stroke-width="1"
        stroke-dasharray="2 2"
      />
      <!-- Rotation handle circle -->
      <circle
        class="rotation-handle"
        :cx="rotationHandleX"
        :cy="rotationHandleY"
        :r="ROTATION_HANDLE_SIZE / 2"
        stroke="hsl(var(--primary))"
        stroke-width="1"
        @mousedown="handleRotateMouseDown"
        @click.stop
      />
    </g>
  </g>
</template>

<style scoped>
.handle {
  pointer-events: auto;
  fill: hsl(var(--popover));
}

.handle:hover {
  fill: hsl(var(--primary));
}

.bounding-box {
  pointer-events: none;
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
