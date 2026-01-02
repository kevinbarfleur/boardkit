/**
 * Demo Canvas Composable
 *
 * Standalone canvas state and logic for the landing page demo.
 * No Pinia dependency - uses local Vue refs.
 */

import { ref, computed, readonly } from 'vue'

// ============================================================================
// Types (simplified from @boardkit/core)
// ============================================================================

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type ElementType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'draw' | 'text'

export interface ElementStyle {
  strokeColor: string
  strokeWidth: number
  fillColor: string | null
  opacity: number
  roughness: number
}

interface BaseElement {
  id: string
  type: ElementType
  rect: Rect
  zIndex: number
  style: ElementStyle
  angle: number
}

export interface ShapeElement extends BaseElement {
  type: 'rectangle' | 'ellipse'
}

export interface LineElement extends BaseElement {
  type: 'line' | 'arrow'
  points: { start: Point; end: Point }
}

export interface DrawElement extends BaseElement {
  type: 'draw'
  points: Point[]
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily?: string
}

export type CanvasElement = ShapeElement | LineElement | DrawElement | TextElement

export type ToolType = 'select' | 'hand' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'pencil' | 'text'

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

// ============================================================================
// Constants
// ============================================================================

/** Fixed style for demo (gray, hand-drawn) */
const FIXED_STYLE: ElementStyle = {
  strokeColor: '#4a4a4a',
  strokeWidth: 2,
  fillColor: null,
  opacity: 0.6,
  roughness: 1,
}

/** Keyboard shortcuts */
export const KEY_TO_TOOL: Record<string, ToolType> = {
  v: 'select',
  h: 'hand',
  r: 'rectangle',
  o: 'ellipse',
  l: 'line',
  a: 'arrow',
  p: 'pencil',
  t: 'text',
}

export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  select: 'V',
  hand: 'H',
  rectangle: 'R',
  ellipse: 'O',
  line: 'L',
  arrow: 'A',
  pencil: 'P',
  text: 'T',
}

/** Generate simple unique ID */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

// ============================================================================
// Singleton State (shared across all components)
// ============================================================================

// State - defined outside the composable for singleton behavior
const elements = ref<CanvasElement[]>([])
const activeTool = ref<ToolType>('rectangle')
const selectedIds = ref<Set<string>>(new Set())
const isDrawing = ref(false)
const drawStart = ref<Point | null>(null)
const drawingElement = ref<CanvasElement | null>(null)
const nextZIndex = ref(10)

// Viewport for panning (hand tool)
const viewport = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref<Point | null>(null)

// Drag state for moving elements
const isDragging = ref(false)
const dragStart = ref<Point | null>(null)
const dragElementsStart = ref<Map<string, Point>>(new Map())

// Resize state
const isResizing = ref(false)
const resizeHandle = ref<HandleType | null>(null)
const resizeStart = ref<Point | null>(null)
const resizeElementsStart = ref<Map<string, Rect>>(new Map())

// Rotation state
const isRotating = ref(false)
const rotateStart = ref<number | null>(null)
const rotateElementsStart = ref<Map<string, number>>(new Map())

// Marquee selection
const isMarqueeSelecting = ref(false)
const marqueeStart = ref<Point | null>(null)
const marqueeRect = ref<Rect | null>(null)

// ============================================================================
// Composable
// ============================================================================

export function useDemoCanvas() {

  // Computed
  const selectedElements = computed(() => {
    return elements.value.filter((el) => selectedIds.value.has(el.id))
  })

  const sortedElements = computed(() => {
    return [...elements.value].sort((a, b) => a.zIndex - b.zIndex)
  })

  // Get bounding box for all selected elements
  const selectionBounds = computed((): Rect | null => {
    const selected = selectedElements.value
    if (selected.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const el of selected) {
      minX = Math.min(minX, el.rect.x)
      minY = Math.min(minY, el.rect.y)
      maxX = Math.max(maxX, el.rect.x + el.rect.width)
      maxY = Math.max(maxY, el.rect.y + el.rect.height)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  })

  // ============================================================================
  // Tool Selection
  // ============================================================================

  function setTool(tool: ToolType) {
    activeTool.value = tool
    // Deselect when switching to drawing tool
    if (tool !== 'select') {
      selectedIds.value = new Set()
    }
  }

  // ============================================================================
  // Element Selection
  // ============================================================================

  function selectElement(id: string, addToSelection = false) {
    if (addToSelection) {
      // Toggle selection
      const newSet = new Set(selectedIds.value)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      selectedIds.value = newSet
    } else {
      selectedIds.value = new Set([id])
    }
  }

  function selectAll() {
    selectedIds.value = new Set(elements.value.map((el) => el.id))
  }

  function deselect() {
    selectedIds.value = new Set()
  }

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id)
  }

  // ============================================================================
  // Drawing Functions
  // ============================================================================

  function startDrawing(point: Point) {
    if (activeTool.value === 'select' || activeTool.value === 'hand') return

    isDrawing.value = true
    drawStart.value = point

    const id = generateId()
    const zIndex = nextZIndex.value++

    if (activeTool.value === 'pencil') {
      // Freehand drawing
      drawingElement.value = {
        id,
        type: 'draw',
        rect: { x: point.x, y: point.y, width: 0, height: 0 },
        points: [{ x: point.x, y: point.y }],
        zIndex,
        style: { ...FIXED_STYLE },
        angle: 0,
      } as DrawElement
    } else if (activeTool.value === 'rectangle' || activeTool.value === 'ellipse') {
      // Shape
      drawingElement.value = {
        id,
        type: activeTool.value,
        rect: { x: point.x, y: point.y, width: 0, height: 0 },
        zIndex,
        style: { ...FIXED_STYLE },
        angle: 0,
      } as ShapeElement
    } else if (activeTool.value === 'line' || activeTool.value === 'arrow') {
      // Line/Arrow
      drawingElement.value = {
        id,
        type: activeTool.value,
        rect: { x: point.x, y: point.y, width: 0, height: 0 },
        points: { start: { ...point }, end: { ...point } },
        zIndex,
        style: { ...FIXED_STYLE },
        angle: 0,
      } as LineElement
    } else if (activeTool.value === 'text') {
      // Text - create immediately at click point
      const textEl: TextElement = {
        id,
        type: 'text',
        rect: { x: point.x, y: point.y, width: 200, height: 30 },
        zIndex,
        style: { ...FIXED_STYLE },
        content: 'Text',
        fontSize: 20,
        fontFamily: "'Source Serif 4', serif",
        angle: 0,
      }
      elements.value.push(textEl)
      isDrawing.value = false
      drawStart.value = null
    }
  }

  function continueDrawing(point: Point) {
    if (!isDrawing.value || !drawingElement.value || !drawStart.value) return

    const el = drawingElement.value

    if (el.type === 'draw') {
      // Add point to freehand path
      const drawEl = el as DrawElement
      drawEl.points.push({ x: point.x, y: point.y })

      // Update bounding rect
      const xs = drawEl.points.map((p) => p.x)
      const ys = drawEl.points.map((p) => p.y)
      drawEl.rect = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      }
    } else if (el.type === 'rectangle' || el.type === 'ellipse') {
      // Update shape rect
      const x = Math.min(drawStart.value.x, point.x)
      const y = Math.min(drawStart.value.y, point.y)
      const width = Math.abs(point.x - drawStart.value.x)
      const height = Math.abs(point.y - drawStart.value.y)
      el.rect = { x, y, width, height }
    } else if (el.type === 'line' || el.type === 'arrow') {
      // Update line end point
      const lineEl = el as LineElement
      lineEl.points.end = { x: point.x, y: point.y }

      // Update bounding rect
      const minX = Math.min(lineEl.points.start.x, lineEl.points.end.x)
      const minY = Math.min(lineEl.points.start.y, lineEl.points.end.y)
      const maxX = Math.max(lineEl.points.start.x, lineEl.points.end.x)
      const maxY = Math.max(lineEl.points.start.y, lineEl.points.end.y)
      lineEl.rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }
  }

  function finishDrawing() {
    if (!isDrawing.value || !drawingElement.value) {
      isDrawing.value = false
      drawStart.value = null
      drawingElement.value = null
      return
    }

    const el = drawingElement.value

    // Only add if it has some size (not just a click)
    let hasSize = false

    if (el.type === 'draw') {
      hasSize = (el as DrawElement).points.length > 2
    } else if (el.type === 'rectangle' || el.type === 'ellipse') {
      hasSize = el.rect.width > 5 && el.rect.height > 5
    } else if (el.type === 'line' || el.type === 'arrow') {
      const lineEl = el as LineElement
      const dx = lineEl.points.end.x - lineEl.points.start.x
      const dy = lineEl.points.end.y - lineEl.points.start.y
      hasSize = Math.sqrt(dx * dx + dy * dy) > 10
    }

    if (hasSize) {
      elements.value.push(el)
    }

    isDrawing.value = false
    drawStart.value = null
    drawingElement.value = null
  }

  // ============================================================================
  // Panning (Hand Tool)
  // ============================================================================

  function startPan(screenPoint: Point) {
    isPanning.value = true
    panStart.value = { x: screenPoint.x - viewport.value.x, y: screenPoint.y - viewport.value.y }
  }

  function continuePan(screenPoint: Point) {
    if (!isPanning.value || !panStart.value) return
    viewport.value = {
      x: screenPoint.x - panStart.value.x,
      y: screenPoint.y - panStart.value.y,
    }
  }

  function endPan() {
    isPanning.value = false
    panStart.value = null
  }

  // ============================================================================
  // Marquee Selection
  // ============================================================================

  function startMarquee(point: Point) {
    isMarqueeSelecting.value = true
    marqueeStart.value = point
    marqueeRect.value = { x: point.x, y: point.y, width: 0, height: 0 }
  }

  function continueMarquee(point: Point) {
    if (!isMarqueeSelecting.value || !marqueeStart.value) return

    const x = Math.min(marqueeStart.value.x, point.x)
    const y = Math.min(marqueeStart.value.y, point.y)
    const width = Math.abs(point.x - marqueeStart.value.x)
    const height = Math.abs(point.y - marqueeStart.value.y)

    marqueeRect.value = { x, y, width, height }
  }

  function finishMarquee(addToSelection = false) {
    if (!isMarqueeSelecting.value || !marqueeRect.value) {
      isMarqueeSelecting.value = false
      marqueeStart.value = null
      marqueeRect.value = null
      return
    }

    const rect = marqueeRect.value

    // Find all elements that intersect with marquee
    const intersecting = elements.value.filter((el) => {
      return rectsIntersect(el.rect, rect)
    })

    if (addToSelection) {
      const newSet = new Set(selectedIds.value)
      intersecting.forEach((el) => newSet.add(el.id))
      selectedIds.value = newSet
    } else {
      selectedIds.value = new Set(intersecting.map((el) => el.id))
    }

    isMarqueeSelecting.value = false
    marqueeStart.value = null
    marqueeRect.value = null
  }

  function rectsIntersect(a: Rect, b: Rect): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    )
  }

  // ============================================================================
  // Element Dragging (Select Tool)
  // ============================================================================

  function startDrag(point: Point) {
    if (selectedIds.value.size === 0) return

    isDragging.value = true
    dragStart.value = point

    // Store initial positions for all selected elements
    dragElementsStart.value = new Map()
    for (const id of selectedIds.value) {
      const el = elements.value.find((e) => e.id === id)
      if (el) {
        dragElementsStart.value.set(id, { x: el.rect.x, y: el.rect.y })
      }
    }
  }

  function continueDrag(point: Point) {
    if (!isDragging.value || !dragStart.value) return

    const dx = point.x - dragStart.value.x
    const dy = point.y - dragStart.value.y

    for (const id of selectedIds.value) {
      const el = elements.value.find((e) => e.id === id)
      const startPos = dragElementsStart.value.get(id)

      if (el && startPos) {
        el.rect.x = startPos.x + dx
        el.rect.y = startPos.y + dy

        // Update points for line/arrow
        if (el.type === 'line' || el.type === 'arrow') {
          const lineEl = el as LineElement
          lineEl.points.start.x = lineEl.rect.x
          lineEl.points.start.y = lineEl.rect.y
          lineEl.points.end.x = lineEl.rect.x + lineEl.rect.width
          lineEl.points.end.y = lineEl.rect.y + lineEl.rect.height
        }
      }
    }
  }

  function endDrag() {
    isDragging.value = false
    dragStart.value = null
    dragElementsStart.value = new Map()
  }

  // ============================================================================
  // Resize
  // ============================================================================

  function startResize(point: Point, handle: HandleType) {
    if (selectedIds.value.size === 0) return

    isResizing.value = true
    resizeHandle.value = handle
    resizeStart.value = point

    // Store initial rects for all selected elements
    resizeElementsStart.value = new Map()
    for (const id of selectedIds.value) {
      const el = elements.value.find((e) => e.id === id)
      if (el) {
        resizeElementsStart.value.set(id, { ...el.rect })
      }
    }
  }

  function continueResize(point: Point) {
    if (!isResizing.value || !resizeStart.value || !resizeHandle.value) return

    const dx = point.x - resizeStart.value.x
    const dy = point.y - resizeStart.value.y
    const handle = resizeHandle.value

    for (const id of selectedIds.value) {
      const el = elements.value.find((e) => e.id === id)
      const startRect = resizeElementsStart.value.get(id)

      if (el && startRect) {
        let newX = startRect.x
        let newY = startRect.y
        let newWidth = startRect.width
        let newHeight = startRect.height

        // Apply resize based on handle
        if (handle.includes('w')) {
          newX = startRect.x + dx
          newWidth = startRect.width - dx
        }
        if (handle.includes('e')) {
          newWidth = startRect.width + dx
        }
        if (handle.includes('n')) {
          newY = startRect.y + dy
          newHeight = startRect.height - dy
        }
        if (handle.includes('s')) {
          newHeight = startRect.height + dy
        }

        // Ensure minimum size
        if (newWidth < 10) {
          if (handle.includes('w')) {
            newX = startRect.x + startRect.width - 10
          }
          newWidth = 10
        }
        if (newHeight < 10) {
          if (handle.includes('n')) {
            newY = startRect.y + startRect.height - 10
          }
          newHeight = 10
        }

        el.rect = { x: newX, y: newY, width: newWidth, height: newHeight }

        // Update points for line/arrow
        if (el.type === 'line' || el.type === 'arrow') {
          const lineEl = el as LineElement
          lineEl.points.start = { x: newX, y: newY }
          lineEl.points.end = { x: newX + newWidth, y: newY + newHeight }
        }
      }
    }
  }

  function endResize() {
    isResizing.value = false
    resizeHandle.value = null
    resizeStart.value = null
    resizeElementsStart.value = new Map()
  }

  // ============================================================================
  // Rotation
  // ============================================================================

  function startRotate(point: Point) {
    if (selectedIds.value.size === 0) return

    const bounds = selectionBounds.value
    if (!bounds) return

    isRotating.value = true

    // Calculate initial angle from center of selection to point
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    rotateStart.value = Math.atan2(point.y - centerY, point.x - centerX)

    // Store initial angles
    rotateElementsStart.value = new Map()
    for (const id of selectedIds.value) {
      const el = elements.value.find((e) => e.id === id)
      if (el) {
        rotateElementsStart.value.set(id, el.angle)
      }
    }
  }

  function continueRotate(point: Point) {
    if (!isRotating.value || rotateStart.value === null) return

    const bounds = selectionBounds.value
    if (!bounds) return

    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const currentAngle = Math.atan2(point.y - centerY, point.x - centerX)
    const deltaAngle = currentAngle - rotateStart.value

    for (const id of selectedIds.value) {
      const el = elements.value.find((e) => e.id === id)
      const startAngle = rotateElementsStart.value.get(id)

      if (el && startAngle !== undefined) {
        el.angle = startAngle + deltaAngle
      }
    }
  }

  function endRotate() {
    isRotating.value = false
    rotateStart.value = null
    rotateElementsStart.value = new Map()
  }

  // ============================================================================
  // Delete
  // ============================================================================

  function deleteSelected() {
    if (selectedIds.value.size === 0) return
    elements.value = elements.value.filter((el) => !selectedIds.value.has(el.id))
    selectedIds.value = new Set()
  }

  function clearCanvas() {
    elements.value = []
    selectedIds.value = new Set()
    nextZIndex.value = 1
  }

  // ============================================================================
  // Hit Testing
  // ============================================================================

  function hitTest(point: Point): CanvasElement | null {
    // Test from top to bottom (highest zIndex first)
    const sorted = [...elements.value].sort((a, b) => b.zIndex - a.zIndex)

    for (const el of sorted) {
      if (isPointInElement(point, el)) {
        return el
      }
    }
    return null
  }

  function hitTestHandle(point: Point): HandleType | null {
    const bounds = selectionBounds.value
    if (!bounds) return null

    const handleSize = 8
    const handles: { type: HandleType; x: number; y: number }[] = [
      { type: 'nw', x: bounds.x, y: bounds.y },
      { type: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
      { type: 'ne', x: bounds.x + bounds.width, y: bounds.y },
      { type: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { type: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { type: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { type: 'sw', x: bounds.x, y: bounds.y + bounds.height },
      { type: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 },
      { type: 'rotate', x: bounds.x + bounds.width / 2, y: bounds.y - 25 },
    ]

    for (const h of handles) {
      if (
        point.x >= h.x - handleSize &&
        point.x <= h.x + handleSize &&
        point.y >= h.y - handleSize &&
        point.y <= h.y + handleSize
      ) {
        return h.type
      }
    }

    return null
  }

  /** Check if point is inside the selection bounds (for dragging) */
  function isPointInSelectionBounds(point: Point): boolean {
    const bounds = selectionBounds.value
    if (!bounds) return false

    // Small padding for easier targeting
    const padding = 4
    return (
      point.x >= bounds.x - padding &&
      point.x <= bounds.x + bounds.width + padding &&
      point.y >= bounds.y - padding &&
      point.y <= bounds.y + bounds.height + padding
    )
  }

  /** Get cursor type for a given point */
  function getCursorAtPoint(point: Point): string {
    // First check if we're on a resize/rotate handle
    const handle = hitTestHandle(point)
    if (handle) {
      if (handle === 'rotate') return 'grab'
      if (handle === 'n' || handle === 's') return 'ns-resize'
      if (handle === 'e' || handle === 'w') return 'ew-resize'
      if (handle === 'nw' || handle === 'se') return 'nwse-resize'
      if (handle === 'ne' || handle === 'sw') return 'nesw-resize'
    }

    // Check if inside selection bounds
    if (isPointInSelectionBounds(point)) {
      return 'move'
    }

    // Check if hovering over any element
    const hit = hitTest(point)
    if (hit) {
      return 'pointer'
    }

    return 'default'
  }

  function isPointInElement(point: Point, el: CanvasElement): boolean {
    const padding = 8 // Hit area padding

    if (el.type === 'line' || el.type === 'arrow') {
      // Line hit test - check distance to line segment
      const lineEl = el as LineElement
      const dist = pointToLineDistance(point, lineEl.points.start, lineEl.points.end)
      return dist < padding + el.style.strokeWidth
    }

    if (el.type === 'draw') {
      // Freehand - check distance to any segment
      const drawEl = el as DrawElement
      for (let i = 1; i < drawEl.points.length; i++) {
        const dist = pointToLineDistance(point, drawEl.points[i - 1], drawEl.points[i])
        if (dist < padding + el.style.strokeWidth * 2) return true
      }
      return false
    }

    // Rectangle/Ellipse/Text - simple bounding box
    const { x, y, width, height } = el.rect
    return (
      point.x >= x - padding &&
      point.x <= x + width + padding &&
      point.y >= y - padding &&
      point.y <= y + height + padding
    )
  }

  function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx: number, yy: number

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State (readonly where appropriate)
    elements: readonly(elements),
    sortedElements,
    activeTool: readonly(activeTool),
    selectedIds: readonly(selectedIds),
    selectedElements,
    selectionBounds,
    isDrawing: readonly(isDrawing),
    drawingElement: readonly(drawingElement),
    viewport: readonly(viewport),
    isPanning: readonly(isPanning),
    isDragging: readonly(isDragging),
    isResizing: readonly(isResizing),
    isRotating: readonly(isRotating),
    isMarqueeSelecting: readonly(isMarqueeSelecting),
    marqueeRect: readonly(marqueeRect),
    resizeHandle: readonly(resizeHandle),

    // Tool
    setTool,

    // Selection
    selectElement,
    selectAll,
    deselect,
    isSelected,

    // Marquee
    startMarquee,
    continueMarquee,
    finishMarquee,

    // Drawing
    startDrawing,
    continueDrawing,
    finishDrawing,

    // Panning
    startPan,
    continuePan,
    endPan,

    // Dragging
    startDrag,
    continueDrag,
    endDrag,

    // Resize
    startResize,
    continueResize,
    endResize,

    // Rotation
    startRotate,
    continueRotate,
    endRotate,

    // Actions
    deleteSelected,
    clearCanvas,
    hitTest,
    hitTestHandle,
    isPointInSelectionBounds,
    getCursorAtPoint,
  }
}
