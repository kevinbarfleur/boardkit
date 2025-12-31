<script setup lang="ts">
import { computed } from 'vue'
import { BkCheckbox } from '@boardkit/ui'
import type { TodoItem as TodoItemType, TodoPriority, TodoSettings } from '../types'
import TodoMetadata from './TodoMetadata.vue'
import TodoItemActions from './TodoItemActions.vue'

interface Props {
  item: TodoItemType
  settings: TodoSettings
  isSelected: boolean
  isSubTask?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubTask: false,
})

const emit = defineEmits<{
  toggle: [id: string, completed: boolean]
  updatePriority: [id: string, priority: TodoPriority | undefined]
  updateDueDate: [id: string, dueDate: string | undefined]
  delete: [id: string]
  addSubTask: [id: string]
  contextmenu: [id: string, event: MouseEvent]
}>()

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  emit('contextmenu', props.item.id, e)
}

const handleToggle = (completed: boolean) => {
  emit('toggle', props.item.id, completed)
}

// Check if we have any content below the header
const hasMetadata = computed(() => {
  return (props.settings.showDueDate && props.item.dueDate) ||
         (props.settings.showPriority && props.item.priority)
})
</script>

<template>
  <div
    class="group flex flex-col p-1.5 rounded hover:bg-accent/50"
    :class="{ 'pl-7': isSubTask }"
    @contextmenu="handleContextMenu"
  >
    <!-- Header: Checkbox + Label + Actions (always on same line) -->
    <div class="flex items-center gap-2">
      <BkCheckbox
        :model-value="item.completed"
        class="shrink-0"
        @click.stop
        @update:model-value="handleToggle"
      />

      <span
        class="flex-1 min-w-0 text-sm leading-tight truncate"
        :class="{
          'line-through text-muted-foreground': item.completed && settings.strikeCompleted,
          'text-muted-foreground': item.completed && !settings.strikeCompleted,
        }"
      >
        {{ item.label }}
      </span>

      <TodoItemActions
        v-if="isSelected"
        :item-id="item.id"
        :priority="item.priority"
        :due-date="item.dueDate"
        :show-priority="settings.showPriority"
        :show-due-date="settings.showDueDate"
        :show-add-sub-task="!isSubTask"
        class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        @add-sub-task="(id) => emit('addSubTask', id)"
        @update-priority="(id, priority) => emit('updatePriority', id, priority)"
        @update-due-date="(id, date) => emit('updateDueDate', id, date)"
        @delete="(id) => emit('delete', id)"
      />
    </div>

    <!-- Content area: Metadata, future description, etc. (indented to align with label) -->
    <div v-if="hasMetadata" class="pl-6 mt-0.5">
      <TodoMetadata
        :due-date="item.dueDate"
        :priority="item.priority"
        :completed="item.completed"
        :show-due-date="settings.showDueDate"
        :show-priority="settings.showPriority"
      />
    </div>
  </div>
</template>
