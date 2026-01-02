<script setup lang="ts">
import { computed } from 'vue'
import { BkTextarea } from '@boardkit/ui'
import type { ModuleContext } from '@boardkit/core'
import type { ScratchpadState, FontSize } from './types'

interface Props {
  context: ModuleContext<ScratchpadState>
}

const props = defineProps<Props>()

// Computed properties
const content = computed({
  get: () => props.context.state.content,
  set: (value: string) => props.context.updateState({ content: value }),
})

const fontSize = computed(() => props.context.state.fontSize)
const showWordCount = computed(() => props.context.state.showWordCount)
const placeholder = computed(() => props.context.state.placeholder || 'Quick notes...')

const fontSizeClass = computed(() => {
  const sizes: Record<FontSize, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }
  return sizes[fontSize.value]
})

const wordCount = computed(() => {
  const text = content.value.trim()
  if (!text) return 0
  return text.split(/\s+/).length
})

const charCount = computed(() => content.value.length)
</script>

<template>
  <div class="scratchpad h-full flex flex-col">
    <BkTextarea
      v-model="content"
      :placeholder="placeholder"
      :auto-resize="true"
      :borderless="true"
      min-height="96px"
      :class="['flex-1 p-3', fontSizeClass]"
    />

    <div
      v-if="showWordCount"
      class="text-xs text-muted-foreground px-3 pb-2 flex gap-3"
    >
      <span>{{ wordCount }} words</span>
      <span>{{ charCount }} chars</span>
    </div>
  </div>
</template>
