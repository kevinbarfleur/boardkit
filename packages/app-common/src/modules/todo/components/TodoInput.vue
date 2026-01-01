<script setup lang="ts">
import { ref } from 'vue'
import { BkIcon } from '@boardkit/ui'

interface Props {
  placeholder?: string
  variant?: 'main' | 'subtask'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Add a task...',
  variant: 'main',
})

const emit = defineEmits<{
  submit: [label: string]
  cancel: []
}>()

const label = ref('')

const handleSubmit = () => {
  const trimmed = label.value.trim()
  if (!trimmed) return
  emit('submit', trimmed)
  label.value = ''
}

const handleCancel = () => {
  label.value = ''
  emit('cancel')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSubmit()
  } else if (e.key === 'Escape') {
    handleCancel()
  }
}
</script>

<template>
  <div class="flex items-center gap-1">
    <input
      v-model="label"
      type="text"
      :placeholder="placeholder"
      class="flex-1 min-w-0 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 placeholder:text-muted-foreground"
      :class="variant === 'main' ? 'h-9 px-3 rounded-r-none' : 'h-7 px-2'"
      @keydown="handleKeydown"
    />
    <button
      class="shrink-0 flex items-center justify-center border border-border bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      :class="variant === 'main' ? 'h-9 px-3 rounded-r-lg border-l-0' : 'h-7 w-7 rounded'"
      title="Add"
      @click="handleSubmit"
    >
      <BkIcon icon="plus" :size="variant === 'main' ? 16 : 14" />
    </button>
    <button
      v-if="variant === 'subtask'"
      class="shrink-0 h-7 w-7 rounded border border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      title="Cancel"
      @click="handleCancel"
    >
      <BkIcon icon="x" :size="14" />
    </button>
  </div>
</template>
