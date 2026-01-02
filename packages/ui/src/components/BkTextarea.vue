<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'

/**
 * BkTextarea
 *
 * A styled textarea with optional auto-resize support.
 * When autoResize is enabled, the textarea grows to fit its content.
 */

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  /** When true, textarea height adjusts to content */
  autoResize?: boolean
  /** Minimum height when using autoResize */
  minHeight?: string
  /** When true, removes border and background for inline/transparent use */
  borderless?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  rows: 3,
  autoResize: false,
  minHeight: '96px',
  borderless: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function resizeTextarea() {
  if (!props.autoResize || !textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
}

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  resizeTextarea()
}

// Watch for external value changes
watch(() => props.modelValue, () => {
  nextTick(resizeTextarea)
})

onMounted(() => {
  nextTick(resizeTextarea)
})

const textareaStyle = computed(() => {
  if (props.autoResize) {
    return { minHeight: props.minHeight }
  }
  return {}
})

const textareaClasses = computed(() => {
  const base = [
    'flex w-full text-sm text-foreground',
    'placeholder:text-muted-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'resize-none outline-none',
  ]

  if (props.borderless) {
    base.push('bg-transparent border-none')
  } else {
    base.push(
      'rounded-md border border-border bg-transparent px-3 py-2',
      'focus-visible:border-border-strong',
      'dark:bg-input/10'
    )
  }

  return base.join(' ')
})
</script>

<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="autoResize ? undefined : rows"
    :style="textareaStyle"
    :class="textareaClasses"
    @input="onInput"
  />
</template>
