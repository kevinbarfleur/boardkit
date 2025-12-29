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

const isSelected = (value: T): boolean => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value)
  }
  return props.modelValue === value
}

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

const containerClasses = computed(() => {
  const base = [
    'inline-flex items-center gap-1 p-1 rounded-lg',
    'bg-muted/60',
  ]

  if (props.fullWidth) {
    base.push('w-full')
  }

  if (props.disabled) {
    base.push('opacity-50 pointer-events-none')
  }

  return base.join(' ')
})

const getButtonClasses = (option: ButtonGroupOption<T>) => {
  const selected = isSelected(option.value)
  const isDisabled = props.disabled || option.disabled

  const base = [
    'relative flex-1 inline-flex items-center justify-center',
    'rounded-md font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  ]

  // Size
  if (props.size === 'sm') {
    base.push('h-7 px-3 text-xs')
  } else {
    base.push('h-8 px-4 text-sm')
  }

  // States
  if (isDisabled) {
    base.push('cursor-not-allowed')
    if (selected) {
      base.push('shadow-sm')
    } else {
      base.push('opacity-40')
    }
  } else if (selected) {
    base.push('shadow-sm cursor-default')
  } else {
    base.push('text-muted-foreground hover:text-foreground hover:bg-background/50 cursor-pointer')
  }

  return base.join(' ')
}

// Inline styles for dynamic colors (UnoCSS doesn't generate dynamic classes)
const getButtonStyle = (option: ButtonGroupOption<T>) => {
  const selected = isSelected(option.value)
  const isDisabled = props.disabled || option.disabled

  if (isDisabled && selected) {
    return {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
    }
  }

  if (selected) {
    return {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    }
  }

  return {}
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
      :style="getButtonStyle(option)"
      @click="handleClick(option.value, option.disabled)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
