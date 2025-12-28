<script setup lang="ts">
import { computed } from 'vue'

/**
 * BkSlider
 *
 * A compact numeric slider for style properties.
 */

interface Props {
  /** Current value */
  modelValue: number
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment */
  step?: number
  /** Label for the slider */
  label?: string
  /** Whether to show the current value */
  showValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  showValue: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Calculate percentage for styling
const percentage = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})
</script>

<template>
  <div class="slider">
    <div v-if="label || showValue" class="slider-header">
      <span v-if="label" class="slider-label">{{ label }}</span>
      <span v-if="showValue" class="slider-value">{{ modelValue }}</span>
    </div>
    <input
      v-model.number="value"
      type="range"
      class="slider-input"
      :min="min"
      :max="max"
      :step="step"
      :style="{ '--percentage': `${percentage}%` }"
    />
  </div>
</template>

<style scoped>
.slider {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slider-value {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--foreground));
  font-variant-numeric: tabular-nums;
}

.slider-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: linear-gradient(
    to right,
    hsl(var(--primary)) 0%,
    hsl(var(--primary)) var(--percentage),
    hsl(var(--muted)) var(--percentage),
    hsl(var(--muted)) 100%
  );
  border-radius: 3px;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: hsl(var(--foreground));
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.slider-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: hsl(var(--foreground));
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.slider-input:focus-visible {
  outline: none;
}

.slider-input:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
</style>
