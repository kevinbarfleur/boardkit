<script setup lang="ts">
import { ref, computed, watch, onMounted, inject, type Ref } from 'vue'
import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'
import { getStroke } from 'perfect-freehand'
import {
  FONT_FAMILY_CSS,
  type CanvasElement,
  type ShapeElement,
  type LineElement,
  type DrawElement,
  type TextElement,
} from '@boardkit/core'
import SelectionHandles from './SelectionHandles.vue'

/**
 * Convert perfect-freehand stroke points to SVG path data.
 * Uses quadratic bezier curves for smooth rendering.
 */
function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 4) return ''

  const average = (a: number, b: number) => (a + b) / 2

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`

  for (let i = 2, max = points.length - 1; i < max; i++) {
    a = points[i]
    b = points[i + 1]
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `
  }

  result += 'Z'
  return result
}

/**
 * ElementRenderer
 *
 * Renders a canvas element as SVG using RoughJS for a hand-drawn look.
 * Handles all element types: rectangle, ellipse, line, arrow, draw, text.
 */

interface Props {
  /** The element to render */
  element: CanvasElement
  /** Whether the element is selected */
  selected?: boolean
  /** Whether this is a preview element (during drawing) */
  isPreview?: boolean
  /** Current zoom level (for proper stroke scaling) */
  zoom?: number
  /** Whether the element is being dragged (for CSS transform optimization) */
  isDragging?: boolean
  /** Drag offset in canvas coordinates (applied via CSS transform during drag) */
  dragOffset?: { x: number; y: number }
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  isPreview: false,
  zoom: 1,
  isDragging: false,
  dragOffset: () => ({ x: 0, y: 0 }),
})

const emit = defineEmits<{
  select: [id: string, event: MouseEvent]
  moveStart: [id: string, event: MouseEvent]
  resizeStart: [id: string, handle: string, event: MouseEvent]
  editStart: [id: string, type: 'text' | 'label']
}>()

// Inject SVG ref from parent (CanvasElementsLayer)
const parentSvg = inject<Ref<SVGSVGElement | null>>('canvasSvg', ref(null))

// Ref for the RoughJS rendered group
const roughGroupRef = ref<SVGGElement | null>(null)

// Type guards
const isShape = computed(() => props.element.type === 'rectangle' || props.element.type === 'ellipse')
const isLine = computed(() => props.element.type === 'line' || props.element.type === 'arrow')
const isDraw = computed(() => props.element.type === 'draw')
const isText = computed(() => props.element.type === 'text')

// Typed element accessors
const shapeElement = computed(() => (isShape.value ? (props.element as ShapeElement) : null))
const lineElement = computed(() => (isLine.value ? (props.element as LineElement) : null))
const drawElement = computed(() => (isDraw.value ? (props.element as DrawElement) : null))
const textElement = computed(() => (isText.value ? (props.element as TextElement) : null))

// Line coordinates relative to element rect
const lineCoords = computed(() => {
  if (!lineElement.value) return null
  const { start, end } = lineElement.value.points
  const { x, y } = props.element.rect
  return {
    x1: start.x - x,
    y1: start.y - y,
    x2: end.x - x,
    y2: end.y - y,
  }
})

// Line coords key for change detection (avoids re-render on position-only move)
// Serialize to string for stable comparison
const lineCoordsKey = computed(() => {
  if (!lineCoords.value) return ''
  const { x1, y1, x2, y2 } = lineCoords.value
  return `${x1.toFixed(1)},${y1.toFixed(1)},${x2.toFixed(1)},${y2.toFixed(1)}`
})

// Draw points as tuples for RoughJS linearPath
const drawPoints = computed<[number, number][]>(() => {
  if (!drawElement.value || drawElement.value.points.length === 0) return []
  const offsetX = props.element.rect.x
  const offsetY = props.element.rect.y
  return drawElement.value.points.map(p => [p.x - offsetX, p.y - offsetY])
})

// Track draw points count for efficient re-render detection
// Only re-render when points are added, not when element is moved
const drawPointsCount = computed(() => drawElement.value?.points.length ?? 0)

// SVG path string for hit target (simple line path)
const drawPath = computed(() => {
  if (drawPoints.value.length === 0) return ''
  const points = drawPoints.value
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`
  }
  return d
})

// Freehand stroke path using perfect-freehand
const freehandPath = computed(() => {
  if (drawPoints.value.length < 2) return ''

  const style = props.element.style
  const strokePoints = getStroke(drawPoints.value, {
    size: style.strokeWidth * 4, // Scale up for better visibility
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
  })

  return getSvgPathFromStroke(strokePoints)
})

// Hit detection constants - expanded clickable area
const HIT_PADDING = 6
const HIT_STROKE_WIDTH = 16

// Computed transform that includes drag offset for smooth CSS-based dragging
// During drag, we apply the offset via CSS transform instead of updating element data
// This avoids expensive recalculations (like getStroke) during mousemove
const groupTransform = computed(() => {
  const baseX = props.element.rect.x
  const baseY = props.element.rect.y

  if (props.isDragging) {
    return `translate(${baseX + props.dragOffset.x}, ${baseY + props.dragOffset.y})`
  }

  return `translate(${baseX}, ${baseY})`
})

// Generate stable seed from element ID (for consistent sketchy look)
const seed = computed(() => {
  let hash = 0
  for (let i = 0; i < props.element.id.length; i++) {
    hash = ((hash << 5) - hash) + props.element.id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
})

// Build RoughJS options from element style
const roughOptions = computed<Options>(() => {
  const style = props.element.style
  const opts: Options = {
    stroke: style.strokeColor,
    strokeWidth: style.strokeWidth,
    roughness: style.roughness ?? 1,
    bowing: 1,
    seed: seed.value,
  }

  // Add fill if present
  if (style.fillColor) {
    opts.fill = style.fillColor
    opts.fillStyle = 'hachure'
  }

  // Handle stroke dash
  if (style.strokeDash === 'dashed') {
    opts.strokeLineDash = [style.strokeWidth * 4, style.strokeWidth * 2]
  } else if (style.strokeDash === 'dotted') {
    opts.strokeLineDash = [style.strokeWidth, style.strokeWidth * 2]
  }

  return opts
})

// Render shape using RoughJS
function renderShape() {
  if (!roughGroupRef.value || !parentSvg?.value) return

  // Clear previous content
  roughGroupRef.value.innerHTML = ''

  const rc = rough.svg(parentSvg.value)
  const el = props.element
  const opts = roughOptions.value

  let shape: SVGGElement | null = null

  switch (el.type) {
    case 'rectangle':
      shape = rc.rectangle(0, 0, el.rect.width, el.rect.height, opts)
      break

    case 'ellipse':
      shape = rc.ellipse(
        el.rect.width / 2,
        el.rect.height / 2,
        el.rect.width,
        el.rect.height,
        opts
      )
      break

    case 'line':
      if (lineCoords.value) {
        shape = rc.line(
          lineCoords.value.x1,
          lineCoords.value.y1,
          lineCoords.value.x2,
          lineCoords.value.y2,
          opts
        )
      }
      break

    case 'arrow':
      if (lineCoords.value) {
        // Create group for arrow (line + arrowhead)
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        // Main line
        const line = rc.line(
          lineCoords.value.x1,
          lineCoords.value.y1,
          lineCoords.value.x2,
          lineCoords.value.y2,
          opts
        )
        group.appendChild(line)

        // Arrow head
        const { x2, y2, x1, y1 } = lineCoords.value
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLength = 12

        const arrowX1 = x2 - headLength * Math.cos(angle - Math.PI / 6)
        const arrowY1 = y2 - headLength * Math.sin(angle - Math.PI / 6)
        const arrowX2 = x2 - headLength * Math.cos(angle + Math.PI / 6)
        const arrowY2 = y2 - headLength * Math.sin(angle + Math.PI / 6)

        group.appendChild(rc.line(x2, y2, arrowX1, arrowY1, opts))
        group.appendChild(rc.line(x2, y2, arrowX2, arrowY2, opts))

        shape = group as SVGGElement
      }
      break

    case 'draw':
      // Draw elements use perfect-freehand, rendered declaratively in template
      break
  }

  if (shape) {
    roughGroupRef.value.appendChild(shape)
  }
}

// Re-render when element changes (not on position-only changes)
// Use stable keys for lines and draws to avoid re-render during moves
watch(
  () => [
    props.element.rect.width,
    props.element.rect.height,
    props.element.style,
    lineCoordsKey.value, // Stable string key - no re-render on move
    drawPointsCount.value, // Use count, not full array - no re-render on move
    roughOptions.value,
  ],
  () => renderShape(),
  { deep: true }
)

onMounted(() => {
  renderShape()
})

function handleMouseDown(event: MouseEvent) {
  if (props.isPreview) return
  event.stopPropagation()
  emit('select', props.element.id, event)
  emit('moveStart', props.element.id, event)
}

function handleDoubleClick(event: MouseEvent) {
  if (props.isPreview) return
  event.stopPropagation()

  if (props.element.type === 'text') {
    emit('editStart', props.element.id, 'text')
  }
}

function handleShapeLabelDoubleClick(event: MouseEvent) {
  if (props.isPreview) return
  event.stopPropagation()
  emit('editStart', props.element.id, 'label')
}

function handleResizeStart(handle: string, event: MouseEvent) {
  emit('resizeStart', props.element.id, handle, event)
}
</script>

<template>
  <g
    class="element-renderer"
    :class="{ selected, preview: isPreview, dragging: isDragging }"
    :transform="groupTransform"
    :opacity="element.style.opacity"
    :data-element-id="element.id"
  >
    <!-- ============================================================ -->
    <!-- HIT TARGETS (invisible, expanded clickable areas)            -->
    <!-- These are rendered FIRST (below visible shapes in z-order)   -->
    <!-- ============================================================ -->

    <!-- Hit target: Rectangle -->
    <rect
      v-if="element.type === 'rectangle'"
      class="hit-target"
      :x="-HIT_PADDING"
      :y="-HIT_PADDING"
      :width="element.rect.width + HIT_PADDING * 2"
      :height="element.rect.height + HIT_PADDING * 2"
      :rx="(shapeElement?.cornerRadius ?? 0) + HIT_PADDING"
      fill="transparent"
      stroke="transparent"
      :stroke-width="HIT_STROKE_WIDTH"
      @mousedown="handleMouseDown"
    />

    <!-- Hit target: Ellipse -->
    <ellipse
      v-if="element.type === 'ellipse'"
      class="hit-target"
      :cx="element.rect.width / 2"
      :cy="element.rect.height / 2"
      :rx="element.rect.width / 2 + HIT_PADDING"
      :ry="element.rect.height / 2 + HIT_PADDING"
      fill="transparent"
      stroke="transparent"
      :stroke-width="HIT_STROKE_WIDTH"
      @mousedown="handleMouseDown"
    />

    <!-- Hit target: Line -->
    <line
      v-if="element.type === 'line' && lineCoords"
      class="hit-target"
      :x1="lineCoords.x1"
      :y1="lineCoords.y1"
      :x2="lineCoords.x2"
      :y2="lineCoords.y2"
      stroke="transparent"
      :stroke-width="HIT_STROKE_WIDTH"
      stroke-linecap="round"
      @mousedown="handleMouseDown"
    />

    <!-- Hit target: Arrow -->
    <line
      v-if="element.type === 'arrow' && lineCoords"
      class="hit-target"
      :x1="lineCoords.x1"
      :y1="lineCoords.y1"
      :x2="lineCoords.x2"
      :y2="lineCoords.y2"
      stroke="transparent"
      :stroke-width="HIT_STROKE_WIDTH"
      stroke-linecap="round"
      @mousedown="handleMouseDown"
    />

    <!-- Hit target: Freehand Draw -->
    <path
      v-if="element.type === 'draw'"
      class="hit-target"
      :d="drawPath"
      stroke="transparent"
      :stroke-width="HIT_STROKE_WIDTH"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
      @mousedown="handleMouseDown"
    />

    <!-- Hit target: Text (using rect for bounding box) -->
    <rect
      v-if="element.type === 'text'"
      class="hit-target"
      :x="-HIT_PADDING"
      :y="-HIT_PADDING"
      :width="element.rect.width + HIT_PADDING * 2"
      :height="element.rect.height + HIT_PADDING * 2"
      fill="transparent"
      @mousedown="handleMouseDown"
      @dblclick="handleDoubleClick"
    />

    <!-- ============================================================ -->
    <!-- ROUGHJS RENDERED SHAPES (pointer-events: none)               -->
    <!-- For rectangle, ellipse, line, arrow                          -->
    <!-- ============================================================ -->

    <g
      v-if="!isText && !isDraw"
      ref="roughGroupRef"
      class="rough-shape"
      pointer-events="none"
    />

    <!-- ============================================================ -->
    <!-- FREEHAND STROKE (perfect-freehand, pointer-events: none)     -->
    <!-- For draw elements only - smooth pressure-sensitive stroke    -->
    <!-- ============================================================ -->

    <path
      v-if="isDraw && freehandPath"
      class="freehand-stroke"
      :d="freehandPath"
      :fill="element.style.strokeColor"
      :opacity="element.style.opacity"
      pointer-events="none"
    />

    <!-- Text -->
    <foreignObject
      v-if="element.type === 'text'"
      :width="element.rect.width"
      :height="element.rect.height"
      class="element-text-container"
      pointer-events="none"
    >
      <div
        class="element-text"
        :style="{
          fontFamily: FONT_FAMILY_CSS[textElement?.fontFamily ?? 'system'],
          fontSize: `${textElement?.fontSize ?? 16}px`,
          fontWeight: textElement?.fontWeight ?? 'normal',
          textAlign: textElement?.textAlign ?? 'left',
          color: element.style.strokeColor,
        }"
      >
        {{ textElement?.content || 'Text' }}
      </div>
    </foreignObject>

    <!-- Shape Label (centered text in shapes) -->
    <foreignObject
      v-if="isShape"
      :width="element.rect.width"
      :height="element.rect.height"
      class="element-label-container"
      @dblclick="handleShapeLabelDoubleClick"
    >
      <div class="element-label" :style="{ color: element.style.strokeColor }">
        {{ shapeElement?.label || '' }}
      </div>
    </foreignObject>

    <!-- Selection handles -->
    <SelectionHandles
      v-if="selected && !isPreview"
      :width="element.rect.width"
      :height="element.rect.height"
      :corners-only="isLine || isDraw"
      @resize-start="handleResizeStart"
    />
  </g>
</template>

<style scoped>
.element-renderer {
  pointer-events: auto;
}

.element-renderer.preview {
  pointer-events: none;
  opacity: 0.7;
}

.element-renderer.dragging {
  will-change: transform;
}

.element-shape {
  cursor: move;
}

.hit-target {
  cursor: move;
  /* Debug: uncomment to see hit targets */
  /* fill: rgba(255, 0, 0, 0.1) !important; */
  /* stroke: rgba(255, 0, 0, 0.3) !important; */
}

.element-text-container,
.element-label-container {
  overflow: visible;
}

.element-text {
  width: 100%;
  min-height: 100%;
  display: block;
  padding: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  font-family: inherit;
}

.element-label {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14px;
  padding: 8px;
  pointer-events: none;
}
</style>
