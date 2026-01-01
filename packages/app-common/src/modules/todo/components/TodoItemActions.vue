<script setup lang="ts">
import { BkIcon, BkDatePicker } from '@boardkit/ui'
import type { TodoPriority } from '../types'
import { getPriorityColor, getNextPriority } from '../composables/useTodoPriority'

interface Props {
  itemId: string
  priority?: TodoPriority
  dueDate?: string
  showPriority?: boolean
  showDueDate?: boolean
  showAddSubTask?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPriority: true,
  showDueDate: true,
  showAddSubTask: true,
})

const emit = defineEmits<{
  addSubTask: [id: string]
  updatePriority: [id: string, priority: TodoPriority | undefined]
  updateDueDate: [id: string, dueDate: string | undefined]
  delete: [id: string]
}>()

const cyclePriority = () => {
  emit('updatePriority', props.itemId, getNextPriority(props.priority))
}

const handleDateChange = (value: string | null) => {
  emit('updateDueDate', props.itemId, value || undefined)
}

const handleDelete = () => {
  emit('delete', props.itemId)
}

const handleAddSubTask = () => {
  emit('addSubTask', props.itemId)
}

// Common button classes
const btnClass = 'w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-colors'
</script>

<template>
  <div class="inline-flex items-center gap-1">
    <!-- Add sub-task -->
    <button
      v-if="showAddSubTask"
      :class="[btnClass, 'text-muted-foreground hover:text-foreground']"
      title="Add sub-task"
      @click.stop="handleAddSubTask"
    >
      <BkIcon icon="corner-down-right" :size="14" />
    </button>

    <!-- Priority -->
    <button
      v-if="showPriority"
      :class="[btnClass, getPriorityColor(priority)]"
      title="Change priority"
      @click.stop="cyclePriority"
    >
      <BkIcon icon="flag" :size="14" />
    </button>

    <!-- Due date - wrapped to constrain BkDatePicker width -->
    <div v-if="showDueDate" class="w-6 h-6">
      <BkDatePicker
        :model-value="dueDate || null"
        size="sm"
        :show-presets="true"
        @update:model-value="handleDateChange"
      >
        <template #trigger>
          <button
            :class="[btnClass, dueDate ? 'text-primary' : 'text-muted-foreground hover:text-foreground']"
            title="Set due date"
            @click.stop
          >
            <BkIcon icon="calendar" :size="14" />
          </button>
        </template>
      </BkDatePicker>
    </div>

    <!-- Delete -->
    <button
      :class="[btnClass, 'text-muted-foreground hover:text-destructive hover:bg-destructive/10']"
      title="Delete"
      @click.stop="handleDelete"
    >
      <BkIcon icon="trash-2" :size="14" />
    </button>
  </div>
</template>
