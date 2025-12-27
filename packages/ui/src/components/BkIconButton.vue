<script setup lang="ts">
export type IconButtonSize = 'sm' | 'default'

interface Props {
  size?: IconButtonSize
  disabled?: boolean
  ariaLabel: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  disabled: false,
})

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-6 w-6 rounded',         // Small: for widget headers
  default: 'h-9 w-9 rounded-full', // Default: for topbar actions
}
</script>

<template>
  <button
    class="inline-flex items-center justify-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    :class="[sizeClasses[props.size]]"
    :disabled="props.disabled"
    :aria-label="props.ariaLabel"
  >
    <slot />
  </button>
</template>
