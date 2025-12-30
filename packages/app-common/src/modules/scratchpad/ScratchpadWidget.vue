<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { ScratchpadState, FontSize } from './types'

interface Props {
  context: ModuleContext<ScratchpadState>
}

const props = defineProps<Props>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

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

// Auto-resize textarea
function autoResize() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

watch(content, () => {
  nextTick(autoResize)
})

onMounted(() => {
  nextTick(autoResize)
})
</script>

<template>
  <div class="scratchpad h-full flex flex-col">
    <textarea
      ref="textareaRef"
      v-model="content"
      :placeholder="placeholder"
      :class="[
        'flex-1 w-full resize-none bg-transparent border-none outline-none',
        'text-foreground placeholder:text-muted-foreground/50',
        'p-3 min-h-24',
        fontSizeClass,
      ]"
      @input="autoResize"
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
