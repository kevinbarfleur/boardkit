<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  useBoardStore,
  moduleRegistry,
  useKeyboardShortcuts,
  actionRegistry,
  type ActionContext,
  type ActionContextType,
} from '@boardkit/core'
import {
  WidgetFrame,
  BkContextMenu,
  type ContextMenuItem,
  type ContextMenuItemOrSeparator,
} from '@boardkit/ui'
import WidgetRenderer from './WidgetRenderer.vue'

const emit = defineEmits<{
  openCommandPalette: []
}>()

const boardStore = useBoardStore()

const canvasRef = ref<HTMLElement | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const viewportStart = ref({ x: 0, y: 0 })

// Context menu state
const contextMenu = ref({
  open: false,
  x: 0,
  y: 0,
  type: 'canvas' as ActionContextType,
  canvasPosition: { x: 0, y: 0 },
})

const widgets = computed(() => boardStore.widgets)
const viewport = computed(() => boardStore.viewport)
const selectedWidgetId = computed(() => boardStore.selectedWidgetId)

const transformStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.zoom})`,
  transformOrigin: '0 0',
}))

// Grid background style - moves with viewport for parallax effect
const gridStyle = computed(() => ({
  backgroundPosition: `${viewport.value.x}px ${viewport.value.y}px`,
  backgroundSize: `${20 * viewport.value.zoom}px ${20 * viewport.value.zoom}px`,
}))

// Build action context
const buildActionContext = (pointerPosition?: { x: number; y: number }): ActionContext => ({
  selectedWidget: boardStore.selectedWidget,
  selectedWidgetId: boardStore.selectedWidgetId,
  viewport: boardStore.viewport,
  widgets: boardStore.widgets,
  platform: 'desktop',
  isDirty: boardStore.isDirty,
  pointerPosition,
})

// Convert screen coordinates to canvas coordinates
const screenToCanvas = (screenX: number, screenY: number) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }

  const relativeX = screenX - rect.left
  const relativeY = screenY - rect.top

  // Remove viewport translation and zoom
  const canvasX = (relativeX - viewport.value.x) / viewport.value.zoom
  const canvasY = (relativeY - viewport.value.y) / viewport.value.zoom

  return { x: canvasX, y: canvasY }
}

// Build context menu items from actions
const contextMenuItems = computed<ContextMenuItemOrSeparator[]>(() => {
  const ctx = buildActionContext(contextMenu.value.canvasPosition)
  const actions = actionRegistry.getAvailable(ctx, { context: contextMenu.value.type })

  const items: ContextMenuItemOrSeparator[] = []
  let lastGroup = ''

  for (const action of actions) {
    // Add separator between groups
    if (lastGroup && action.group !== lastGroup) {
      items.push({ separator: true })
    }
    lastGroup = action.group

    items.push({
      id: action.id,
      label: action.title,
      icon: action.icon,
      shortcut: action.shortcutHint,
      disabled: action.when ? !action.when(ctx) : false,
    })
  }

  return items
})

// Handle context menu item selection
const handleContextMenuSelect = async (item: ContextMenuItem) => {
  const ctx = buildActionContext(contextMenu.value.canvasPosition)
  await actionRegistry.execute(item.id, ctx)
}

// Handle right-click on canvas
const handleCanvasContextMenu = (e: MouseEvent) => {
  e.preventDefault()

  // Check if click was on empty canvas
  const target = e.target as HTMLElement
  if (target === canvasRef.value || target.classList.contains('canvas-grid') || target.classList.contains('canvas-transform')) {
    boardStore.clearSelection()
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    contextMenu.value = {
      open: true,
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
      canvasPosition: canvasPos,
    }
  }
}

// Handle right-click on widget (called from WidgetFrame)
const handleWidgetContextMenu = (widgetId: string, e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  boardStore.selectWidget(widgetId)
  contextMenu.value = {
    open: true,
    x: e.clientX,
    y: e.clientY,
    type: 'widget',
    canvasPosition: { x: 0, y: 0 },
  }
}

const closeContextMenu = () => {
  contextMenu.value.open = false
}

// Keyboard shortcuts
const { isSpacePressed } = useKeyboardShortcuts({
  onEscape: () => {
    if (contextMenu.value.open) {
      closeContextMenu()
    } else {
      boardStore.clearSelection()
    }
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

// Check if an element or its ancestors is a scrollable container (regardless of current scroll position)
const isInsideScrollableContainer = (element: HTMLElement): boolean => {
  let current: HTMLElement | null = element

  while (current && current !== canvasRef.value) {
    const style = getComputedStyle(current)
    const overflowY = style.overflowY
    const overflowX = style.overflowX

    // Check if this is a scrollable container (has overflow auto/scroll and content that overflows)
    const isVerticallyScrollable = (overflowY === 'auto' || overflowY === 'scroll') &&
                                    current.scrollHeight > current.clientHeight
    const isHorizontallyScrollable = (overflowX === 'auto' || overflowX === 'scroll') &&
                                      current.scrollWidth > current.clientWidth

    if (isVerticallyScrollable || isHorizontallyScrollable) {
      return true
    }

    current = current.parentElement
  }

  return false
}

const handleWheel = (e: WheelEvent) => {
  // If we're inside a scrollable widget, never propagate scroll to canvas
  // User must use Space+drag or be outside the widget to pan the canvas
  const target = e.target as HTMLElement
  if (!e.ctrlKey && !e.metaKey && isInsideScrollableContainer(target)) {
    // Let the element handle scrolling, don't touch the canvas
    return
  }

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
    :style="gridStyle"
    @click="handleCanvasClick"
    @wheel="handleWheel"
    @mousedown="startPan"
    @contextmenu="handleCanvasContextMenu"
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
        @contextmenu.native="(e: MouseEvent) => handleWidgetContextMenu(widget.id, e)"
      >
        <WidgetRenderer :widget-id="widget.id" :module-id="widget.moduleId" />
      </WidgetFrame>
    </div>

    <!-- Zoom indicator -->
    <div class="absolute bottom-4 right-4 px-2 py-1 rounded bg-background/80 border text-xs text-muted-foreground pointer-events-none">
      {{ Math.round(viewport.zoom * 100) }}%
    </div>

    <!-- Context Menu -->
    <BkContextMenu
      :open="contextMenu.open"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenuItems"
      @close="closeContextMenu"
      @select="handleContextMenuSelect"
    />
  </div>
</template>
