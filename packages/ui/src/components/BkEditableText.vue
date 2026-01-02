<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxWidth?: string
  /** Use 'title' variant for document titles with serif font */
  variant?: 'default' | 'title'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Click to edit',
  disabled: false,
  size: 'md',
  maxWidth: '200px',
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const measureRef = ref<HTMLSpanElement | null>(null)
const editValue = ref('')
const inputWidth = ref<string>('auto')

const isTitle = computed(() => props.variant === 'title')

const sizeClasses = computed(() => {
  if (isTitle.value) {
    // Title variant has its own sizing
    return 'text-base'
  }
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-base'
    default:
      return 'text-sm'
  }
})

// Measure text width and update input size
const updateInputWidth = () => {
  if (!measureRef.value) return
  const width = measureRef.value.offsetWidth
  inputWidth.value = `${width}px`
}

// Watch editValue to resize input as user types
watch(editValue, () => {
  nextTick(updateInputWidth)
})

const startEditing = () => {
  if (props.disabled) return
  editValue.value = props.modelValue
  isEditing.value = true
  nextTick(() => {
    updateInputWidth()
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

const finishEditing = () => {
  if (!isEditing.value) return
  isEditing.value = false
  const trimmed = editValue.value.trim()
  if (trimmed && trimmed !== props.modelValue) {
    emit('update:modelValue', trimmed)
  }
}

const cancelEditing = () => {
  isEditing.value = false
  editValue.value = props.modelValue
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishEditing()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEditing()
  }
}
</script>

<template>
  <div class="editable-text-root" :style="{ maxWidth: props.maxWidth }">
    <!-- Styled wrapper - handles ALL visual styling -->
    <div
      class="editable-wrapper"
      :class="[
        sizeClasses,
        isTitle ? 'editable-wrapper--title' : 'editable-wrapper--default',
        isEditing ? 'is-editing' : '',
        props.disabled ? 'is-disabled' : '',
      ]"
      @dblclick="startEditing"
    >
      <!-- Hidden span for measuring text width (inside wrapper to inherit font) -->
      <span
        ref="measureRef"
        class="measure-text"
        aria-hidden="true"
      >{{ editValue || props.placeholder }}</span>

      <!-- Edit mode - raw input, no styling -->
      <input
        v-if="isEditing"
        ref="inputRef"
        v-model="editValue"
        type="text"
        class="editable-input"
        :style="{ width: inputWidth }"
        @blur="finishEditing"
        @keydown="onKeydown"
      />

      <!-- Display mode - raw span, no styling -->
      <span
        v-else
        class="editable-display"
        :class="{ 'is-placeholder': !props.modelValue }"
      >{{ props.modelValue || props.placeholder }}</span>
    </div>
  </div>
</template>

<style scoped>
.editable-text-root {
  display: inline-flex;
  position: relative;
}

/* Hidden span for measuring text width - inherits font from wrapper */
.measure-text {
  position: absolute;
  visibility: hidden;
  white-space: pre;
  pointer-events: none;
  font: inherit;
}

/* Wrapper handles ALL styling - consistent in both modes */
.editable-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: text;
  transition: background-color 0.15s;
  font-weight: 500;
}

/* Default variant */
.editable-wrapper--default {
  padding: 2px 6px;
  border-radius: 4px;
}

.editable-wrapper--default:hover:not(.is-disabled) {
  background: hsl(var(--accent));
}

.editable-wrapper--default.is-editing {
  background: hsl(var(--accent) / 0.5);
}

/* Title variant */
.editable-wrapper--title {
  font-family: var(--font-serif);
  padding: 4px 10px;
  border-radius: 6px;
}

.editable-wrapper--title:hover:not(.is-disabled) {
  background: hsl(var(--accent) / 0.6);
}

.editable-wrapper--title.is-editing {
  background: hsl(var(--accent) / 0.4);
}

.editable-wrapper.is-disabled {
  cursor: default;
  opacity: 0.5;
}

/* Raw input - no visual styling */
.editable-input {
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: hsl(var(--foreground));
  line-height: inherit;
  min-width: 0;
}

/* Raw display span - no visual styling */
.editable-display {
  color: hsl(var(--foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editable-display.is-placeholder {
  color: hsl(var(--muted-foreground));
  font-style: italic;
}
</style>
