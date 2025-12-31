<script setup lang="ts">
import type { TodoItem as TodoItemType, TodoPriority, TodoSettings } from '../types'
import { getChildren } from '../composables/useTodoItems'
import TodoItem from './TodoItem.vue'

interface Props {
  items: TodoItemType[]
  allItems: TodoItemType[]
  settings: TodoSettings
  isSelected: boolean
  hideCompleted: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [id: string, completed: boolean]
  updatePriority: [id: string, priority: TodoPriority | undefined]
  updateDueDate: [id: string, dueDate: string | undefined]
  delete: [id: string]
  openSubTaskInput: [id: string]
  contextmenu: [id: string, event: MouseEvent]
}>()

const getItemChildren = (parentId: string): TodoItemType[] => {
  return getChildren(props.items, parentId)
}
</script>

<template>
  <div class="flex-1 overflow-auto space-y-1">
    <template v-for="item in items.filter((i) => !i.parentId)" :key="item.id">
      <!-- Root item -->
      <TodoItem
        :item="item"
        :settings="settings"
        :is-selected="isSelected"
        @toggle="(id, completed) => emit('toggle', id, completed)"
        @update-priority="(id, priority) => emit('updatePriority', id, priority)"
        @update-due-date="(id, date) => emit('updateDueDate', id, date)"
        @delete="(id) => emit('delete', id)"
        @add-sub-task="(id) => emit('openSubTaskInput', id)"
        @contextmenu="(id, e) => emit('contextmenu', id, e)"
      />

      <!-- Children (sub-tasks) -->
      <TodoItem
        v-for="child in getItemChildren(item.id)"
        :key="child.id"
        :item="child"
        :settings="settings"
        :is-selected="isSelected"
        :is-sub-task="true"
        @toggle="(id, completed) => emit('toggle', id, completed)"
        @update-priority="(id, priority) => emit('updatePriority', id, priority)"
        @update-due-date="(id, date) => emit('updateDueDate', id, date)"
        @delete="(id) => emit('delete', id)"
        @add-sub-task="(id) => emit('openSubTaskInput', id)"
        @contextmenu="(id, e) => emit('contextmenu', id, e)"
      />
    </template>

    <!-- Empty state -->
    <p
      v-if="items.filter((i) => !i.parentId).length === 0"
      class="text-sm text-muted-foreground text-center py-4"
    >
      {{ hideCompleted && allItems.length > 0 ? 'All tasks completed!' : 'No tasks yet' }}
    </p>
  </div>
</template>
