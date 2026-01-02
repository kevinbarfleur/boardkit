<script setup lang="ts">
import { computed } from 'vue'
import { useCommandState } from '../../composables/useCommandState'
import BkIcon from '../BkIcon.vue'

const state = useCommandState()

const isEmpty = computed(() => {
  return state.filteredItems.value.length === 0
})
</script>

<template>
  <div
    v-if="isEmpty"
    class="flex flex-col items-center justify-center py-8 px-4 text-center"
    role="status"
    aria-live="polite"
  >
    <div class="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
      <BkIcon icon="search-x" :size="24" class="text-muted-foreground/50" />
    </div>
    <p class="text-sm text-muted-foreground">
      <slot>No results found</slot>
    </p>
    <p class="text-xs text-muted-foreground/60 mt-1">
      Try a different search term
    </p>
  </div>
</template>
