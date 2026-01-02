<script setup lang="ts">
import { computed } from 'vue'
import { colord } from 'colord'
import BkIcon from './BkIcon.vue'

/**
 * BkColorPickerPresets
 *
 * Grid of preset color swatches for quick selection.
 */

interface Props {
  /** Currently selected color */
  modelValue: string | null
  /** Preset colors to display */
  colors: string[]
  /** Show a "none" option */
  showNone?: boolean
  /** Number of columns in the grid */
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  showNone: false,
  columns: 5,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

function isSelected(color: string | null): boolean {
  if (color === null && props.modelValue === null) return true
  if (color === null || props.modelValue === null) return false
  // Compare normalized hex values
  return colord(color).toHex() === colord(props.modelValue).toHex()
}

function needsDarkCheck(color: string): boolean {
  // Use dark check icon for light colors
  return colord(color).isLight()
}

function selectColor(color: string | null) {
  emit('update:modelValue', color)
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
}))
</script>

<template>
  <div class="color-presets" :style="gridStyle">
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
      v-for="color in colors"
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
        :class="{ 'dark-check': needsDarkCheck(color) }"
      />
    </button>
  </div>
</template>

<style scoped>
.color-presets {
  display: grid;
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
  color: #fff;
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
  box-shadow: inset 0 0 0 2px hsl(var(--border-strong));
}
</style>
