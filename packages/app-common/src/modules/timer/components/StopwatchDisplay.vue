<script setup lang="ts">
/**
 * StopwatchDisplay - Circular stopwatch display matching WaterTimer dimensions
 *
 * Provides visual parity with WaterTimer for consistent UI across timer modes.
 * Shows time in a simple circular container without water animation.
 */

interface Props {
  /** Time to display (e.g., "00:15:30") */
  time: string
  /** Size of the display in pixels */
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 180,
})
</script>

<template>
  <div
    class="stopwatch-display rounded-full border-2 border-foreground/10 bg-foreground/5 flex items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <span class="text-4xl font-bold font-mono tracking-tight text-foreground">
      {{ time }}
    </span>
  </div>
</template>
