<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasElement, AnchorPosition, Point } from '@boardkit/core'

/**
 * AnchorPointsOverlay
 *
 * Displays anchor points on shapes when dragging arrow endpoints.
 * Shows visual feedback for potential binding targets.
 */

interface Props {
  /** The shape element to show anchors for */
  element: CanvasElement
  /** Currently highlighted anchor (if any) */
  activeAnchor?: AnchorPosition | null
  /** Current viewport zoom */
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  activeAnchor: null,
  zoom: 1,
})

// Only show anchors for shapes
const shouldShow = computed(() => {
  return props.element.type === 'rectangle' || props.element.type === 'ellipse'
})

// Calculate anchor positions
const anchors = computed(() => {
  const { x, y, width, height } = props.element.rect
  const centerX = x + width / 2
  const centerY = y + height / 2

  return [
    { position: 'top' as AnchorPosition, x: centerX, y },
    { position: 'bottom' as AnchorPosition, x: centerX, y: y + height },
    { position: 'left' as AnchorPosition, x, y: centerY },
    { position: 'right' as AnchorPosition, x: x + width, y: centerY },
  ]
})

// Anchor point size (scales inversely with zoom for consistent visual size)
const pointRadius = computed(() => 5 / props.zoom)
const activeRadius = computed(() => 7 / props.zoom)
const strokeWidth = computed(() => 2 / props.zoom)
</script>

<template>
  <g v-if="shouldShow" class="anchor-points-overlay">
    <g
      v-for="anchor in anchors"
      :key="anchor.position"
      class="anchor-point"
      :class="{ active: activeAnchor === anchor.position }"
    >
      <!-- Outer ring (always visible when overlay is shown) -->
      <circle
        :cx="anchor.x"
        :cy="anchor.y"
        :r="activeAnchor === anchor.position ? activeRadius : pointRadius"
        class="anchor-ring"
        :class="{ active: activeAnchor === anchor.position }"
        fill="none"
        :stroke="activeAnchor === anchor.position ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'"
        :stroke-width="strokeWidth"
      />
      <!-- Inner dot (visible on active) -->
      <circle
        v-if="activeAnchor === anchor.position"
        :cx="anchor.x"
        :cy="anchor.y"
        :r="pointRadius * 0.5"
        class="anchor-dot"
        fill="hsl(var(--primary))"
      />
    </g>
  </g>
</template>

<style scoped>
.anchor-points-overlay {
  pointer-events: none;
}

.anchor-ring {
  transition: r 0.1s ease, stroke 0.1s ease;
}

.anchor-ring.active {
  filter: drop-shadow(0 0 2px hsl(var(--primary) / 0.5));
}
</style>
