<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { colord } from 'colord'
import BkIcon from './BkIcon.vue'

/**
 * BkColorPickerInput
 *
 * Input field with format toggle (HEX, RGB, HSL).
 */

export type ColorFormat = 'hex' | 'rgb' | 'hsl'

interface Props {
  /** Current color value */
  modelValue: string | null
  /** Available formats */
  formats?: ColorFormat[]
}

const props = withDefaults(defineProps<Props>(), {
  formats: () => ['hex', 'rgb', 'hsl'],
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const currentFormat = ref<ColorFormat>(props.formats[0] || 'hex')
const inputValue = ref('')

// Format the color for display based on current format
function formatColor(color: string | null): string {
  if (!color) return ''

  const c = colord(color)
  if (!c.isValid()) return ''

  switch (currentFormat.value) {
    case 'hex':
      return c.toHex().toUpperCase()
    case 'rgb': {
      const { r, g, b } = c.toRgb()
      return `${r}, ${g}, ${b}`
    }
    case 'hsl': {
      const { h, s, l } = c.toHsl()
      return `${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%`
    }
    default:
      return c.toHex()
  }
}

// Parse user input and emit update
function parseAndEmit(value: string) {
  if (!value.trim()) {
    emit('update:modelValue', null)
    return
  }

  let parsed: ReturnType<typeof colord> | null = null

  switch (currentFormat.value) {
    case 'hex':
      // Accept with or without #
      parsed = colord(value.startsWith('#') ? value : `#${value}`)
      break
    case 'rgb': {
      // Parse "r, g, b" format
      const parts = value.split(',').map((p) => parseInt(p.trim(), 10))
      if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
        parsed = colord({ r: parts[0], g: parts[1], b: parts[2] })
      }
      break
    }
    case 'hsl': {
      // Parse "h, s%, l%" format
      const hslParts = value.split(',').map((p) => parseInt(p.trim(), 10))
      if (hslParts.length === 3 && hslParts.every((p) => !isNaN(p))) {
        parsed = colord({ h: hslParts[0], s: hslParts[1], l: hslParts[2] })
      }
      break
    }
  }

  if (parsed && parsed.isValid()) {
    emit('update:modelValue', parsed.toHex())
  }
}

// Cycle through formats
function cycleFormat() {
  const currentIndex = props.formats.indexOf(currentFormat.value)
  const nextIndex = (currentIndex + 1) % props.formats.length
  currentFormat.value = props.formats[nextIndex]
  inputValue.value = formatColor(props.modelValue)
}

// Watch for external color changes
watch(
  () => props.modelValue,
  (newColor) => {
    inputValue.value = formatColor(newColor)
  },
  { immediate: true }
)

// Update display when format changes
watch(currentFormat, () => {
  inputValue.value = formatColor(props.modelValue)
})

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  inputValue.value = target.value
}

function handleBlur() {
  parseAndEmit(inputValue.value)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    parseAndEmit(inputValue.value)
  }
}

const formatLabel = computed(() => currentFormat.value.toUpperCase())

const placeholder = computed(() => {
  switch (currentFormat.value) {
    case 'hex':
      return '#FFFFFF'
    case 'rgb':
      return '255, 255, 255'
    case 'hsl':
      return '0, 0%, 100%'
    default:
      return ''
  }
})
</script>

<template>
  <div class="color-input">
    <button
      v-if="formats.length > 1"
      type="button"
      class="format-toggle"
      :title="`Switch format (current: ${formatLabel})`"
      @click="cycleFormat"
    >
      {{ formatLabel }}
      <BkIcon icon="chevron-down" :size="10" />
    </button>
    <input
      type="text"
      class="input-field"
      :class="{ 'with-toggle': formats.length > 1 }"
      :value="inputValue"
      :placeholder="placeholder"
      @input="handleInput"
      @blur="handleBlur"
      @keydown="handleKeyDown"
    />
  </div>
</template>

<style scoped>
.color-input {
  display: flex;
  gap: 4px;
}

.format-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  height: 28px;
  font-size: 10px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.format-toggle:hover {
  background: hsl(var(--muted) / 0.8);
  color: hsl(var(--foreground));
}

.format-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}

.input-field {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  transition: all 0.15s ease;
}

.input-field:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
}

.input-field::placeholder {
  color: hsl(var(--muted-foreground));
}
</style>
