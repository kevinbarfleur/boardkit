<script setup lang="ts">
/**
 * Demo Canvas Component
 *
 * Interactive SVG canvas for the landing page background.
 * Uses RoughJS for hand-drawn aesthetic.
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import rough from 'roughjs'
import { getStroke } from 'perfect-freehand'
import {
  useDemoCanvas,
  KEY_TO_TOOL,
  type CanvasElement,
  type DrawElement,
  type LineElement,
  type Point,
  type HandleType,
} from '~/composables/useDemoCanvas'

// Get canvas state from composable (singleton - shared with toolbar)
const canvas = useDemoCanvas()

// SVG refs
const svgRef = ref<SVGSVGElement | null>(null)
const renderedGroupsRef = ref<Map<string, SVGGElement>>(new Map())

// Track shift key state
const isShiftPressed = ref(false)

// Dynamic cursor based on hover position
const dynamicCursor = ref('default')

// ============================================================================
// RoughJS Rendering
// ============================================================================

function renderElement(element: CanvasElement): SVGGElement | null {
  if (!svgRef.value) return null

  const rc = rough.svg(svgRef.value)
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  // Apply rotation transform if needed
  if (element.angle !== 0) {
    const cx = element.rect.x + element.rect.width / 2
    const cy = element.rect.y + element.rect.height / 2
    const angleDeg = (element.angle * 180) / Math.PI
    g.setAttribute('transform', `rotate(${angleDeg} ${cx} ${cy})`)
  }

  const opts = {
    stroke: element.style.strokeColor,
    strokeWidth: element.style.strokeWidth,
    roughness: element.style.roughness,
    bowing: 1,
    seed: hashCode(element.id),
    fill: element.style.fillColor || undefined,
    fillStyle: element.style.fillColor ? 'hachure' : undefined,
  }

  if (element.type === 'rectangle') {
    const node = rc.rectangle(
      element.rect.x,
      element.rect.y,
      element.rect.width,
      element.rect.height,
      opts
    )
    g.appendChild(node)
  } else if (element.type === 'ellipse') {
    const cx = element.rect.x + element.rect.width / 2
    const cy = element.rect.y + element.rect.height / 2
    const node = rc.ellipse(cx, cy, element.rect.width, element.rect.height, opts)
    g.appendChild(node)
  } else if (element.type === 'line') {
    const lineEl = element as LineElement
    const node = rc.line(
      lineEl.points.start.x,
      lineEl.points.start.y,
      lineEl.points.end.x,
      lineEl.points.end.y,
      opts
    )
    g.appendChild(node)
  } else if (element.type === 'arrow') {
    const lineEl = element as LineElement
    // Draw line
    const lineNode = rc.line(
      lineEl.points.start.x,
      lineEl.points.start.y,
      lineEl.points.end.x,
      lineEl.points.end.y,
      opts
    )
    g.appendChild(lineNode)

    // Draw arrowhead
    const arrowHead = createArrowHead(lineEl.points.start, lineEl.points.end, element.style)
    g.appendChild(arrowHead)
  } else if (element.type === 'draw') {
    const drawEl = element as DrawElement
    if (drawEl.points.length < 2) return g

    // Use perfect-freehand for smooth strokes
    const strokePoints = getStroke(drawEl.points, {
      size: element.style.strokeWidth * 4,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
    })

    const pathData = getSvgPathFromStroke(strokePoints)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', pathData)
    path.setAttribute('fill', element.style.strokeColor)
    path.setAttribute('opacity', String(element.style.opacity))
    g.appendChild(path)
  } else if (element.type === 'text') {
    // Simple text rendering with Source Serif 4
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', String(element.rect.x))
    text.setAttribute('y', String(element.rect.y + element.fontSize))
    text.setAttribute('fill', element.style.strokeColor)
    text.setAttribute('font-size', String(element.fontSize))
    text.setAttribute('font-family', element.fontFamily || "'Source Serif 4', serif")
    text.setAttribute('font-style', 'italic')
    text.textContent = element.content
    g.appendChild(text)
  }

  return g
}

function createArrowHead(start: Point, end: Point, style: CanvasElement['style']): SVGPolygonElement {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const headLength = 15
  const headAngle = Math.PI / 6

  const x1 = end.x - headLength * Math.cos(angle - headAngle)
  const y1 = end.y - headLength * Math.sin(angle - headAngle)
  const x2 = end.x - headLength * Math.cos(angle + headAngle)
  const y2 = end.y - headLength * Math.sin(angle + headAngle)

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  polygon.setAttribute('points', `${end.x},${end.y} ${x1},${y1} ${x2},${y2}`)
  polygon.setAttribute('fill', style.strokeColor)
  return polygon
}

function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 2) return ''

  let d = `M ${points[0][0]} ${points[0][1]}`

  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    d += ` Q ${x0} ${y0} ${mx} ${my}`
  }

  const [lastX, lastY] = points[points.length - 1]
  d += ` L ${lastX} ${lastY} Z`

  return d
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ============================================================================
// Render All Elements
// ============================================================================

function renderAll() {
  if (!svgRef.value) return

  // Clear existing rendered groups
  renderedGroupsRef.value.forEach((g) => g.remove())
  renderedGroupsRef.value.clear()

  // Render each element
  for (const el of canvas.sortedElements.value) {
    const g = renderElement(el)
    if (g) {
      svgRef.value.appendChild(g)
      renderedGroupsRef.value.set(el.id, g)
    }
  }

  // Render drawing preview
  if (canvas.drawingElement.value) {
    const g = renderElement(canvas.drawingElement.value)
    if (g) {
      g.setAttribute('opacity', '0.7')
      svgRef.value.appendChild(g)
      renderedGroupsRef.value.set('__preview__', g)
    }
  }
}

// Watch for changes and re-render
watch(
  () => [
    canvas.elements.value,
    canvas.drawingElement.value,
    canvas.selectedIds.value,
    canvas.selectionBounds.value,
  ],
  () => {
    nextTick(() => renderAll())
  },
  { deep: true }
)

// ============================================================================
// Event Handlers
// ============================================================================

function getCanvasPoint(event: PointerEvent): Point {
  if (!svgRef.value) return { x: 0, y: 0 }
  const rect = svgRef.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left - canvas.viewport.value.x,
    y: event.clientY - rect.top - canvas.viewport.value.y,
  }
}

function handlePointerDown(event: PointerEvent) {
  // Ignore if clicking on interactive content
  const target = event.target as HTMLElement
  if (target.closest('.landing-content') || target.closest('.demo-toolbar')) {
    return
  }

  const point = getCanvasPoint(event)
  const tool = canvas.activeTool.value

  if (tool === 'select') {
    // Check if clicking on a resize/rotate handle
    const handle = canvas.hitTestHandle(point)
    if (handle) {
      if (handle === 'rotate') {
        canvas.startRotate(point)
      } else {
        canvas.startResize(point, handle)
      }
    } else if (canvas.isPointInSelectionBounds(point)) {
      // Clicking inside selection bounds - start dragging immediately
      canvas.startDrag(point)
    } else {
      // Check if clicking on an element
      const hit = canvas.hitTest(point)
      if (hit) {
        // Select this element (with shift for multi-select)
        canvas.selectElement(hit.id, isShiftPressed.value)
        canvas.startDrag(point)
      } else {
        // Start marquee selection
        if (!isShiftPressed.value) {
          canvas.deselect()
        }
        canvas.startMarquee(point)
      }
    }
  } else {
    // Drawing tool
    canvas.startDrawing(point)
  }

  // Capture pointer for drag
  ;(event.target as Element).setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  const point = getCanvasPoint(event)

  if (canvas.isDragging.value) {
    canvas.continueDrag(point)
    renderAll()
  } else if (canvas.isResizing.value) {
    canvas.continueResize(point)
    renderAll()
  } else if (canvas.isRotating.value) {
    canvas.continueRotate(point)
    renderAll()
  } else if (canvas.isMarqueeSelecting.value) {
    canvas.continueMarquee(point)
  } else if (canvas.isDrawing.value) {
    canvas.continueDrawing(point)
    renderAll()
  } else if (canvas.activeTool.value === 'select') {
    // Update cursor based on hover position (only when not doing anything)
    dynamicCursor.value = canvas.getCursorAtPoint(point)
  }
}

function handlePointerUp(event: PointerEvent) {
  if (canvas.isDragging.value) {
    canvas.endDrag()
  } else if (canvas.isResizing.value) {
    canvas.endResize()
  } else if (canvas.isRotating.value) {
    canvas.endRotate()
  } else if (canvas.isMarqueeSelecting.value) {
    canvas.finishMarquee(isShiftPressed.value)
  } else if (canvas.isDrawing.value) {
    canvas.finishDrawing()
    renderAll()
  }

  ;(event.target as Element).releasePointerCapture(event.pointerId)
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

function handleKeyDown(event: KeyboardEvent) {
  // Track shift key
  if (event.key === 'Shift') {
    isShiftPressed.value = true
  }

  // Ignore if typing in input
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return
  }

  const key = event.key.toLowerCase()

  // Tool shortcuts
  if (KEY_TO_TOOL[key]) {
    canvas.setTool(KEY_TO_TOOL[key])
    event.preventDefault()
    return
  }

  // Select all (Cmd/Ctrl + A)
  if (key === 'a' && (event.metaKey || event.ctrlKey)) {
    canvas.selectAll()
    event.preventDefault()
    return
  }

  // Delete
  if (event.key === 'Delete' || event.key === 'Backspace') {
    canvas.deleteSelected()
    renderAll()
    event.preventDefault()
    return
  }

  // Escape - deselect
  if (event.key === 'Escape') {
    canvas.deselect()
    renderAll()
    event.preventDefault()
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    isShiftPressed.value = false
  }
}

// ============================================================================
// Selection Handles
// ============================================================================

const selectionHandles = computed(() => {
  const bounds = canvas.selectionBounds.value
  if (!bounds) return []

  return [
    { type: 'nw' as HandleType, x: bounds.x, y: bounds.y, cursor: 'nwse-resize' },
    { type: 'n' as HandleType, x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'ns-resize' },
    { type: 'ne' as HandleType, x: bounds.x + bounds.width, y: bounds.y, cursor: 'nesw-resize' },
    { type: 'e' as HandleType, x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
    { type: 'se' as HandleType, x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'nwse-resize' },
    { type: 's' as HandleType, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 'ns-resize' },
    { type: 'sw' as HandleType, x: bounds.x, y: bounds.y + bounds.height, cursor: 'nesw-resize' },
    { type: 'w' as HandleType, x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
  ]
})

const rotateHandle = computed(() => {
  const bounds = canvas.selectionBounds.value
  if (!bounds) return null

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y - 25,
  }
})

// ============================================================================
// Lifecycle
// ============================================================================

// Cursor based on active tool and context
const cursorStyle = computed(() => {
  const tool = canvas.activeTool.value

  // For select tool, use dynamic cursor based on hover position
  if (tool === 'select') {
    // During operations, show appropriate cursor
    if (canvas.isDragging.value) return 'grabbing'
    if (canvas.isRotating.value) return 'grabbing'
    if (canvas.isResizing.value) {
      const handle = canvas.resizeHandle.value
      if (handle === 'n' || handle === 's') return 'ns-resize'
      if (handle === 'e' || handle === 'w') return 'ew-resize'
      if (handle === 'nw' || handle === 'se') return 'nwse-resize'
      if (handle === 'ne' || handle === 'sw') return 'nesw-resize'
    }
    // Use dynamic cursor from hover tracking
    return dynamicCursor.value
  }

  if (tool === 'text') return 'text'
  if (tool === 'pencil') return 'crosshair' // Simplified for now
  return 'crosshair' // rectangle, ellipse, line, arrow
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  nextTick(() => renderAll())
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <svg
    ref="svgRef"
    class="demo-canvas"
    :style="{ cursor: cursorStyle }"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
  >
    <!-- Elements are rendered imperatively via RoughJS -->

    <!-- Selection box around all selected elements -->
    <rect
      v-if="canvas.selectionBounds.value"
      :x="canvas.selectionBounds.value.x - 2"
      :y="canvas.selectionBounds.value.y - 2"
      :width="canvas.selectionBounds.value.width + 4"
      :height="canvas.selectionBounds.value.height + 4"
      fill="none"
      stroke="#3b82f6"
      stroke-width="1"
      stroke-dasharray="4 2"
      class="selection-box"
    />

    <!-- Resize handles -->
    <g v-if="canvas.selectionBounds.value" class="handles">
      <rect
        v-for="handle in selectionHandles"
        :key="handle.type"
        :x="handle.x - 4"
        :y="handle.y - 4"
        width="8"
        height="8"
        fill="white"
        stroke="#3b82f6"
        stroke-width="1"
        :style="{ cursor: handle.cursor }"
        class="resize-handle"
      />

      <!-- Rotation handle -->
      <g v-if="rotateHandle" class="rotate-handle-group">
        <!-- Line from top center to rotate handle -->
        <line
          :x1="canvas.selectionBounds.value.x + canvas.selectionBounds.value.width / 2"
          :y1="canvas.selectionBounds.value.y"
          :x2="rotateHandle.x"
          :y2="rotateHandle.y + 8"
          stroke="#3b82f6"
          stroke-width="1"
        />
        <!-- Rotate handle circle -->
        <circle
          :cx="rotateHandle.x"
          :cy="rotateHandle.y"
          r="5"
          fill="white"
          stroke="#3b82f6"
          stroke-width="1"
          style="cursor: grab"
          class="rotate-handle"
        />
      </g>
    </g>

    <!-- Marquee selection rectangle -->
    <rect
      v-if="canvas.isMarqueeSelecting.value && canvas.marqueeRect.value"
      :x="canvas.marqueeRect.value.x"
      :y="canvas.marqueeRect.value.y"
      :width="canvas.marqueeRect.value.width"
      :height="canvas.marqueeRect.value.height"
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      stroke-width="1"
      stroke-dasharray="4 2"
      class="marquee-rect"
    />
  </svg>
</template>

<style scoped>
.demo-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background: transparent;
  touch-action: none;
}

/* Selection UI */
.selection-box {
  pointer-events: none;
}

.handles {
  pointer-events: all;
}

.resize-handle {
  transition: fill 0.1s;
}

.resize-handle:hover {
  fill: #3b82f6;
}

.rotate-handle {
  transition: fill 0.1s;
}

.rotate-handle:hover {
  fill: #3b82f6;
}

.marquee-rect {
  pointer-events: none;
}
</style>
