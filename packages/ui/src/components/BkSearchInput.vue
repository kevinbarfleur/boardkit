<script setup lang="ts">
import { computed } from 'vue'
import BkIcon from './BkIcon.vue'

/**
 * BkSearchInput
 *
 * A search input with integrated search icon and clear button.
 * Consistent with the design system sizing (h-8 sm, h-9 default).
 */

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

function handleClear() {
  emit('update:modelValue', '')
}

const inputClasses = computed(() => {
  const base = [
    'w-full pl-8 pr-8 text-sm bg-background border border-border rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    'placeholder:text-muted-foreground transition-colors',
  ]

  if (props.size === 'sm') {
    base.push('h-8')
  } else {
    base.push('h-9')
  }

  if (props.disabled) {
    base.push('cursor-not-allowed opacity-50')
  }

  return base.join(' ')
})
</script>

<template>
  <div class="bk-search-input">
    <BkIcon
      icon="search"
      :size="14"
      class="search-icon"
    />
    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClasses"
      @input="handleInput"
    />
    <button
      v-if="modelValue && !disabled"
      type="button"
      class="clear-btn"
      @click="handleClear"
    >
      <BkIcon icon="x" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.bk-search-input {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: hsl(var(--muted-foreground));
  pointer-events: none;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: hsl(var(--muted-foreground));
  transition: color 0.15s ease;
  padding: 2px;
  border-radius: 4px;
}

.clear-btn:hover {
  color: hsl(var(--foreground));
}

.clear-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
</style>
