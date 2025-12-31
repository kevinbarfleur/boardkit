<script setup lang="ts">
import { BkIcon } from '@boardkit/ui'
import type { TodoPriority } from '../types'
import { formatDueDate, isOverdue } from '../composables/useTodoDueDate'
import { getPriorityColor, getPriorityLabel } from '../composables/useTodoPriority'

interface Props {
  dueDate?: string
  priority?: TodoPriority
  completed?: boolean
  showDueDate?: boolean
  showPriority?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  completed: false,
  showDueDate: true,
  showPriority: true,
})
</script>

<template>
  <div
    v-if="(showDueDate && dueDate) || (showPriority && priority)"
    class="flex items-center gap-2"
  >
    <!-- Due date chip -->
    <span
      v-if="showDueDate && dueDate"
      class="text-xs flex items-center gap-1"
      :class="isOverdue(dueDate) && !completed ? 'text-red-500' : 'text-muted-foreground'"
    >
      <BkIcon icon="calendar" :size="10" />
      {{ formatDueDate(dueDate) }}
    </span>

    <!-- Priority chip -->
    <span
      v-if="showPriority && priority"
      class="text-xs flex items-center gap-0.5"
      :class="getPriorityColor(priority)"
    >
      <BkIcon icon="flag" :size="10" />
      {{ getPriorityLabel(priority) }}
    </span>
  </div>
</template>
