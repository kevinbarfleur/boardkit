<script setup lang="ts">
import { computed } from 'vue'
import BkIcon from './BkIcon.vue'

/**
 * BkColorPicker
 *
 * A simple color picker with preset colors.
 */

interface Props {
  /** Currently selected color */
  modelValue: string | null
  /** Whether to show a "none" option (transparent) */
  showNone?: boolean
  /** Label for the picker */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  showNone: false,
  label: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// Preset color palette
const presetColors = [
  '#ffffff', // White
  '#a3a3a3', // Gray
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
]

const selectedColor = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function selectColor(color: string | null) {
  selectedColor.value = color
}

function isSelected(color: string | null) {
  return selectedColor.value === color
}
</script>

<template>
  <div class="color-picker">
    <div v-if="label" class="picker-label">{{ label }}</div>
    <div class="color-grid">
      <!-- None option -->
      <button
        v-if="showNone"
        type="button"
        class="color-swatch none"
        :class="{ selected: isSelected(null) }"
        title="None"
        @click="selectColor(null)"
      >
        <BkIcon icon="x" :size="12" />
      </button>

      <!-- Preset colors -->
      <button
        v-for="color in presetColors"
        :key="color"
        type="button"
        class="color-swatch"
        :class="{ selected: isSelected(color) }"
        :style="{ backgroundColor: color }"
        :title="color"
        @click="selectColor(color)"
      >
        <BkIcon
          v-if="isSelected(color)"
          icon="check"
          :size="12"
          :class="{ 'dark-check': color === '#ffffff' }"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-label {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
}

.color-swatch.none {
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.color-swatch .dark-check {
  color: #000;
}

.color-swatch:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
</style>
