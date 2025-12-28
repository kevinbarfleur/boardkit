import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type {
  ToolType,
  CanvasElement,
  ElementStyle,
  Point,
  ShapeElement,
  LineElement,
  DrawElement,
  TextElement,
  Rect,
} from '../types'
import { DEFAULT_ELEMENT_STYLE, DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, isDrawingTool } from '../types'

/**
 * Tool Store
 *
 * Manages the current tool state for canvas interactions.
 */
export const useToolStore = defineStore('tool', () => {
  // ============================================================================
  // State
  // ============================================================================

  /** Currently active tool */
  const activeTool = ref<ToolType>('select')

  /** Whether a drawing operation is in progress */
  const isDrawing = ref(false)

  /** Start point of current drawing operation (in board coordinates) */
  const drawStart = ref<Point | null>(null)

  /** Preview element during drawing (not yet committed to document) */
  const previewElement = ref<CanvasElement | null>(null)

  /** Default style for new elements (user-configurable) */
  const defaultStyle = ref<ElementStyle>({ ...DEFAULT_ELEMENT_STYLE })

  /** Points collected during freehand drawing */
  const drawPoints = ref<Point[]>([])

  // ============================================================================
  // Computed
  // ============================================================================

  /** Whether the active tool is a drawing tool (creates elements) */
  const isActiveToolDrawing = computed(() => isDrawingTool(activeTool.value))

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set the active tool.
   * Cancels any in-progress drawing operation.
   */
  function setTool(tool: ToolType) {
    cancelDrawing()
    activeTool.value = tool
  }

  /**
   * Start a drawing operation.
   */
  function startDrawing(point: Point) {
    if (!isActiveToolDrawing.value) return

    isDrawing.value = true
    drawStart.value = point
    drawPoints.value = [point]

    // Create preview element based on active tool
    previewElement.value = createPreviewElement(
      activeTool.value as Exclude<ToolType, 'select' | 'hand'>,
      point,
      defaultStyle.value
    )
  }

  /**
   * Update the drawing operation with a new point.
   */
  function updateDrawing(point: Point, shiftKey = false) {
    if (!isDrawing.value || !previewElement.value || !drawStart.value) return

    if (activeTool.value === 'pencil') {
      // Freehand: collect points
      drawPoints.value.push(point)
      updateDrawElementPoints(previewElement.value as DrawElement, drawPoints.value)
    } else {
      // Other tools: update bounding rect
      updatePreviewBounds(previewElement.value, drawStart.value, point, shiftKey)
    }
  }

  /**
   * Finish the drawing operation and return the final element.
   * Returns null if the element is too small or invalid.
   */
  function finishDrawing(): CanvasElement | null {
    if (!previewElement.value) return null

    const element = { ...previewElement.value }

    // Validate element size
    if (activeTool.value === 'pencil') {
      // Pencil: need at least 2 points
      if (drawPoints.value.length < 2) {
        cancelDrawing()
        return null
      }
    } else if (activeTool.value === 'text') {
      // Text: always valid (will show editor)
    } else {
      // Shapes/lines: need minimum size
      const minSize = 5
      if (element.rect.width < minSize && element.rect.height < minSize) {
        cancelDrawing()
        return null
      }
    }

    cancelDrawing()
    return element
  }

  /**
   * Cancel the current drawing operation.
   */
  function cancelDrawing() {
    isDrawing.value = false
    drawStart.value = null
    previewElement.value = null
    drawPoints.value = []
  }

  /**
   * Update the default style.
   */
  function setDefaultStyle(style: Partial<ElementStyle>) {
    Object.assign(defaultStyle.value, style)
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  function createPreviewElement(
    tool: Exclude<ToolType, 'select' | 'hand'>,
    point: Point,
    style: ElementStyle
  ): CanvasElement {
    const baseElement = {
      id: nanoid(),
      zIndex: 0, // Will be set properly when added to document
      style: { ...style },
      rect: { x: point.x, y: point.y, width: 0, height: 0 },
    }

    switch (tool) {
      case 'rectangle':
        return {
          ...baseElement,
          type: 'rectangle',
        } as ShapeElement

      case 'ellipse':
        return {
          ...baseElement,
          type: 'ellipse',
        } as ShapeElement

      case 'line':
        return {
          ...baseElement,
          type: 'line',
          points: { start: { ...point }, end: { ...point } },
        } as LineElement

      case 'arrow':
        return {
          ...baseElement,
          type: 'arrow',
          points: { start: { ...point }, end: { ...point } },
          arrowHead: 'end',
        } as LineElement

      case 'pencil':
        return {
          ...baseElement,
          type: 'draw',
          points: [{ ...point }],
        } as DrawElement

      case 'text':
        return {
          ...baseElement,
          type: 'text',
          content: '',
          fontFamily: DEFAULT_FONT_FAMILY,
          fontSize: DEFAULT_FONT_SIZE,
          fontWeight: 'normal',
          textAlign: 'left',
          rect: { x: point.x, y: point.y, width: 200, height: 30 },
        } as TextElement
    }
  }

  function updatePreviewBounds(
    element: CanvasElement,
    start: Point,
    end: Point,
    shiftKey = false
  ) {
    if (element.type === 'line' || element.type === 'arrow') {
      // Line elements: update points
      const lineElement = element as LineElement
      let endPoint = { ...end }

      // Constrain to 45-degree angles if shift is held
      if (shiftKey) {
        endPoint = constrainLineAngle(start, end)
      }

      lineElement.points.start = { ...start }
      lineElement.points.end = endPoint

      // Update bounding rect
      const minX = Math.min(start.x, endPoint.x)
      const minY = Math.min(start.y, endPoint.y)
      const maxX = Math.max(start.x, endPoint.x)
      const maxY = Math.max(start.y, endPoint.y)

      element.rect = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    } else {
      // Shape elements: update rect
      let width = end.x - start.x
      let height = end.y - start.y

      // Constrain to square/circle if shift is held
      if (shiftKey && (element.type === 'rectangle' || element.type === 'ellipse')) {
        const size = Math.max(Math.abs(width), Math.abs(height))
        width = width >= 0 ? size : -size
        height = height >= 0 ? size : -size
      }

      // Normalize rect (handle negative dimensions)
      element.rect = normalizeRect({
        x: start.x,
        y: start.y,
        width,
        height,
      })
    }
  }

  function updateDrawElementPoints(element: DrawElement, points: Point[]) {
    element.points = points.map((p) => ({ ...p }))

    // Update bounding rect
    if (points.length === 0) return

    let minX = points[0].x
    let minY = points[0].y
    let maxX = points[0].x
    let maxY = points[0].y

    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    element.rect = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  function normalizeRect(rect: Rect): Rect {
    return {
      x: rect.width >= 0 ? rect.x : rect.x + rect.width,
      y: rect.height >= 0 ? rect.y : rect.y + rect.height,
      width: Math.abs(rect.width),
      height: Math.abs(rect.height),
    }
  }

  function constrainLineAngle(start: Point, end: Point): Point {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const angle = Math.atan2(dy, dx)

    // Snap to nearest 45-degree angle
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
    const length = Math.sqrt(dx * dx + dy * dy)

    return {
      x: start.x + Math.cos(snapAngle) * length,
      y: start.y + Math.sin(snapAngle) * length,
    }
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    activeTool,
    isDrawing,
    drawStart,
    previewElement,
    defaultStyle,
    drawPoints,

    // Computed
    isDrawingTool: isActiveToolDrawing,

    // Actions
    setTool,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    setDefaultStyle,
  }
})
