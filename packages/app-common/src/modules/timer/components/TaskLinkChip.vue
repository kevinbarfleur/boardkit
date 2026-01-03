<script setup lang="ts">
/**
 * TaskLinkChip - Displays the currently linked task with unlink option
 */

import { BkIcon } from '@boardkit/ui'
import type { TaskReference } from '../types'

interface Props {
  task: TaskReference
}

defineProps<Props>()

const emit = defineEmits<{
  unlink: []
}>()

function handleUnlink(e: MouseEvent) {
  e.stopPropagation()
  emit('unlink')
}
</script>

<template>
  <div class="task-link-chip group flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 border border-border hover:bg-muted transition-colors">
    <BkIcon
      :icon="task.sourceType === 'kanban' ? 'columns-3' : 'check-square'"
      :size="14"
      class="text-muted-foreground shrink-0"
    />
    <span class="flex-1 text-sm text-foreground truncate">
      {{ task.taskLabel }}
    </span>
    <button
      type="button"
      class="shrink-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
      title="Unlink task"
      @click="handleUnlink"
    >
      <BkIcon icon="x" :size="14" />
    </button>
  </div>
</template>
