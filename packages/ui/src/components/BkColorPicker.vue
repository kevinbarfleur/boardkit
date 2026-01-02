<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { colord } from 'colord'
import BkIcon from './BkIcon.vue'
import BkColorPickerPresets from './BkColorPickerPresets.vue'
import BkColorPickerGradient from './BkColorPickerGradient.vue'
import BkColorPickerHueSlider from './BkColorPickerHueSlider.vue'
import BkColorPickerInput from './BkColorPickerInput.vue'
import type { ColorFormat } from './BkColorPickerInput.vue'

/**
 * BkColorPicker
 *
 * A versatile color picker with presets and advanced selection.
 * Supports both inline and popover display modes.
 */

interface Props {
  /** Currently selected color (hex, rgb, hsl, or null) */
  modelValue: string | null
  /** Display mode */
  mode?: 'inline' | 'popover'
  /** Preset colors to display */
  presets?: string[]
  /** Show advanced picker (gradient + hue slider) */
  showAdvanced?: boolean
  /** Available color formats for input */
  formats?: ColorFormat[]
  /** Allow null/none value */
  showNone?: boolean
  /** Label (displayed above picker or in popover trigger) */
  label?: string
  /** Disabled state */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'popover',
  presets: () => [
    '#ffffff', '#f5f5f5', '#a3a3a3', '#525252', '#171717',
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e',
  ],
  showAdvanced: true,
  formats: () => ['hex', 'rgb', 'hsl'],
  showNone: false,
  label: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// Popover state
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

// HSV state for the gradient picker
const hue = ref(0)
const saturation = ref(100)
const value = ref(100)

// Sync HSV from modelValue
function syncFromModelValue(color: string | null) {
  if (!color) {
    hue.value = 0
    saturation.value = 0
    value.value = 100
    return
  }

  const c = colord(color)
  if (!c.isValid()) return

  const hsv = c.toHsv()
  hue.value = Math.round(hsv.h)
  saturation.value = Math.round(hsv.s)
  value.value = Math.round(hsv.v)
}

// Update modelValue from HSV
function updateFromHsv() {
  const color = colord({ h: hue.value, s: saturation.value, v: value.value })
  emit('update:modelValue', color.toHex())
}

// Watch modelValue for external changes
watch(
  () => props.modelValue,
  (newColor) => {
    syncFromModelValue(newColor)
  },
  { immediate: true }
)

// Handle preset selection
function handlePresetSelect(color: string | null) {
  emit('update:modelValue', color)
  if (props.mode === 'popover') {
    isOpen.value = false
  }
}

// Handle HSV changes
function handleHueChange(h: number) {
  hue.value = h
  updateFromHsv()
}

function handleSaturationChange(s: number) {
  saturation.value = s
  updateFromHsv()
}

function handleValueChange(v: number) {
  value.value = v
  updateFromHsv()
}

// Handle input change
function handleInputChange(color: string | null) {
  emit('update:modelValue', color)
}

// Popover positioning
const popoverPosition = ref({ top: 0, left: 0 })

function updatePopoverPosition() {
  if (!triggerRef.value || !popoverRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const popoverRect = popoverRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let top = triggerRect.bottom + 4
  let left = triggerRect.left

  // Flip to top if not enough space below
  if (top + popoverRect.height > viewportHeight - 8) {
    top = triggerRect.top - popoverRect.height - 4
  }

  // Adjust horizontal position
  if (left + popoverRect.width > viewportWidth - 8) {
    left = viewportWidth - popoverRect.width - 8
  }
  if (left < 8) {
    left = 8
  }

  popoverPosition.value = { top, left }
}

function togglePopover() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    requestAnimationFrame(updatePopoverPosition)
  }
}

function closePopover() {
  isOpen.value = false
}

// Click outside handler
function handleClickOutside(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (
    triggerRef.value?.contains(target) ||
    popoverRef.value?.contains(target)
  ) {
    return
  }
  closePopover()
}

// Escape key handler
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closePopover()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

// Display color for trigger
const displayColor = computed(() => {
  if (!props.modelValue) return null
  const c = colord(props.modelValue)
  return c.isValid() ? c.toHex() : null
})

const displayHex = computed(() => {
  return displayColor.value?.toUpperCase() ?? 'None'
})

// Check if color is light (for text contrast)
const isLightColor = computed(() => {
  if (!displayColor.value) return true
  return colord(displayColor.value).isLight()
})
</script>

<template>
  <div class="bk-color-picker" :class="{ disabled }">
    <!-- Label -->
    <div v-if="label && mode === 'inline'" class="picker-label">
      {{ label }}
    </div>

    <!-- Popover mode: Trigger button -->
    <button
      v-if="mode === 'popover'"
      ref="triggerRef"
      type="button"
      class="picker-trigger"
      :class="{ open: isOpen }"
      :disabled="disabled"
      @click="togglePopover"
    >
      <span
        class="trigger-swatch"
        :class="{ 'no-color': !displayColor }"
        :style="displayColor ? { backgroundColor: displayColor } : {}"
      >
        <BkIcon v-if="!displayColor" icon="x" :size="12" />
      </span>
      <span class="trigger-value">{{ displayHex }}</span>
      <BkIcon icon="chevron-down" :size="12" class="trigger-chevron" />
    </button>

    <!-- Popover content -->
    <Teleport to="body">
      <div
        v-if="mode === 'popover' && isOpen"
        ref="popoverRef"
        class="picker-popover"
        :style="{
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
        }"
      >
        <div class="popover-content">
          <!-- Advanced picker -->
          <template v-if="showAdvanced">
            <BkColorPickerGradient
              :hue="hue"
              :saturation="saturation"
              :value="value"
              @update:saturation="handleSaturationChange"
              @update:value="handleValueChange"
            />
            <BkColorPickerHueSlider
              :model-value="hue"
              @update:model-value="handleHueChange"
            />
          </template>

          <!-- Presets -->
          <div v-if="presets.length > 0" class="presets-section">
            <div class="section-label">Presets</div>
            <BkColorPickerPresets
              :model-value="modelValue"
              :colors="presets"
              :show-none="showNone"
              :columns="5"
              @update:model-value="handlePresetSelect"
            />
          </div>

          <!-- Input -->
          <div class="input-section">
            <BkColorPickerInput
              :model-value="modelValue"
              :formats="formats"
              @update:model-value="handleInputChange"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Inline mode: Direct content -->
    <div v-if="mode === 'inline'" class="inline-content">
      <!-- Advanced picker -->
      <template v-if="showAdvanced">
        <BkColorPickerGradient
          :hue="hue"
          :saturation="saturation"
          :value="value"
          @update:saturation="handleSaturationChange"
          @update:value="handleValueChange"
        />
        <BkColorPickerHueSlider
          :model-value="hue"
          @update:model-value="handleHueChange"
        />
      </template>

      <!-- Presets -->
      <div v-if="presets.length > 0" class="presets-section">
        <div class="section-label">Presets</div>
        <BkColorPickerPresets
          :model-value="modelValue"
          :colors="presets"
          :show-none="showNone"
          :columns="5"
          @update:model-value="handlePresetSelect"
        />
      </div>

      <!-- Input -->
      <div class="input-section">
        <BkColorPickerInput
          :model-value="modelValue"
          :formats="formats"
          @update:model-value="handleInputChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bk-color-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bk-color-picker.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.picker-label {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Popover trigger */
.picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  width: 120px;
  height: 32px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.picker-trigger:hover {
  border-color: hsl(var(--primary) / 0.5);
}

.picker-trigger:focus-visible {
  outline: none;
  border-color: hsl(var(--border-strong));
}

.picker-trigger.open {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
}

.trigger-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid hsl(var(--border));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trigger-swatch.no-color {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.trigger-value {
  flex: 1;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  color: hsl(var(--foreground));
  text-align: left;
}

.trigger-chevron {
  color: hsl(var(--muted-foreground));
  flex-shrink: 0;
}

/* Popover */
.picker-popover {
  position: fixed;
  z-index: 9999;
  background: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: popover-in 0.15s ease;
}

@keyframes popover-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popover-content {
  padding: 12px;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Inline content */
.inline-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* Sections */
.presets-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-size: 10px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
