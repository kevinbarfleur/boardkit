<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import {
  useBoardStore,
  useToolStore,
  moduleRegistry,
  useKeyboardShortcuts,
  actionRegistry,
  FONT_FAMILY_CSS,
  DEFAULT_WIDGET_VISIBILITY,
  type ActionContext,
  type ActionContextType,
  type CanvasElement,
  type TextElement,
  type Widget,
  isDrawingTool,
} from '@boardkit/core'
import {
  WidgetFrame,
  BkContextMenu,
  BkDataSourcePicker,
  useTheme,
  type ContextMenuItem,
  type ContextMenuItemOrSeparator,
} from '@boardkit/ui'
import WidgetRenderer from './WidgetRenderer.vue'
import CanvasElementsLayer from './CanvasElementsLayer.vue'
import ToolToolbar from './ToolToolbar.vue'
import { useDataSharingUI } from '../composables/useDataSharingUI'

const emit = defineEmits<{
  openCommandPalette: []
}>()

const boardStore = useBoardStore()
const toolStore = useToolStore()
const dataSharingUI = useDataSharingUI()
const { theme } = useTheme()

// Grid color based on theme (white for dark, black for light)
const gridColor = computed(() => {
  // Get the effective theme (considering 'system' option)
  const effectiveTheme = theme.value === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme.value
  return effectiveTheme === 'light' ? '0, 0, 0' : '255, 255, 255'
})

// Helper to get widget visibility with defaults
const getWidgetVisibility = (widget: Widget) => ({
  restMode: widget.visibility?.restMode ?? DEFAULT_WIDGET_VISIBILITY.restMode,
  hoverMode: widget.visibility?.hoverMode ?? DEFAULT_WIDGET_VISIBILITY.hoverMode,
})

const canvasRef = ref<HTMLElement | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const viewportStart = ref({ x: 0, y: 0 })

// CSS Transform-based drag state (for performance optimization)
// During drag, we use CSS transform instead of mutating element data
// Using shallowRef to avoid unnecessary reactivity overhead on frequent updates
const moveStart = shallowRef({ x: 0, y: 0 })
const dragOffset = shallowRef({ x: 0, y: 0 })
const isDraggingWithTransform = ref(false)
const draggingElementIds = ref<string[]>([])
const draggingWidgetIds = ref<string[]>([])

// Element resize state
const isResizingElement = ref(false)
const resizingElementId = ref<string | null>(null)
const resizeHandle = ref<string | null>(null)
const resizeStart = shallowRef({ x: 0, y: 0 })
const elementStartRect = shallowRef({ x: 0, y: 0, width: 0, height: 0 })

// Marquee selection state
const isMarqueeSelecting = ref(false)
const marqueeStart = ref({ x: 0, y: 0 })
const marqueeEnd = ref({ x: 0, y: 0 })
const justFinishedMarquee = ref(false) // Flag to prevent click from clearing selection

// Text editing state
const isEditingText = ref(false)
const editingElementId = ref<string | null>(null)
const editingType = ref<'text' | 'label'>('text')
const editValue = ref('')
const textEditorRef = ref<HTMLTextAreaElement | null>(null)

// Context menu state
const contextMenu = ref({
  open: false,
  x: 0,
  y: 0,
  type: 'canvas' as ActionContextType | 'element',
  canvasPosition: { x: 0, y: 0 },
})

const widgets = computed(() => boardStore.widgets)
const elements = computed(() => boardStore.elements)
const viewport = computed(() => boardStore.viewport)
const background = computed(() => boardStore.background)
const selectedWidgetId = computed(() => boardStore.selectedWidgetId)
const selectedElementId = computed(() => boardStore.selectedElementId)
const selectedElementIds = computed(() => boardStore.selectedElementIds)
const selectedWidgetIds = computed(() => boardStore.selectedWidgetIds)
const isMultiSelection = computed(() => boardStore.isMultiSelection)
const activeTool = computed(() => toolStore.activeTool)
const isDrawing = computed(() => toolStore.isDrawing)

// Marquee rect in canvas coordinates
const marqueeRect = computed(() => {
  if (!isMarqueeSelecting.value) return null

  const x = Math.min(marqueeStart.value.x, marqueeEnd.value.x)
  const y = Math.min(marqueeStart.value.y, marqueeEnd.value.y)
  const width = Math.abs(marqueeEnd.value.x - marqueeStart.value.x)
  const height = Math.abs(marqueeEnd.value.y - marqueeStart.value.y)

  return { x, y, width, height }
})

// Marquee style for rendering (in screen coordinates)
const marqueeStyle = computed(() => {
  if (!marqueeRect.value) return {}

  const zoom = viewport.value.zoom
  const left = viewport.value.x + marqueeRect.value.x * zoom
  const top = viewport.value.y + marqueeRect.value.y * zoom
  const width = marqueeRect.value.width * zoom
  const height = marqueeRect.value.height * zoom

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px dashed hsl(var(--primary))',
    backgroundColor: 'hsla(var(--primary), 0.1)',
    pointerEvents: 'none' as const,
    zIndex: 1000,
  }
})

const transformStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.zoom})`,
  transformOrigin: '0 0',
}))

// Background pattern style
const backgroundStyle = computed(() => {
  const bg = background.value
  const baseSize = 20 * viewport.value.zoom

  let backgroundImage = 'none'
  if (bg.pattern === 'dots') {
    backgroundImage = `radial-gradient(circle, rgba(${gridColor.value}, 0.1) 1px, transparent 1px)`
  } else if (bg.pattern === 'grid') {
    backgroundImage = `
      linear-gradient(rgba(${gridColor.value}, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(${gridColor.value}, 0.05) 1px, transparent 1px)
    `
  }

  // Use theme background when color is 'auto' or matches old default dark color
  const isAutoColor = bg.color === 'auto' || bg.color === '#0a0a0a'
  const bgColor = isAutoColor ? 'hsl(var(--background))' : bg.color

  return {
    backgroundColor: bgColor,
    backgroundImage,
    backgroundPosition: `${viewport.value.x}px ${viewport.value.y}px`,
    backgroundSize: `${baseSize}px ${baseSize}px`,
  }
})

// Editing element data
const editingElement = computed(() => {
  if (!editingElementId.value) return null
  return elements.value.find((e) => e.id === editingElementId.value) ?? null
})

// Text editor overlay style
const textEditorStyle = computed(() => {
  if (!editingElement.value) return {}

  const el = editingElement.value
  const zoom = viewport.value.zoom

  // Calculate screen position
  const left = viewport.value.x + el.rect.x * zoom
  const top = viewport.value.y + el.rect.y * zoom
  const width = el.rect.width * zoom
  const height = el.rect.height * zoom

  // Get text element specific styles
  const isText = el.type === 'text'
  const textEl = isText ? (el as TextElement) : null
  const fontFamily = textEl?.fontFamily ?? 'system'
  const fontSize = textEl?.fontSize ?? 14
  const textAlign = textEl?.textAlign ?? (isText ? 'left' : 'center')
  const color = el.style.strokeColor

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    minHeight: `${height}px`,
    fontFamily: FONT_FAMILY_CSS[fontFamily],
    fontSize: `${fontSize * zoom}px`,
    textAlign,
    color,
    lineHeight: '1.4',
    padding: editingType.value === 'text' ? '4px' : '8px',
    display: editingType.value === 'label' ? 'flex' : 'block',
    alignItems: editingType.value === 'label' ? 'center' : undefined,
    justifyContent: editingType.value === 'label' ? 'center' : undefined,
  }
})

// Build action context
const buildActionContext = (pointerPosition?: { x: number; y: number }): ActionContext => ({
  selectedWidget: boardStore.selectedWidget,
  selectedWidgetId: boardStore.selectedWidgetId,
  selectedElement: boardStore.selectedElement,
  selectedElementId: boardStore.selectedElementId,
  activeTool: toolStore.activeTool,
  viewport: boardStore.viewport,
  widgets: boardStore.widgets,
  elements: boardStore.elements,
  platform: 'web',
  isDirty: boardStore.isDirty,
  pointerPosition,
})

// Convert screen coordinates to canvas coordinates
const screenToCanvas = (screenX: number, screenY: number) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }

  const relativeX = screenX - rect.left
  const relativeY = screenY - rect.top

  const canvasX = (relativeX - viewport.value.x) / viewport.value.zoom
  const canvasY = (relativeY - viewport.value.y) / viewport.value.zoom

  return { x: canvasX, y: canvasY }
}

// Build context menu items from actions
const contextMenuItems = computed<ContextMenuItemOrSeparator[]>(() => {
  const ctx = buildActionContext(contextMenu.value.canvasPosition)
  const contextType = contextMenu.value.type === 'element' ? 'widget' : contextMenu.value.type
  const actions = actionRegistry.getAvailable(ctx, { context: contextType as ActionContextType })

  const items: ContextMenuItemOrSeparator[] = []
  let lastGroup = ''

  for (const action of actions) {
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

  const target = e.target as HTMLElement
  if (
    target === canvasRef.value ||
    target.classList.contains('canvas-background') ||
    target.classList.contains('canvas-transform')
  ) {
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

// Handle right-click on widget
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
    } else if (isDrawing.value) {
      toolStore.cancelDrawing()
    } else {
      boardStore.clearSelection()
    }
  },
  onDelete: () => {
    if (selectedWidgetId.value) {
      boardStore.removeWidget(selectedWidgetId.value)
    } else if (selectedElementId.value) {
      boardStore.removeElement(selectedElementId.value)
    }
  },
  onDuplicate: () => {
    if (selectedWidgetId.value) {
      boardStore.duplicateWidget(selectedWidgetId.value)
    } else if (selectedElementId.value) {
      boardStore.duplicateElement(selectedElementId.value)
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
    } else if (selectedElementId.value) {
      boardStore.nudgeElement(selectedElementId.value, dx, dy)
    }
  },
  onToolSwitch: (tool) => {
    toolStore.setTool(tool)
  },
})

// Cursor style based on tool and state
const canvasCursor = computed(() => {
  if (isPanning.value) return 'cursor-grabbing'
  if (isSpacePressed.value || activeTool.value === 'hand') return 'cursor-grab'
  if (isDrawingTool(activeTool.value)) return 'cursor-crosshair'
  return ''
})

// Handle canvas click
const handleCanvasClick = (e: MouseEvent) => {
  // Skip clearing selection if we just finished a marquee selection
  // (click event fires after mouseup, which would clear the selection we just made)
  if (justFinishedMarquee.value) {
    justFinishedMarquee.value = false
    return
  }

  const target = e.target as HTMLElement
  if (
    target === canvasRef.value ||
    target.classList.contains('canvas-background') ||
    target.classList.contains('canvas-transform')
  ) {
    boardStore.clearSelection()
  }
}

// Handle canvas mousedown - start drawing, panning, or marquee selection
const handleCanvasMouseDown = (e: MouseEvent) => {
  // Middle mouse button OR Space + left click = pan
  if (e.button === 1 || (e.button === 0 && (isSpacePressed.value || activeTool.value === 'hand'))) {
    e.preventDefault()
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    viewportStart.value = { x: viewport.value.x, y: viewport.value.y }
    return
  }

  // Left click with drawing tool = start drawing
  if (e.button === 0 && isDrawingTool(activeTool.value)) {
    const target = e.target as HTMLElement
    // Only start drawing on empty canvas areas
    if (
      target === canvasRef.value ||
      target.classList.contains('canvas-background') ||
      target.classList.contains('canvas-transform') ||
      target.closest('.elements-layer')
    ) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY)
      toolStore.startDrawing(canvasPos)
    }
    return
  }

  // Left click with select tool on empty canvas = start marquee selection
  if (e.button === 0 && activeTool.value === 'select') {
    const target = e.target as HTMLElement
    const isValidTarget =
      target === canvasRef.value ||
      target.classList.contains('canvas-background') ||
      target.classList.contains('canvas-transform') ||
      target.classList.contains('elements-layer')

    if (isValidTarget) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY)

      // Clear selection unless shift is held (to add to selection)
      if (!e.shiftKey) {
        boardStore.clearSelection()
      }

      isMarqueeSelecting.value = true
      marqueeStart.value = canvasPos
      marqueeEnd.value = canvasPos
    }
  }
}

// Handle canvas mousemove - update drawing, panning, or marquee selection
const handleCanvasMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    const dx = e.clientX - panStart.value.x
    const dy = e.clientY - panStart.value.y
    boardStore.updateViewport({
      x: viewportStart.value.x + dx,
      y: viewportStart.value.y + dy,
    })
    return
  }

  if (isMarqueeSelecting.value) {
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    marqueeEnd.value = canvasPos
    return
  }

  if (isDrawing.value) {
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    toolStore.updateDrawing(canvasPos, e.shiftKey)
    return
  }

  if (isResizingElement.value && resizingElementId.value && resizeHandle.value) {
    const dx = (e.clientX - resizeStart.value.x) / viewport.value.zoom
    const dy = (e.clientY - resizeStart.value.y) / viewport.value.zoom

    const newRect = calculateResizedRect(
      elementStartRect.value,
      resizeHandle.value,
      dx,
      dy,
      e.shiftKey
    )

    // Skip dirty marking during live drag for performance
    boardStore.resizeElement(resizingElementId.value, newRect, true)
    return
  }

  // CSS Transform-based dragging (optimized path - no expensive recalculations)
  // Only update the drag offset, which triggers a CSS transform change
  if (isDraggingWithTransform.value) {
    const dx = (e.clientX - moveStart.value.x) / viewport.value.zoom
    const dy = (e.clientY - moveStart.value.y) / viewport.value.zoom
    dragOffset.value = { x: dx, y: dy }
    return
  }
}

// Handle canvas mouseup - finish drawing, marquee selection, or movement
const handleCanvasMouseUp = (e: MouseEvent) => {
  if (isPanning.value) {
    isPanning.value = false
    return
  }

  if (isMarqueeSelecting.value) {
    // IMPORTANT: Capture the rect BEFORE setting isMarqueeSelecting to false
    // because marqueeRect computed depends on isMarqueeSelecting being true
    const finalRect = marqueeRect.value
    isMarqueeSelecting.value = false

    // Only select if marquee has some size (not just a click)
    if (finalRect && (finalRect.width > 5 || finalRect.height > 5)) {
      boardStore.selectInRect(finalRect, e.shiftKey)
      // Set flag to prevent the click event from clearing selection
      justFinishedMarquee.value = true
    }
    return
  }

  if (isDrawing.value) {
    const element = toolStore.finishDrawing()
    if (element) {
      // Add element to store (without id and zIndex, store will assign them)
      const { id, zIndex, ...elementData } = element
      boardStore.addElement(elementData as Omit<CanvasElement, 'id' | 'zIndex'>)
    }
    return
  }

  if (isResizingElement.value) {
    isResizingElement.value = false
    resizingElementId.value = null
    resizeHandle.value = null
    // Mark dirty after resize is complete
    boardStore.markDirty('Resized element')
    return
  }

  // CSS Transform-based drag completion - commit the final position
  if (isDraggingWithTransform.value) {
    isDraggingWithTransform.value = false

    // Only commit if there was actual movement
    if (dragOffset.value.x !== 0 || dragOffset.value.y !== 0) {
      // Commit element movements
      for (const id of draggingElementIds.value) {
        const element = elements.value.find((e) => e.id === id)
        if (element) {
          boardStore.moveElement(
            id,
            element.rect.x + dragOffset.value.x,
            element.rect.y + dragOffset.value.y,
            true // skipDirty during batch
          )
        }
      }

      // Commit widget movements
      for (const id of draggingWidgetIds.value) {
        const widget = widgets.value.find((w) => w.id === id)
        if (widget) {
          boardStore.moveWidget(
            id,
            widget.rect.x + dragOffset.value.x,
            widget.rect.y + dragOffset.value.y
          )
        }
      }

      boardStore.markDirty('Moved selection')
    }

    draggingElementIds.value = []
    draggingWidgetIds.value = []
    dragOffset.value = { x: 0, y: 0 }
    return
  }
}

// Zoom constants
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3
const ZOOM_SENSITIVITY = 0.002

// Cache for scrollable container checks to avoid repeated getComputedStyle calls
const scrollableCache = new WeakMap<HTMLElement, boolean>()

const isInsideScrollableContainer = (element: HTMLElement): boolean => {
  // Check cache first
  if (scrollableCache.has(element)) {
    return scrollableCache.get(element)!
  }

  let current: HTMLElement | null = element
  let result = false

  while (current && current !== canvasRef.value) {
    // Quick check without getComputedStyle first
    const hasScrollableContent =
      current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth

    if (hasScrollableContent) {
      // Only call getComputedStyle when we have scrollable content
      const style = getComputedStyle(current)
      const overflowY = style.overflowY
      const overflowX = style.overflowX

      const isVerticallyScrollable =
        (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight
      const isHorizontallyScrollable =
        (overflowX === 'auto' || overflowX === 'scroll') && current.scrollWidth > current.clientWidth

      if (isVerticallyScrollable || isHorizontallyScrollable) {
        result = true
        break
      }
    }

    current = current.parentElement
  }

  // Cache the result
  scrollableCache.set(element, result)
  return result
}

const handleWheel = (e: WheelEvent) => {
  const target = e.target as HTMLElement
  if (!e.ctrlKey && !e.metaKey && isInsideScrollableContainer(target)) {
    return
  }

  e.preventDefault()

  if (e.ctrlKey || e.metaKey) {
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    const zoomFactor = Math.exp(delta)
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.value.zoom * zoomFactor))

    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect) {
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const scale = newZoom / viewport.value.zoom
      const newX = cursorX - (cursorX - viewport.value.x) * scale
      const newY = cursorY - (cursorY - viewport.value.y) * scale

      boardStore.updateViewport({ x: newX, y: newY, zoom: newZoom })
    }
  } else {
    boardStore.updateViewport({
      x: viewport.value.x - e.deltaX,
      y: viewport.value.y - e.deltaY,
    })
  }
}

// Element event handlers
const handleElementSelect = (id: string, event?: MouseEvent) => {
  if (activeTool.value === 'select') {
    const addToSelection = event?.shiftKey || event?.metaKey || event?.ctrlKey

    // If clicking on an already-selected element without modifier keys,
    // don't change the selection (preserve multi-selection for dragging)
    if (!addToSelection && boardStore.isSelected('element', id)) {
      return
    }

    boardStore.selectElement(id, addToSelection)
  }
}

const handleElementMoveStart = (id: string, event: MouseEvent) => {
  if (activeTool.value !== 'select') return

  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  // Check if this element is part of a multi-selection
  const isPartOfSelection = boardStore.isSelected('element', id)

  if (isPartOfSelection && isMultiSelection.value) {
    // Move all selected elements using CSS transform
    isDraggingWithTransform.value = true
    draggingElementIds.value = [...boardStore.selectedElementIds]
    draggingWidgetIds.value = [...boardStore.selectedWidgetIds]
    moveStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { x: 0, y: 0 }
  } else {
    // Move single element using CSS transform
    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      boardStore.selectElement(id)
    }
    isDraggingWithTransform.value = true
    draggingElementIds.value = [id]
    moveStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { x: 0, y: 0 }
  }
}

// Calculate new rect based on resize handle and delta
const calculateResizedRect = (
  startRect: { x: number; y: number; width: number; height: number },
  handle: string,
  dx: number,
  dy: number,
  maintainRatio: boolean
) => {
  let { x, y, width, height } = startRect
  const MIN_SIZE = 10
  const ratio = startRect.width / startRect.height

  switch (handle) {
    case 'se': // South-East
      width = Math.max(MIN_SIZE, startRect.width + dx)
      height = Math.max(MIN_SIZE, startRect.height + dy)
      break
    case 'sw': // South-West
      x = startRect.x + dx
      width = Math.max(MIN_SIZE, startRect.width - dx)
      height = Math.max(MIN_SIZE, startRect.height + dy)
      if (width === MIN_SIZE) x = startRect.x + startRect.width - MIN_SIZE
      break
    case 'ne': // North-East
      y = startRect.y + dy
      width = Math.max(MIN_SIZE, startRect.width + dx)
      height = Math.max(MIN_SIZE, startRect.height - dy)
      if (height === MIN_SIZE) y = startRect.y + startRect.height - MIN_SIZE
      break
    case 'nw': // North-West
      x = startRect.x + dx
      y = startRect.y + dy
      width = Math.max(MIN_SIZE, startRect.width - dx)
      height = Math.max(MIN_SIZE, startRect.height - dy)
      if (width === MIN_SIZE) x = startRect.x + startRect.width - MIN_SIZE
      if (height === MIN_SIZE) y = startRect.y + startRect.height - MIN_SIZE
      break
    case 'n': // North
      y = startRect.y + dy
      height = Math.max(MIN_SIZE, startRect.height - dy)
      if (height === MIN_SIZE) y = startRect.y + startRect.height - MIN_SIZE
      break
    case 's': // South
      height = Math.max(MIN_SIZE, startRect.height + dy)
      break
    case 'e': // East
      width = Math.max(MIN_SIZE, startRect.width + dx)
      break
    case 'w': // West
      x = startRect.x + dx
      width = Math.max(MIN_SIZE, startRect.width - dx)
      if (width === MIN_SIZE) x = startRect.x + startRect.width - MIN_SIZE
      break
  }

  // Maintain aspect ratio if shift is held (corner handles only)
  if (maintainRatio && ['nw', 'ne', 'se', 'sw'].includes(handle)) {
    if (Math.abs(dx) > Math.abs(dy)) {
      const newHeight = width / ratio
      if (handle.includes('n')) {
        y = startRect.y + startRect.height - newHeight
      }
      height = newHeight
    } else {
      const newWidth = height * ratio
      if (handle.includes('w')) {
        x = startRect.x + startRect.width - newWidth
      }
      width = newWidth
    }
  }

  return { x, y, width, height }
}

const handleElementResizeStart = (id: string, handle: string, event: MouseEvent) => {
  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  event.stopPropagation()

  isResizingElement.value = true
  resizingElementId.value = id
  resizeHandle.value = handle
  resizeStart.value = { x: event.clientX, y: event.clientY }
  elementStartRect.value = { ...element.rect }
}

// Text editing handlers
const handleElementEditStart = (id: string, type: 'text' | 'label') => {
  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  // Get current content
  let content = ''
  if (type === 'text' && element.type === 'text') {
    content = (element as any).content ?? ''
  } else if (type === 'label' && (element.type === 'rectangle' || element.type === 'ellipse')) {
    content = (element as any).label ?? ''
  }

  isEditingText.value = true
  editingElementId.value = id
  editingType.value = type
  editValue.value = content

  // Focus the textarea after it renders and auto-resize
  setTimeout(() => {
    textEditorRef.value?.focus()
    textEditorRef.value?.select()
    autoResizeTextarea()
  }, 0)
}

const saveTextEdit = () => {
  if (!editingElementId.value) return

  const element = elements.value.find((e) => e.id === editingElementId.value)
  if (!element) {
    cancelTextEdit()
    return
  }

  if (editingType.value === 'text' && element.type === 'text') {
    // Calculate new height based on textarea content
    const newHeight = calculateTextHeight()
    boardStore.updateElement(editingElementId.value, {
      content: editValue.value,
      rect: { ...element.rect, height: newHeight },
    })
  } else if (editingType.value === 'label' && (element.type === 'rectangle' || element.type === 'ellipse')) {
    boardStore.updateElement(editingElementId.value, { label: editValue.value || undefined })
  }

  cancelTextEdit()
}

/**
 * Calculate the required height for the text content.
 * Uses the textarea's scrollHeight to measure actual content height.
 */
const calculateTextHeight = (): number => {
  const textarea = textEditorRef.value
  if (!textarea || !editingElement.value) return 30

  const zoom = viewport.value.zoom
  // Get the unscaled height from scrollHeight
  const scrollHeight = textarea.scrollHeight / zoom
  // Minimum height of 30px, with some padding
  return Math.max(30, scrollHeight)
}

/**
 * Auto-resize textarea height as user types.
 * Also updates the element's rect.height in real-time.
 */
const handleTextInput = () => {
  autoResizeTextarea()

  // Update element height in real-time during editing
  if (editingElementId.value && editingType.value === 'text') {
    const element = elements.value.find((e) => e.id === editingElementId.value)
    if (element?.type === 'text') {
      const newHeight = calculateTextHeight()
      if (Math.abs(element.rect.height - newHeight) > 1) {
        boardStore.updateElement(editingElementId.value, {
          rect: { ...element.rect, height: newHeight },
        })
      }
    }
  }
}

/**
 * Auto-resize the textarea to fit content.
 */
const autoResizeTextarea = () => {
  const textarea = textEditorRef.value
  if (!textarea) return

  // Reset height to auto to get accurate scrollHeight
  textarea.style.height = 'auto'
  // Set height to scrollHeight
  textarea.style.height = `${textarea.scrollHeight}px`
}

const cancelTextEdit = () => {
  isEditingText.value = false
  editingElementId.value = null
  editValue.value = ''
}

const handleTextEditorKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    saveTextEdit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelTextEdit()
  }
}

const handleTextEditorBlur = () => {
  // Small delay to allow click events on other elements
  setTimeout(() => {
    if (isEditingText.value) {
      saveTextEdit()
    }
  }, 100)
}

// Widget event handlers
const handleWidgetSelect = (id: string, event?: MouseEvent) => {
  const addToSelection = event?.shiftKey || event?.metaKey || event?.ctrlKey

  // If clicking on an already-selected widget without modifier keys,
  // don't change the selection (preserve multi-selection for dragging)
  if (!addToSelection && boardStore.isSelected('widget', id)) {
    return
  }

  boardStore.selectWidget(id, addToSelection)
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

const handleWidgetDragStart = () => {
  closeContextMenu()
}

// Handle widget move start for multi-selection group drag
const handleWidgetMoveStart = (id: string, event: MouseEvent) => {
  if (!isMultiSelection.value) return

  // Start group drag with CSS transform
  isDraggingWithTransform.value = true
  draggingWidgetIds.value = [...selectedWidgetIds.value]
  draggingElementIds.value = [...selectedElementIds.value]
  moveStart.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = { x: 0, y: 0 }
}

// Handle widget menu button click (opens context menu)
const handleWidgetOpenMenu = (id: string, event: MouseEvent) => {
  // Select the widget if not already selected
  if (!boardStore.isSelected('widget', id)) {
    boardStore.selectWidget(id)
  }

  contextMenu.value = {
    open: true,
    x: event.clientX,
    y: event.clientY,
    type: 'widget',
    canvasPosition: { x: 0, y: 0 },
  }
}

const getModuleDisplayName = (moduleId: string) => {
  const module = moduleRegistry.get(moduleId)
  return module?.displayName ?? moduleId
}

// Prevent default browser behavior for space key
const preventSpaceScroll = (e: KeyboardEvent) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault()
  }
}

// Background panel
const handleBackgroundClick = () => {
  // TODO: Open background settings panel
  // For now, cycle through patterns
  const patterns = ['dots', 'grid', 'none'] as const
  const currentIndex = patterns.indexOf(background.value.pattern)
  const nextPattern = patterns[(currentIndex + 1) % patterns.length]
  boardStore.setBackground({ pattern: nextPattern })
}

onMounted(() => {
  document.addEventListener('mousemove', handleCanvasMouseMove)
  document.addEventListener('mouseup', handleCanvasMouseUp)
  document.addEventListener('keydown', preventSpaceScroll)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleCanvasMouseMove)
  document.removeEventListener('mouseup', handleCanvasMouseUp)
  document.removeEventListener('keydown', preventSpaceScroll)
})
</script>

<template>
  <div
    ref="canvasRef"
    class="board-canvas flex-1 overflow-hidden relative select-none canvas-background"
    :class="canvasCursor"
    :style="backgroundStyle"
    @click="handleCanvasClick"
    @wheel="handleWheel"
    @mousedown="handleCanvasMouseDown"
    @contextmenu="handleCanvasContextMenu"
  >
    <!-- Canvas content with transform -->
    <div class="canvas-transform absolute inset-0" :style="transformStyle">
      <!-- Elements SVG layer (below widgets by default, z-index controls final order) -->
      <CanvasElementsLayer
        :zoom="viewport.zoom"
        :drag-offset="dragOffset"
        :dragging-element-ids="draggingElementIds"
        @element-select="(id, event) => handleElementSelect(id, event)"
        @element-move-start="handleElementMoveStart"
        @element-resize-start="handleElementResizeStart"
        @element-edit-start="handleElementEditStart"
      />

      <!-- Widgets layer -->
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
        :selected="selectedWidgetIds.includes(widget.id)"
        :is-multi-selected="isMultiSelection && selectedWidgetIds.includes(widget.id)"
        :is-dragging="draggingWidgetIds.includes(widget.id)"
        :drag-offset="draggingWidgetIds.includes(widget.id) ? dragOffset : { x: 0, y: 0 }"
        :rest-mode="getWidgetVisibility(widget).restMode"
        :hover-mode="getWidgetVisibility(widget).hoverMode"
        @select="(id, event) => handleWidgetSelect(id, event)"
        @move="handleWidgetMove"
        @resize="handleWidgetResize"
        @delete="handleWidgetDelete"
        @dragstart="handleWidgetDragStart"
        @move-start="handleWidgetMoveStart"
        @open-menu="handleWidgetOpenMenu"
        @contextmenu.native="(e: MouseEvent) => handleWidgetContextMenu(widget.id, e)"
      >
        <WidgetRenderer :widget-id="widget.id" :module-id="widget.moduleId" />
      </WidgetFrame>
    </div>

    <!-- Tool Toolbar -->
    <ToolToolbar @background-click="handleBackgroundClick" />

    <!-- Text Editor Overlay -->
    <textarea
      v-if="isEditingText"
      ref="textEditorRef"
      v-model="editValue"
      class="text-editor-overlay"
      :style="textEditorStyle"
      @input="handleTextInput"
      @keydown="handleTextEditorKeydown"
      @blur="handleTextEditorBlur"
    />

    <!-- Marquee Selection Box -->
    <div
      v-if="isMarqueeSelecting && marqueeRect"
      class="marquee-box"
      :style="marqueeStyle"
    />

    <!-- Zoom indicator -->
    <div
      class="absolute bottom-4 right-4 px-2 py-1 rounded bg-background/80 border text-xs text-muted-foreground pointer-events-none"
    >
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

    <!-- Data Source Picker Modal -->
    <BkDataSourcePicker
      :open="dataSharingUI.pickerOpen.value"
      :providers="dataSharingUI.availableProviders.value"
      :current-connections="dataSharingUI.currentConnections.value"
      :multi-select="dataSharingUI.pickerConfig.value?.multiSelect ?? false"
      title="Connect Data Source"
      description="Select a data source to connect:"
      empty-text="No data sources available"
      empty-hint="Add a Todo widget first, then you can connect to it"
      @close="dataSharingUI.closePicker"
      @update:connections="dataSharingUI.handleConnectionsUpdate"
    />
  </div>
</template>

<style scoped>
.board-canvas {
  background-color: hsl(var(--background));
}

.canvas-background {
  /* Background pattern applied via inline style */
}

.cursor-crosshair {
  cursor: crosshair;
}

.text-editor-overlay {
  background: transparent;
  border: 2px solid hsl(var(--primary));
  border-radius: 4px;
  outline: none;
  resize: none;
  overflow: hidden;
  z-index: 1000;
  font-family: inherit;
  box-sizing: border-box;
}
</style>
