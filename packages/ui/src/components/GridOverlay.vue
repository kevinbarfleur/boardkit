<script setup lang="ts">
/**
 * GridOverlay.vue
 *
 * Renders a visual grid overlay for snap-to-grid functionality.
 * Uses SVG patterns for efficient rendering regardless of canvas size.
 */

import { computed } from 'vue'

interface Props {
  /** Grid cell size in pixels */
  gridSize: number
  /** Current viewport zoom level */
  zoom: number
  /** Viewport X offset (pan) */
  viewportX: number
  /** Viewport Y offset (pan) */
  viewportY: number
  /** Grid line color (CSS color string) */
  color?: string
  /** Canvas width in pixels */
  canvasWidth: number
  /** Canvas height in pixels */
  canvasHeight: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'hsl(var(--border) / 0.4)',
})

// Compute the effective grid size based on zoom
const effectiveGridSize = computed(() => props.gridSize * props.zoom)

// Compute pattern offset to align with viewport pan
const patternOffsetX = computed(() => {
  return (props.viewportX * props.zoom) % effectiveGridSize.value
})

const patternOffsetY = computed(() => {
  return (props.viewportY * props.zoom) % effectiveGridSize.value
})

// Generate a unique pattern ID to avoid conflicts
const patternId = computed(() => `grid-pattern-${Math.random().toString(36).slice(2, 9)}`)
</script>

<template>
  <svg
    class="absolute inset-0 pointer-events-none"
    :width="canvasWidth"
    :height="canvasHeight"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Grid pattern using lines -->
      <pattern
        :id="patternId"
        :width="effectiveGridSize"
        :height="effectiveGridSize"
        patternUnits="userSpaceOnUse"
        :patternTransform="`translate(${patternOffsetX}, ${patternOffsetY})`"
      >
        <!-- Vertical line -->
        <line
          x1="0"
          y1="0"
          x2="0"
          :y2="effectiveGridSize"
          :stroke="color"
          stroke-width="1"
        />
        <!-- Horizontal line -->
        <line
          x1="0"
          y1="0"
          :x2="effectiveGridSize"
          y2="0"
          :stroke="color"
          stroke-width="1"
        />
      </pattern>
    </defs>

    <!-- Fill the entire canvas with the grid pattern -->
    <rect
      x="0"
      y="0"
      :width="canvasWidth"
      :height="canvasHeight"
      :fill="`url(#${patternId})`"
    />
  </svg>
</template>
