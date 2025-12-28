<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { TextState } from './types'
import TiptapEditor from '../../components/TiptapEditor.vue'

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
    <TiptapEditor
      v-model="content"
      placeholder="Start typing... Use markdown syntax for formatting."
    />
  </div>
</template>

<style scoped>
.text-widget {
  height: 100%;
}
</style>
