<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBoardStore, moduleRegistry, useKeyboardShortcuts } from '@boardkit/core'
import { WidgetFrame } from '@boardkit/ui'
import WidgetRenderer from './WidgetRenderer.vue'

const emit = defineEmits<{
  openCommandPalette: []
}>()

const boardStore = useBoardStore()

const canvasRef = ref<HTMLElement | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const viewportStart = ref({ x: 0, y: 0 })

const widgets = computed(() => boardStore.widgets)
const viewport = computed(() => boardStore.viewport)
const selectedWidgetId = computed(() => boardStore.selectedWidgetId)

const transformStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.zoom})`,
  transformOrigin: '0 0',
}))

// Keyboard shortcuts
const { isSpacePressed } = useKeyboardShortcuts({
  onEscape: () => {
    boardStore.clearSelection()
  },
  onDelete: () => {
    if (selectedWidgetId.value) {
      boardStore.removeWidget(selectedWidgetId.value)
    }
  },
  onDuplicate: () => {
    if (selectedWidgetId.value) {
      boardStore.duplicateWidget(selectedWidgetId.value)
    }
  },
  onResetView: () => {
    boardStore.updateViewport({ x: 0, y: 0, zoom: 1 })
  },
  onCommandPalette: () => {
    emit('openCommandPalette')
  },
  onNudge: (dx, dy) => {
    if (selectedWidgetId.value) {
      boardStore.nudgeWidget(selectedWidgetId.value, dx, dy)
    }
  },
})

// Update cursor when space is pressed
const canvasCursor = computed(() => {
  if (isPanning.value) return 'cursor-grabbing'
  if (isSpacePressed.value) return 'cursor-grab'
  return ''
})

const handleCanvasClick = (e: MouseEvent) => {
  if (e.target === canvasRef.value || (e.target as HTMLElement).classList.contains('canvas-grid')) {
    boardStore.clearSelection()
  }
}

// Zoom constants
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3
const ZOOM_SENSITIVITY = 0.002

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  if (e.ctrlKey || e.metaKey) {
    // Zoom - use smooth multiplier based on delta
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    const zoomFactor = Math.exp(delta)
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.value.zoom * zoomFactor))

    // Zoom toward cursor position
    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect) {
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      // Calculate new viewport position to keep cursor point fixed
      const scale = newZoom / viewport.value.zoom
      const newX = cursorX - (cursorX - viewport.value.x) * scale
      const newY = cursorY - (cursorY - viewport.value.y) * scale

      boardStore.updateViewport({ x: newX, y: newY, zoom: newZoom })
    }
  } else {
    // Pan with trackpad/mouse wheel
    boardStore.updateViewport({
      x: viewport.value.x - e.deltaX,
      y: viewport.value.y - e.deltaY,
    })
  }
}

const startPan = (e: MouseEvent) => {
  // Middle mouse button OR Space + left click
  if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
    e.preventDefault()
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    viewportStart.value = { x: viewport.value.x, y: viewport.value.y }
  }
}

const onPan = (e: MouseEvent) => {
  if (!isPanning.value) return

  const dx = e.clientX - panStart.value.x
  const dy = e.clientY - panStart.value.y

  boardStore.updateViewport({
    x: viewportStart.value.x + dx,
    y: viewportStart.value.y + dy,
  })
}

const stopPan = () => {
  isPanning.value = false
}

const handleWidgetSelect = (id: string) => {
  boardStore.selectWidget(id)
}

const handleWidgetMove = (id: string, x: number, y: number) => {
  boardStore.moveWidget(id, x, y)
}

const handleWidgetResize = (id: string, width: number, height: number) => {
  boardStore.resizeWidget(id, width, height)
}

const handleWidgetDelete = (id: string) => {
  boardStore.removeWidget(id)
}

const getModuleDisplayName = (moduleId: string) => {
  const module = moduleRegistry.get(moduleId)
  return module?.displayName ?? moduleId
}

// Prevent default browser behavior for space key (scrolling)
const preventSpaceScroll = (e: KeyboardEvent) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('mousemove', onPan)
  document.addEventListener('mouseup', stopPan)
  document.addEventListener('keydown', preventSpaceScroll)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onPan)
  document.removeEventListener('mouseup', stopPan)
  document.removeEventListener('keydown', preventSpaceScroll)
})
</script>

<template>
  <div
    ref="canvasRef"
    class="board-canvas flex-1 overflow-hidden bg-background canvas-grid relative select-none"
    :class="canvasCursor"
    @click="handleCanvasClick"
    @wheel="handleWheel"
    @mousedown="startPan"
  >
    <!-- Canvas content with transform -->
    <div class="canvas-transform absolute inset-0" :style="transformStyle">
      <WidgetFrame
        v-for="widget in widgets"
        :key="widget.id"
        :id="widget.id"
        :title="getModuleDisplayName(widget.moduleId)"
        :x="widget.rect.x"
        :y="widget.rect.y"
        :width="widget.rect.width"
        :height="widget.rect.height"
        :z-index="widget.zIndex"
        :selected="selectedWidgetId === widget.id"
        @select="handleWidgetSelect"
        @move="handleWidgetMove"
        @resize="handleWidgetResize"
        @delete="handleWidgetDelete"
      >
        <WidgetRenderer :widget-id="widget.id" :module-id="widget.moduleId" />
      </WidgetFrame>
    </div>

    <!-- Zoom indicator -->
    <div class="absolute bottom-4 right-4 px-2 py-1 rounded bg-background/80 border text-xs text-muted-foreground pointer-events-none">
      {{ Math.round(viewport.zoom * 100) }}%
    </div>
  </div>
</template>
