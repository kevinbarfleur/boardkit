<script setup lang="ts">
/**
 * SelectionHandles
 *
 * Resize handles displayed around a selected element.
 * This component renders SVG handles at corners and edges.
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
}

const props = withDefaults(defineProps<Props>(), {
  cornersOnly: false,
  handleSize: 8,
})

const emit = defineEmits<{
  resizeStart: [handle: string, event: MouseEvent]
}>()

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
      stroke="hsl(217 91% 60%)"
      stroke-width="1"
      stroke-dasharray="4 2"
    />

    <!-- Handles -->
    <rect
      v-for="handle in handles.filter((h) => !h.edge || !cornersOnly)"
      :key="handle.id"
      class="handle"
      :x="getHandleX(handle)"
      :y="getHandleY(handle)"
      :width="handleSize"
      :height="handleSize"
      rx="2"
      fill="white"
      stroke="hsl(217 91% 60%)"
      stroke-width="1"
      :style="{ cursor: handle.cursor }"
      @mousedown="handleMouseDown(handle.id, $event)"
    />
  </g>
</template>

<style scoped>
.handle {
  pointer-events: auto;
}

.handle:hover {
  fill: hsl(217 91% 60%);
}

.bounding-box {
  pointer-events: none;
}
</style>
