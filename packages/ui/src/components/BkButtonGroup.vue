<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'

export interface ButtonGroupOption<V = string> {
  value: V
  label: string
  disabled?: boolean
}

interface Props {
  modelValue: T | T[]
  options: ButtonGroupOption<T>[]
  multiple?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'default'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  fullWidth: false,
  size: 'default',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: T | T[]]
}>()

// Check if a value is selected
const isSelected = (value: T): boolean => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value)
  }
  return props.modelValue === value
}

// Handle button click
const handleClick = (value: T, optionDisabled?: boolean) => {
  if (props.disabled || optionDisabled) return

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = currentValues.indexOf(value)
    if (index === -1) {
      currentValues.push(value)
    } else {
      currentValues.splice(index, 1)
    }
    emit('update:modelValue', currentValues)
  } else {
    emit('update:modelValue', value)
  }
}

// Container classes
const containerClasses = computed(() => {
  const base = ['inline-flex rounded-md border border-border bg-muted p-0.5']
  if (props.fullWidth) {
    base.push('w-full')
  }
  if (props.disabled) {
    base.push('opacity-50')
  }
  return base.join(' ')
})

// Button classes
const getButtonClasses = (option: ButtonGroupOption<T>) => {
  const base = [
    'flex-1 inline-flex items-center justify-center rounded-sm',
    'text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  ]

  // Size
  if (props.size === 'sm') {
    base.push('h-7 px-2.5')
  } else {
    base.push('h-8 px-3')
  }

  // State
  const selected = isSelected(option.value)
  const isDisabled = props.disabled || option.disabled

  if (isDisabled) {
    base.push('cursor-not-allowed')
    if (selected) {
      base.push('bg-background text-muted-foreground shadow-sm')
    } else {
      base.push('text-muted-foreground/50 bg-transparent')
    }
  } else if (selected) {
    base.push('bg-background text-foreground shadow-sm cursor-default')
  } else {
    base.push('bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground cursor-pointer')
  }

  return base.join(' ')
}
</script>

<template>
  <div role="group" :class="containerClasses">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      :disabled="disabled || option.disabled"
      :aria-pressed="isSelected(option.value)"
      :class="getButtonClasses(option)"
      @click="handleClick(option.value, option.disabled)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
