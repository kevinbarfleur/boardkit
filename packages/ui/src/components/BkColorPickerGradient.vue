<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { colord } from 'colord'

/**
 * BkColorPickerGradient
 *
 * 2D gradient area for selecting saturation (X) and value/brightness (Y).
 * The hue is provided as a prop and determines the base color.
 */

interface Props {
  /** Current hue (0-360) */
  hue: number
  /** Current saturation (0-100) */
  saturation: number
  /** Current value/brightness (0-100) */
  value: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:saturation': [value: number]
  'update:value': [value: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// Background color based on current hue
const baseColor = computed(() => {
  return colord({ h: props.hue, s: 100, v: 100 }).toHex()
})

// Cursor position
const cursorStyle = computed(() => ({
  left: `${props.saturation}%`,
  top: `${100 - props.value}%`,
}))

// Cursor color (for visibility)
const cursorBorderColor = computed(() => {
  return props.value > 50 ? '#000' : '#fff'
})

function updateFromPosition(clientX: number, clientY: number) {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))

  emit('update:saturation', Math.round(x * 100))
  emit('update:value', Math.round((1 - y) * 100))
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  updateFromPosition(e.clientX, e.clientY)
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  updateFromPosition(e.clientX, e.clientY)
}

function handleMouseUp() {
  isDragging.value = false
}

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true
  const touch = e.touches[0]
  updateFromPosition(touch.clientX, touch.clientY)
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const touch = e.touches[0]
  updateFromPosition(touch.clientX, touch.clientY)
}

function handleTouchEnd() {
  isDragging.value = false
}

// Keyboard navigation
function handleKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 10 : 1
  let newSat = props.saturation
  let newVal = props.value

  switch (e.key) {
    case 'ArrowLeft':
      newSat = Math.max(0, props.saturation - step)
      break
    case 'ArrowRight':
      newSat = Math.min(100, props.saturation + step)
      break
    case 'ArrowUp':
      newVal = Math.min(100, props.value + step)
      break
    case 'ArrowDown':
      newVal = Math.max(0, props.value - step)
      break
    default:
      return
  }

  e.preventDefault()
  emit('update:saturation', newSat)
  emit('update:value', newVal)
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div
    ref="containerRef"
    class="gradient-picker"
    :style="{ backgroundColor: baseColor }"
    tabindex="0"
    role="slider"
    aria-label="Color saturation and brightness"
    :aria-valuenow="saturation"
    @mousedown="handleMouseDown"
    @touchstart.prevent="handleTouchStart"
    @keydown="handleKeyDown"
  >
    <!-- White to transparent gradient (left to right) -->
    <div class="gradient-white" />
    <!-- Black to transparent gradient (bottom to top) -->
    <div class="gradient-black" />
    <!-- Cursor -->
    <div
      class="cursor"
      :style="{ ...cursorStyle, borderColor: cursorBorderColor }"
    />
  </div>
</template>

<style scoped>
.gradient-picker {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 6px;
  cursor: crosshair;
  user-select: none;
  touch-action: none;
}

.gradient-picker:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px hsl(var(--border-strong));
}

.gradient-white {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, transparent);
  border-radius: inherit;
}

.gradient-black {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000, transparent);
  border-radius: inherit;
}

.cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}
</style>
