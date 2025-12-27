<script setup lang="ts">
interface Props {
  heading?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="overflow-hidden p-1 text-foreground">
    <div
      v-if="props.heading"
      class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
    >
      {{ props.heading }}
    </div>
    <slot />
  </div>
</template>
