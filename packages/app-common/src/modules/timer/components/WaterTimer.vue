<script setup lang="ts">
/**
 * WaterTimer - Circular timer with realistic water fill effect
 *
 * Features:
 * - Water fills from bottom to top based on progress
 * - Multiple animated wave layers for realistic liquid effect
 * - Waves flow horizontally like real water
 * - Dual-color text (adapts to background)
 */

import { computed, ref, onMounted } from 'vue'

interface Props {
  /** Progress from 0 to 100 */
  progress: number
  /** Time to display (e.g., "25:00") */
  time: string
  /** Optional status label (e.g., "Session 1", "Break") */
  statusLabel?: string
  /** Whether in break mode (different color) */
  isBreak?: boolean
  /** Size of the timer in pixels */
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  statusLabel: '',
  isBreak: false,
  size: 180,
})

// SVG viewBox dimensions
const viewBoxSize = 200
const center = viewBoxSize / 2
const radius = 85

// Generate unique IDs for this instance
const instanceId = ref('')
onMounted(() => {
  instanceId.value = Math.random().toString(36).substr(2, 9)
})

// Clip IDs
const circleClipId = computed(() => `circle-clip-${instanceId.value}`)
const waterClipId = computed(() => `water-clip-${instanceId.value}`)

// Water level calculation
const waterLevel = computed(() => {
  const topY = center - radius
  const bottomY = center + radius
  const range = bottomY - topY
  return bottomY - (props.progress / 100) * range
})

// Generate a smooth wave path at Y=0 (we'll position it with transform)
// For seamless looping: width should contain exactly N complete wavelengths
function generateWavePath(
  width: number,
  amplitude: number,
  frequency: number,
  phaseOffset: number = 0,
  yOffset: number = 0
): string {
  const points: string[] = []
  const steps = 120 // More points for smoother curves

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    // Phase offset creates variation between waves
    const phase = (i / steps) * Math.PI * 2 * frequency + phaseOffset
    const waveY = yOffset + Math.sin(phase) * amplitude
    points.push(`${x},${waveY}`)
  }

  // Close the path to fill below the wave (extend well below visible area)
  return `M${points.join(' L')} L${width},${viewBoxSize * 2} L0,${viewBoxSize * 2} Z`
}

// Wave configuration for seamless looping:
// - All waves use frequency=2 (2 complete waves over width)
// - Width = 400px, so one wavelength = 200px
// - Animation translates exactly 200px for perfect loop
// - Phase offsets and amplitudes create visual variation
// - Waves are generated at y=0, then positioned via CSS transform
const waveWidth = viewBoxSize * 2 // 400px

// Static wave paths (shape doesn't change, only position)
const wave1Path = generateWavePath(waveWidth, 5, 2, 0, 0)
const wave2Path = generateWavePath(waveWidth, 4, 2, Math.PI * 0.5, 2)
const wave3Path = generateWavePath(waveWidth, 3, 2, Math.PI, 1)

// Simple clip path for water area (for text masking)
const waterClipPath = computed(() => {
  const y = waterLevel.value
  return `M0,${y} L${viewBoxSize},${y} L${viewBoxSize},${viewBoxSize} L0,${viewBoxSize} Z`
})

// Colors
const waterColors = computed(() => {
  if (props.isBreak) {
    return {
      primary: 'rgba(74, 222, 128, 0.95)',
      secondary: 'rgba(34, 197, 94, 0.7)',
      tertiary: 'rgba(22, 163, 74, 0.5)',
    }
  }
  return {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(240, 240, 240, 0.7)',
    tertiary: 'rgba(220, 220, 220, 0.5)',
  }
})
</script>

<template>
  <div
    class="water-timer"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg
      :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
      class="w-full h-full"
    >
      <defs>
        <!-- Circle clip path -->
        <clipPath :id="circleClipId">
          <circle :cx="center" :cy="center" :r="radius" />
        </clipPath>

        <!-- Water area clip (for text masking) -->
        <clipPath :id="waterClipId">
          <path :d="waterClipPath" />
        </clipPath>

        <!-- Inverse clip (above water) -->
        <clipPath :id="`${waterClipId}-inverse`">
          <rect x="0" y="0" :width="viewBoxSize" :height="waterLevel" />
        </clipPath>
      </defs>

      <!-- Background circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        class="fill-foreground/10"
      />

      <!-- Water container (clipped to circle) -->
      <g :clip-path="`url(#${circleClipId})`">
        <!-- Wave layers positioned via translateY for smooth transitions -->
        <!-- The waves are generated at y=0 and translated to waterLevel -->
        <g
          class="wave-level"
          :style="{ transform: `translateY(${waterLevel}px)` }"
        >
          <!-- Wave layer 3 (back, slowest) -->
          <g class="wave-container wave-3">
            <path
              :d="wave3Path"
              :fill="waterColors.tertiary"
            />
          </g>

          <!-- Wave layer 2 (middle) -->
          <g class="wave-container wave-2">
            <path
              :d="wave2Path"
              :fill="waterColors.secondary"
            />
          </g>

          <!-- Wave layer 1 (front, fastest) -->
          <g class="wave-container wave-1">
            <path
              :d="wave1Path"
              :fill="waterColors.primary"
            />
          </g>
        </g>
      </g>

      <!-- Circle border -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-border"
      />

      <!-- Time text - Dark version (visible on water) -->
      <text
        :x="center"
        :y="center"
        text-anchor="middle"
        dominant-baseline="central"
        class="time-text time-text-dark"
        :clip-path="`url(#${waterClipId})`"
      >
        {{ time }}
      </text>

      <!-- Time text - Light version (visible on dark background) -->
      <text
        :x="center"
        :y="center"
        text-anchor="middle"
        dominant-baseline="central"
        class="time-text time-text-light"
        :clip-path="`url(#${waterClipId}-inverse)`"
      >
        {{ time }}
      </text>

      <!-- Status label - Dark version -->
      <text
        v-if="statusLabel"
        :x="center"
        :y="center + 28"
        text-anchor="middle"
        dominant-baseline="central"
        class="status-text status-text-dark"
        :clip-path="`url(#${waterClipId})`"
      >
        {{ statusLabel }}
      </text>

      <!-- Status label - Light version -->
      <text
        v-if="statusLabel"
        :x="center"
        :y="center + 28"
        text-anchor="middle"
        dominant-baseline="central"
        class="status-text status-text-light"
        :clip-path="`url(#${waterClipId}-inverse)`"
      >
        {{ statusLabel }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.water-timer {
  position: relative;
}

.time-text {
  font-size: 36px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: -0.02em;
}

.time-text-dark {
  fill: rgb(23, 23, 23);
}

.time-text-light {
  fill: rgb(250, 250, 250);
}

.status-text {
  font-size: 12px;
  font-weight: 500;
}

.status-text-dark {
  fill: rgb(64, 64, 64);
}

.status-text-light {
  fill: rgb(200, 200, 200);
}

/* Smooth vertical water level transitions */
.wave-level {
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Wave animations - horizontal flow like real water */
/* Key: translate exactly one wavelength (200px) for seamless loop */
.wave-container {
  will-change: transform;
}

.wave-1 {
  animation: wave-flow 5s linear infinite;
}

.wave-2 {
  animation: wave-flow 7s linear infinite;
  animation-delay: -2s; /* Offset start time for desync */
}

.wave-3 {
  animation: wave-flow 9s linear infinite;
  animation-delay: -4s; /* Offset start time for desync */
}

/* Single animation keyframe - all waves translate exactly one wavelength (200px) */
/* This ensures perfect seamless looping since waves repeat every 200px */
@keyframes wave-flow {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-200px);
  }
}
</style>
