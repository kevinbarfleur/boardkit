<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useBoardStore, type Connection, type Bounds } from '@boardkit/core'
import { OrthogonalArrow } from '@boardkit/ui'

// SVG ref for RoughJS rendering
const svgRef = ref<SVGSVGElement | null>(null)
provide('canvasSvg', svgRef)

/**
 * ConnectionsLayer
 *
 * Renders all connections between elements/widgets on the canvas.
 * Also renders the preview connection during connection mode.
 */

interface Props {
  /** Current viewport zoom */
  zoom: number
  /** Whether connection mode is active */
  isConnecting?: boolean
  /** Source of the connection being created */
  connectionSource?: {
    id: string
    type: 'element' | 'widget'
  } | null
  /** Preview endpoint position (cursor position during connection) */
  previewEnd?: { x: number; y: number } | null
  /** Currently selected connection ID */
  selectedConnectionId?: string | null
  /** IDs of potential connection targets (for highlighting) */
  potentialTargets?: string[]
  /** Current drag offset for real-time updates */
  dragOffset?: { x: number; y: number }
  /** IDs of elements currently being dragged */
  draggingElementIds?: string[]
  /** IDs of widgets currently being dragged */
  draggingWidgetIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isConnecting: false,
  connectionSource: null,
  previewEnd: null,
  selectedConnectionId: null,
  potentialTargets: () => [],
  dragOffset: () => ({ x: 0, y: 0 }),
  draggingElementIds: () => [],
  draggingWidgetIds: () => [],
})

const emit = defineEmits<{
  (e: 'select-connection', connectionId: string): void
  (e: 'connection-contextmenu', connectionId: string, event: MouseEvent): void
}>()

const boardStore = useBoardStore()

// Get all connections from the store
const connections = computed(() => boardStore.connections)

/**
 * Get bounds for an element or widget by ID and type.
 * Applies drag offset if the element/widget is currently being dragged.
 */
function getBounds(id: string, type: 'element' | 'widget'): Bounds | null {
  if (type === 'element') {
    const element = boardStore.elements.find((e) => e.id === id)
    if (!element) return null
    // Apply drag offset if this element is being dragged
    if (props.draggingElementIds.includes(id)) {
      return {
        x: element.rect.x + props.dragOffset.x,
        y: element.rect.y + props.dragOffset.y,
        width: element.rect.width,
        height: element.rect.height,
      }
    }
    return element.rect
  } else {
    const widget = boardStore.widgets.find((w) => w.id === id)
    if (!widget) return null
    // Apply drag offset if this widget is being dragged
    if (props.draggingWidgetIds.includes(id)) {
      return {
        x: widget.rect.x + props.dragOffset.x,
        y: widget.rect.y + props.dragOffset.y,
        width: widget.rect.width,
        height: widget.rect.height,
      }
    }
    return widget.rect
  }
}

/**
 * Get bounds for the connection source during preview.
 */
const sourcePreviewBounds = computed<Bounds | null>(() => {
  if (!props.connectionSource) return null
  return getBounds(props.connectionSource.id, props.connectionSource.type)
})

/**
 * Filter out connections where source or target is missing.
 * Also recomputes when drag offset changes for real-time updates.
 */
const validConnections = computed(() => {
  // Touch reactive dependencies to ensure recomputation during drag
  const _offset = props.dragOffset
  const _draggingElements = props.draggingElementIds
  const _draggingWidgets = props.draggingWidgetIds

  return connections.value.filter((conn) => {
    const sourceBounds = getBounds(conn.sourceId, conn.sourceType)
    const targetBounds = getBounds(conn.targetId, conn.targetType)
    return sourceBounds && targetBounds
  })
})

function handleConnectionClick(connectionId: string) {
  emit('select-connection', connectionId)
}

function handleConnectionContextMenu(connectionId: string, event: MouseEvent) {
  emit('connection-contextmenu', connectionId, event)
}
</script>

<template>
  <svg
    ref="svgRef"
    class="connections-layer"
    xmlns="http://www.w3.org/2000/svg"
    :style="{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
    }"
  >
    <!-- Existing connections -->
    <OrthogonalArrow
      v-for="conn in validConnections"
      :key="conn.id"
      :source="getBounds(conn.sourceId, conn.sourceType)!"
      :target="getBounds(conn.targetId, conn.targetType)!"
      :selected="selectedConnectionId === conn.id"
      :stroke-color="conn.style?.strokeColor"
      :stroke-width="conn.style?.strokeWidth"
      :zoom="zoom"
      :connection-id="conn.id"
      @click="handleConnectionClick"
      @contextmenu="handleConnectionContextMenu"
    />

    <!-- Preview connection during connection mode -->
    <OrthogonalArrow
      v-if="isConnecting && sourcePreviewBounds && previewEnd"
      :source="sourcePreviewBounds"
      :target-point="previewEnd"
      :is-preview="true"
      :zoom="zoom"
    />
  </svg>
</template>

<style scoped>
.connections-layer {
  z-index: 1;
}
</style>
