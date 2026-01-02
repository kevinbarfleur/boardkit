<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * BkColorPickerHueSlider
 *
 * Horizontal slider for selecting hue (0-360).
 */

interface Props {
  /** Current hue (0-360) */
  modelValue: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// Cursor position
const cursorStyle = computed(() => ({
  left: `${(props.modelValue / 360) * 100}%`,
}))

function updateFromPosition(clientX: number) {
  if (!sliderRef.value) return

  const rect = sliderRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  emit('update:modelValue', Math.round(x * 360))
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  updateFromPosition(e.clientX)
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  updateFromPosition(e.clientX)
}

function handleMouseUp() {
  isDragging.value = false
}

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true
  const touch = e.touches[0]
  updateFromPosition(touch.clientX)
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const touch = e.touches[0]
  updateFromPosition(touch.clientX)
}

function handleTouchEnd() {
  isDragging.value = false
}

// Keyboard navigation
function handleKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 10 : 1
  let newHue = props.modelValue

  switch (e.key) {
    case 'ArrowLeft':
      newHue = (props.modelValue - step + 360) % 360
      break
    case 'ArrowRight':
      newHue = (props.modelValue + step) % 360
      break
    default:
      return
  }

  e.preventDefault()
  emit('update:modelValue', newHue)
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
    ref="sliderRef"
    class="hue-slider"
    tabindex="0"
    role="slider"
    aria-label="Hue"
    :aria-valuenow="modelValue"
    aria-valuemin="0"
    aria-valuemax="360"
    @mousedown="handleMouseDown"
    @touchstart.prevent="handleTouchStart"
    @keydown="handleKeyDown"
  >
    <div class="hue-track" />
    <div class="hue-cursor" :style="cursorStyle" />
  </div>
</template>

<style scoped>
.hue-slider {
  position: relative;
  width: 100%;
  height: 12px;
  cursor: pointer;
  user-select: none;
  touch-action: none;
}

.hue-slider:focus-visible {
  outline: none;
}

.hue-slider:focus-visible .hue-track {
  box-shadow: inset 0 0 0 1px hsl(var(--border-strong));
}

.hue-track {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  background: linear-gradient(
    to right,
    hsl(0, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(360, 100%, 50%)
  );
}

.hue-cursor {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  background: transparent;
}
</style>
