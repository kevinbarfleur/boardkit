<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommandState } from '../../composables/useCommandState'

interface Props {
  id?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Commands',
})

const state = useCommandState()
const listRef = ref<HTMLDivElement | null>(null)

// Provide list ref to state for scroll management
onMounted(() => {
  state.listRef.value = listRef.value
})
</script>

<template>
  <div
    ref="listRef"
    :id="props.id"
    role="listbox"
    :aria-label="props.label"
    class="max-h-72 overflow-y-auto overflow-x-hidden"
  >
    <slot />
  </div>
</template>
