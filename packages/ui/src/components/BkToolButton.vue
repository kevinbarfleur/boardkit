<script setup lang="ts">
import BkIcon from './BkIcon.vue'
import BkTooltip from './BkTooltip.vue'

/**
 * BkToolButton
 *
 * A toggle button for tool selection in the canvas toolbar.
 */

interface Props {
  /** Icon name from BkIcon */
  icon: string
  /** Whether the tool is currently active */
  active?: boolean
  /** Whether the button is disabled */
  disabled?: boolean
  /** Tooltip text */
  tooltip?: string
  /** Keyboard shortcut to display in tooltip */
  shortcut?: string
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  disabled: false,
  tooltip: '',
  shortcut: '',
})

defineEmits<{
  click: []
}>()

const tooltipContent = computed(() => {
  if (!props.tooltip) return ''
  if (props.shortcut) {
    return `${props.tooltip} (${props.shortcut})`
  }
  return props.tooltip
})
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <BkTooltip :content="tooltipContent" position="top" :delay="400">
    <button
      type="button"
      class="tool-button"
      :class="{ active, disabled }"
      :disabled="disabled"
      @click="$emit('click')"
    >
      <BkIcon :icon="icon" :size="18" />
    </button>
  </BkTooltip>
</template>

<style scoped>
.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-button:hover:not(.disabled) {
  background-color: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.tool-button.active {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.tool-button.active:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.tool-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-button:focus-visible {
  outline: none;
  box-shadow: none;
  border: 1px solid hsl(var(--border-strong));
}
</style>
