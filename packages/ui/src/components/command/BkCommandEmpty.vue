<script setup lang="ts">
import { computed } from 'vue'
import { useCommandState } from '../../composables/useCommandState'

const state = useCommandState()

const isEmpty = computed(() => {
  return state.filteredItems.value.length === 0
})
</script>

<template>
  <div
    v-if="isEmpty"
    class="py-6 text-center text-sm text-muted-foreground"
    role="status"
    aria-live="polite"
  >
    <slot>No results found.</slot>
  </div>
</template>
