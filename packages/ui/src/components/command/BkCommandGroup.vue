<script setup lang="ts">
import { computed } from 'vue'
import { useCommandState } from '../../composables/useCommandState'

interface Props {
  heading?: string
  /** Group name used to filter visibility based on matching items */
  group?: string
}

const props = defineProps<Props>()
const state = useCommandState()

// Check if any items in this group are visible
const hasVisibleItems = computed(() => {
  // If no group specified, always show (fallback behavior)
  if (!props.group) return true

  const query = state.search.value.toLowerCase().trim()

  // If no search query, check if any items exist in this group
  if (!query) {
    return state.items.value.some(item => item.group === props.group && !item.disabled)
  }

  // Check if any items in this group match the search
  return state.items.value.some(item => {
    if (item.group !== props.group || item.disabled) return false

    const valueMatch = item.value.toLowerCase().includes(query)
    const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(query))

    return valueMatch || keywordMatch
  })
})
</script>

<template>
  <div v-show="hasVisibleItems" class="command-group" role="group" :aria-label="props.heading">
    <!-- Section header with serif font and decorative line -->
    <div
      v-if="props.heading"
      class="flex items-center gap-3 px-3 pt-4 pb-2"
    >
      <span class="font-serif text-sm font-medium text-foreground/80 whitespace-nowrap">
        {{ props.heading }}
      </span>
      <div class="flex-1 h-px bg-border/40" aria-hidden="true" />
    </div>

    <!-- Group items -->
    <div class="px-1 pb-1">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.command-group:first-child > div:first-child {
  padding-top: 0.5rem;
}
</style>
