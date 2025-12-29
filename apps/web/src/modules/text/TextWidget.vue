<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { TextState } from './types'
import { defaultTextSettings } from './types'
import TiptapEditor from '../../components/TiptapEditor.vue'

interface Props {
  context: ModuleContext<TextState>
}

const props = defineProps<Props>()

const content = computed({
  get: () => props.context.state.content,
  set: (value: string) => props.context.updateState({ content: value }),
})

// Get settings with fallback to defaults
const fontSize = computed(() => props.context.state.fontSize ?? defaultTextSettings.fontSize)
const lineHeight = computed(() => props.context.state.lineHeight ?? defaultTextSettings.lineHeight)
const showWordCount = computed(
  () => props.context.state.showWordCount ?? defaultTextSettings.showWordCount
)

// Word count calculation
const wordCount = computed(() => {
  const text = props.context.state.content || ''
  // Remove markdown syntax and count words
  const cleaned = text
    .replace(/[#*_`~\[\]()]/g, '') // Remove markdown chars
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
  if (!cleaned) return 0
  return cleaned.split(/\s+/).filter(Boolean).length
})

const charCount = computed(() => {
  const text = props.context.state.content || ''
  return text.length
})
</script>

<template>
  <div class="text-widget h-full flex flex-col">
    <div class="flex-1 min-h-0">
      <TiptapEditor
        v-model="content"
        placeholder="Start typing... Use markdown syntax for formatting."
        :font-size="fontSize"
        :line-height="lineHeight"
      />
    </div>

    <!-- Word count footer -->
    <div
      v-if="showWordCount"
      class="shrink-0 px-2 py-1 text-xs text-muted-foreground border-t border-border flex items-center gap-3"
    >
      <span>{{ wordCount }} mot{{ wordCount !== 1 ? 's' : '' }}</span>
      <span class="text-muted-foreground/50">•</span>
      <span>{{ charCount }} caractère{{ charCount !== 1 ? 's' : '' }}</span>
    </div>
  </div>
</template>

<style scoped>
.text-widget {
  height: 100%;
}
</style>
