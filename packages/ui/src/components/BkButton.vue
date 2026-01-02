<script setup lang="ts">
import BkIcon from './BkIcon.vue'

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'

interface Props {
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  disabled: false,
  loading: false,
})

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:border-border-strong disabled:pointer-events-none disabled:opacity-50"
    :class="[variantClasses[props.variant]]"
    :disabled="props.disabled || props.loading"
  >
    <BkIcon v-if="props.loading" icon="loader" class="animate-spin" />
    <slot />
  </button>
</template>
