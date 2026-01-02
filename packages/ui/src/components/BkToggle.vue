<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  disabled?: boolean
  size?: 'sm' | 'default'
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}

const trackClasses = computed(() => {
  const base = [
    'relative inline-flex items-center shrink-0 cursor-pointer rounded-full border border-transparent',
    'transition-colors duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:border-border-strong',
  ]

  // Size
  if (props.size === 'sm') {
    base.push('h-4 w-7')
  } else {
    base.push('h-5 w-9')
  }

  // State
  if (props.disabled) {
    base.push('cursor-not-allowed opacity-50')
  }

  return base.join(' ')
})

// Use inline style for background to ensure dynamic class works
const trackStyle = computed(() => ({
  backgroundColor: props.modelValue
    ? 'hsl(var(--primary))'
    : 'hsl(var(--muted))'
}))

const thumbClasses = computed(() => {
  const base = [
    'pointer-events-none inline-block rounded-full bg-white shadow-sm',
    'ring-0 transition-transform duration-200 ease-in-out',
    // Subtle border when active to avoid white-on-white
    props.modelValue ? 'border border-black/10' : '',
  ]

  // Size and position
  // Default: track 36px, thumb 16px → on position = 36 - 16 - 2 = 18px
  // Small: track 28px, thumb 12px → on position = 28 - 12 - 2 = 14px
  if (props.size === 'sm') {
    base.push('h-3 w-3')
    if (props.modelValue) {
      base.push('translate-x-[14px]')
    } else {
      base.push('translate-x-0.5')
    }
  } else {
    base.push('h-4 w-4')
    if (props.modelValue) {
      base.push('translate-x-[18px]')
    } else {
      base.push('translate-x-0.5')
    }
  }

  return base.join(' ')
})
</script>

<template>
  <button
    type="button"
    role="switch"
    :id="id"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="trackClasses"
    :style="trackStyle"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <span :class="thumbClasses" />
  </button>
</template>
