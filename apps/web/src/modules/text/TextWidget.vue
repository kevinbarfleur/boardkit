<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { TextState } from './types'

interface Props {
  context: ModuleContext<TextState>
}

const props = defineProps<Props>()

const content = computed({
  get: () => props.context.state.content,
  set: (value: string) => props.context.updateState({ content: value }),
})
</script>

<template>
  <div class="text-widget h-full">
    <textarea
      v-model="content"
      class="w-full h-full resize-none border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
      placeholder="Start typing..."
    />
  </div>
</template>
