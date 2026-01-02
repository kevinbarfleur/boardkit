<script setup lang="ts">
/**
 * BkTabs
 *
 * Tab navigation component for switching between views.
 * Used in the settings panel to switch between Configure and Settings tabs.
 *
 * Variants:
 * - default: Subtle segmented control
 * - pills: Pill-shaped tabs in a container
 * - underline: Underline indicator
 * - card: Classic card tabs that merge with content below
 */
import { computed } from 'vue'
import BkIcon from './BkIcon.vue'

export interface Tab {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Optional icon */
  icon?: string
  /** Optional badge (e.g., count) */
  badge?: string | number
  /** Whether tab is disabled */
  disabled?: boolean
}

interface Props {
  /** Available tabs */
  tabs: Tab[]
  /** Currently active tab ID */
  modelValue: string
  /** Visual variant */
  variant?: 'default' | 'pills' | 'underline' | 'card'
  /** Whether to stretch tabs to fill width */
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  fullWidth: true,
})

const emit = defineEmits<{
  'update:modelValue': [tabId: string]
}>()

function selectTab(tab: Tab) {
  if (!tab.disabled) {
    emit('update:modelValue', tab.id)
  }
}

const containerClass = computed(() => {
  const base = ['flex']

  switch (props.variant) {
    case 'pills':
      base.push('gap-1 p-1 bg-muted rounded-lg')
      break
    case 'underline':
      base.push('border-b border-border')
      break
    case 'card':
      // Card tabs: no container background, tabs sit above the content border
      base.push('relative')
      break
    default:
      base.push('gap-1 p-1 bg-muted/50 rounded-lg')
  }

  return base.join(' ')
})

function getTabClass(tab: Tab) {
  const isActive = props.modelValue === tab.id
  const base = [
    'flex items-center justify-center gap-1.5',
    'text-sm font-medium transition-all',
    'focus:outline-none focus-visible:border-border-strong',
  ]

  if (props.fullWidth) {
    base.push('flex-1')
  }

  if (tab.disabled) {
    base.push('opacity-50 cursor-not-allowed')
  }

  switch (props.variant) {
    case 'pills':
      base.push('px-3 py-1.5 rounded-md')
      if (isActive) {
        base.push('bg-background text-foreground shadow-sm')
      } else {
        base.push('text-muted-foreground hover:text-foreground')
      }
      break
    case 'underline':
      base.push('px-4 py-2 -mb-px border-b-2')
      if (isActive) {
        base.push('border-primary text-foreground')
      } else {
        base.push('border-transparent text-muted-foreground hover:text-foreground hover:border-border')
      }
      break
    case 'card':
      // Card tabs: active tab merges with content below
      // All tabs have same size to prevent layout shift
      base.push('px-4 py-2 rounded-t-lg')
      if (isActive) {
        // Active: visible border on 3 sides, overlaps content border
        base.push(
          'bg-popover text-foreground',
          'border-t border-l border-r border-border',
          'relative z-10',
          'mb-[-1px]' // Overlap content's top border
        )
      } else {
        // Inactive: transparent border to maintain same size
        base.push(
          'text-muted-foreground',
          'hover:text-foreground',
          'border-t border-l border-r border-transparent'
        )
      }
      break
    default:
      base.push('px-3 py-1.5 rounded-md')
      if (isActive) {
        base.push('bg-background text-foreground shadow-sm')
      } else {
        base.push('text-muted-foreground hover:text-foreground hover:bg-background/50')
      }
  }

  return base.join(' ')
}
</script>

<template>
  <div :class="containerClass" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.id"
      :aria-disabled="tab.disabled"
      :tabindex="tab.disabled ? -1 : 0"
      :class="getTabClass(tab)"
      @click="selectTab(tab)"
    >
      <BkIcon v-if="tab.icon" :icon="tab.icon" :size="14" />
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.badge !== undefined"
        class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary"
      >
        {{ tab.badge }}
      </span>
    </button>
  </div>
</template>
