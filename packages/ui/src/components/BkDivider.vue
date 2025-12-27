<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
})
</script>

<template>
  <div
    class="shrink-0 bg-border"
    :class="props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'"
  />
</template>
