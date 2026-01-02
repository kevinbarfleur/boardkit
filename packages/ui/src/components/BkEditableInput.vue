<script setup lang="ts">
import { computed } from 'vue'

/**
 * BkEditableInput
 *
 * A minimal, transparent input for inline editing.
 * Used for titles, descriptions, and other inline editable text.
 * Supports variants for different text styles.
 */

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  /** Variant determines the text styling */
  variant?: 'title' | 'subtitle' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

const inputClasses = computed(() => {
  const base = [
    'w-full bg-transparent outline-none',
    'placeholder:text-muted-foreground/50',
  ]

  // Variant styling
  switch (props.variant) {
    case 'title':
      base.push('text-base font-medium text-foreground')
      break
    case 'subtitle':
      base.push('text-sm text-muted-foreground')
      break
    default:
      base.push('text-sm text-foreground')
  }

  if (props.disabled) {
    base.push('cursor-not-allowed opacity-50')
  }

  return base.join(' ')
})
</script>

<template>
  <input
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="inputClasses"
    @input="handleInput"
  />
</template>
