<script setup lang="ts">
import { ref, computed, watch, onMounted, inject, type Ref } from 'vue'
import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'
import {
  calculateOrthogonalPath,
  calculatePreviewPath,
  pathToSvgD,
  getEndAngle,
  type Bounds,
} from '@boardkit/core'

/**
 * OrthogonalArrow
 *
 * Renders an orthogonal (90-degree angles) connection arrow between two elements.
 * Uses RoughJS for a hand-drawn look consistent with other canvas elements.
 */

interface Props {
  /** Bounds of the source element */
  source: Bounds
  /** Bounds of the target element (for existing connections) */
  target?: Bounds
  /** Target point (for preview during connection mode) */
  targetPoint?: { x: number; y: number }
  /** Whether this is a preview arrow (dashed, lighter) */
  isPreview?: boolean
  /** Whether this connection is selected */
  selected?: boolean
  /** Stroke color (CSS color) */
  strokeColor?: string
  /** Stroke width in pixels */
  strokeWidth?: number
  /** Current viewport zoom (for consistent visual sizing) */
  zoom?: number
  /** Connection ID (for click handling) */
  connectionId?: string
  /** Roughness level (0 = smooth, 1+ = rough) */
  roughness?: number
}

const props = withDefaults(defineProps<Props>(), {
  isPreview: false,
  selected: false,
  strokeColor: 'hsl(var(--muted-foreground))',
  strokeWidth: 2,
  zoom: 1,
  roughness: 1,
})

const emit = defineEmits<{
  (e: 'click', connectionId: string): void
  (e: 'contextmenu', connectionId: string, event: MouseEvent): void
}>()

// Inject the parent SVG element for RoughJS rendering
const parentSvg = inject<Ref<SVGSVGElement | null>>('canvasSvg', ref(null))

// Ref for the RoughJS rendered content
const roughGroupRef = ref<SVGGElement | null>(null)

// Generate a stable seed for consistent rough rendering
const seed = computed(() => {
  if (props.connectionId) {
    // Use connection ID to generate a stable seed
    let hash = 0
    for (let i = 0; i < props.connectionId.length; i++) {
      hash = ((hash << 5) - hash) + props.connectionId.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }
  return Math.floor(Math.random() * 100000)
})

function handleContextMenu(event: MouseEvent) {
  if (props.connectionId) {
    event.preventDefault()
    event.stopPropagation()
    emit('contextmenu', props.connectionId, event)
  }
}

// Calculate the orthogonal path
const pathPoints = computed(() => {
  if (props.target) {
    return calculateOrthogonalPath(props.source, props.target)
  } else if (props.targetPoint) {
    return calculatePreviewPath(props.source, props.targetPoint)
  }
  return []
})

// Convert path to SVG d attribute (for hit area)
const pathD = computed(() => pathToSvgD(pathPoints.value))

// Calculate arrowhead rotation
const arrowRotation = computed(() => getEndAngle(pathPoints.value))

// Get the end point for arrowhead placement
const endPoint = computed(() => {
  if (pathPoints.value.length < 1) return { x: 0, y: 0 }
  return pathPoints.value[pathPoints.value.length - 1]
})

// Scaled stroke width for consistent visual appearance
const scaledStrokeWidth = computed(() => props.strokeWidth / props.zoom)
// Arrow size: hybrid approach - has a base size but grows when zoomed out to stay visible
// At zoom 1.0: size = 18, at zoom 0.5: size = 20, at zoom 0.25: size = 40
const arrowSize = computed(() => Math.max(18, 10 / props.zoom))

// Style based on state
const strokeStyle = computed(() => {
  if (props.selected) {
    return 'hsl(var(--primary))'
  }
  return props.strokeColor
})

// Convert path points to tuples for RoughJS
const pathTuples = computed<[number, number][]>(() => {
  return pathPoints.value.map(p => [p.x, p.y])
})

// Build RoughJS options
const roughOptions = computed<Options>(() => {
  return {
    stroke: strokeStyle.value,
    strokeWidth: scaledStrokeWidth.value,
    roughness: props.isPreview ? 0.5 : props.roughness,
    bowing: 1,
    seed: seed.value,
    strokeLineDash: props.isPreview ? [6 / props.zoom, 4 / props.zoom] : undefined,
  }
})

// Render arrow using RoughJS
function renderArrow() {
  if (!roughGroupRef.value || !parentSvg?.value || pathTuples.value.length < 2) return

  // Clear previous content
  roughGroupRef.value.innerHTML = ''

  const rc = rough.svg(parentSvg.value)

  // Draw the orthogonal path
  const pathShape = rc.linearPath(pathTuples.value, roughOptions.value)
  roughGroupRef.value.appendChild(pathShape)

  // Draw arrowhead with hand-drawn style
  const angle = arrowRotation.value * (Math.PI / 180)
  const end = endPoint.value
  const size = arrowSize.value

  // Calculate arrowhead points - slightly wider angle for more expressive look
  const tip = end
  const spreadAngle = Math.PI / 5 // ~36 degrees spread
  const baseAngle1 = angle + Math.PI + spreadAngle
  const baseAngle2 = angle + Math.PI - spreadAngle

  const point1: [number, number] = [
    tip.x + Math.cos(baseAngle1) * size,
    tip.y + Math.sin(baseAngle1) * size,
  ]
  const point2: [number, number] = [
    tip.x + Math.cos(baseAngle2) * size,
    tip.y + Math.sin(baseAngle2) * size,
  ]

  // Draw arrowhead as individual hand-drawn lines for more sketchy look
  const arrowheadRoughness = props.isPreview ? 0.5 : props.roughness * 1.5
  const arrowheadOpts = {
    stroke: strokeStyle.value,
    strokeWidth: scaledStrokeWidth.value,
    roughness: arrowheadRoughness,
    bowing: 2,
    seed: seed.value,
  }

  // Draw two lines from tip to base points
  const line1 = rc.line(tip.x, tip.y, point1[0], point1[1], arrowheadOpts)
  const line2 = rc.line(tip.x, tip.y, point2[0], point2[1], arrowheadOpts)
  roughGroupRef.value.appendChild(line1)
  roughGroupRef.value.appendChild(line2)
}

// Re-render when relevant props change
watch(
  [
    pathTuples,
    roughOptions,
    () => props.selected,
    () => props.isPreview,
  ],
  () => renderArrow(),
  { deep: true }
)

// Initial render
onMounted(() => {
  renderArrow()
})

function handleClick() {
  if (props.connectionId) {
    emit('click', props.connectionId)
  }
}
</script>

<template>
  <g
    class="orthogonal-arrow"
    :class="{ preview: isPreview, selected }"
    @click.stop="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Invisible wider path for easier clicking -->
    <path
      v-if="!isPreview && connectionId"
      :d="pathD"
      fill="none"
      stroke="transparent"
      :stroke-width="scaledStrokeWidth * 5"
      class="hit-area"
    />

    <!-- RoughJS rendered content -->
    <g ref="roughGroupRef" class="rough-arrow" pointer-events="none" />

    <!-- Selection indicators -->
    <g v-if="selected && !isPreview" class="selection-indicators">
      <circle
        v-for="(point, index) in pathPoints"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        :r="4 / zoom"
        fill="hsl(var(--primary))"
        class="path-point"
      />
    </g>
  </g>
</template>

<style scoped>
.orthogonal-arrow {
  pointer-events: none;
}

.orthogonal-arrow .hit-area {
  pointer-events: stroke;
  cursor: pointer;
}

.orthogonal-arrow.preview {
  opacity: 0.7;
}

.selection-indicators .path-point {
  filter: drop-shadow(0 0 2px hsl(var(--primary) / 0.5));
}
</style>
