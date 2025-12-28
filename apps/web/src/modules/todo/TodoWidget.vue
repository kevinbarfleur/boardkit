<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ModuleContext } from '@boardkit/core'
import { BkCheckbox, BkInput, BkIcon } from '@boardkit/ui'
import type { TodoState, TodoItem } from './types'

interface Props {
  context: ModuleContext<TodoState>
}

const props = defineProps<Props>()

const newTodoLabel = ref('')

const title = computed(() => props.context.state.title || '')
const description = computed(() => props.context.state.description || '')
const items = computed(() => props.context.state.items || [])
const isSelected = computed(() => props.context.isSelected)

const updateTitle = (value: string) => {
  props.context.updateState({ title: value })
}

const updateDescription = (value: string) => {
  props.context.updateState({ description: value })
}

const addTodo = () => {
  if (!newTodoLabel.value.trim()) return

  const newItem: TodoItem = {
    id: nanoid(),
    label: newTodoLabel.value.trim(),
    completed: false,
  }

  props.context.updateState({
    items: [...items.value, newItem],
  })

  newTodoLabel.value = ''
}

const toggleTodo = (id: string, completed: boolean) => {
  const updated = items.value.map((item) =>
    item.id === id ? { ...item, completed } : item
  )
  props.context.updateState({ items: updated })
}

const removeTodo = (id: string) => {
  const updated = items.value.filter((item) => item.id !== id)
  props.context.updateState({ items: updated })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    addTodo()
  }
}

// Progress stats
const completedCount = computed(() => items.value.filter(i => i.completed).length)
const totalCount = computed(() => items.value.length)
</script>

<template>
  <div class="todo-widget h-full flex flex-col gap-2">
    <!-- Header: Title & Description (always visible, editable when selected) -->
    <div v-if="title || description || isSelected" class="flex flex-col gap-1">
      <input
        v-if="isSelected"
        :value="title"
        placeholder="List title..."
        class="bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground outline-none"
        @input="updateTitle(($event.target as HTMLInputElement).value)"
      />
      <span v-else-if="title" class="text-base font-medium text-foreground">
        {{ title }}
      </span>

      <input
        v-if="isSelected"
        :value="description"
        placeholder="Description..."
        class="bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
        @input="updateDescription(($event.target as HTMLInputElement).value)"
      />
      <span v-else-if="description" class="text-sm text-muted-foreground">
        {{ description }}
      </span>
    </div>

    <!-- Add new todo (only when selected) -->
    <div v-if="isSelected" class="flex gap-2">
      <BkInput
        v-model="newTodoLabel"
        placeholder="Add a task..."
        class="flex-1"
        @keydown="handleKeydown"
      />
      <button
        class="shrink-0 h-9 w-9 rounded-md border border-input bg-transparent hover:bg-accent flex items-center justify-center"
        @click="addTodo"
      >
        <BkIcon icon="plus" :size="16" />
      </button>
    </div>

    <!-- Todo list -->
    <div class="flex-1 overflow-auto space-y-1">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-2 p-1 rounded hover:bg-accent/50 group"
      >
        <BkCheckbox
          :model-value="item.completed"
          @update:model-value="(v) => toggleTodo(item.id, v)"
        />
        <span
          class="flex-1 text-sm"
          :class="{ 'line-through text-muted-foreground': item.completed }"
        >
          {{ item.label }}
        </span>
        <button
          v-if="isSelected"
          class="h-5 w-5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-opacity"
          @click="removeTodo(item.id)"
        >
          <BkIcon icon="x" :size="12" />
        </button>
      </div>

      <!-- Empty state -->
      <p
        v-if="items.length === 0 && isSelected"
        class="text-sm text-muted-foreground text-center py-4"
      >
        No tasks yet
      </p>

      <!-- Progress indicator (when not selected and has items) -->
      <div
        v-if="!isSelected && items.length > 0"
        class="text-xs text-muted-foreground pt-2"
      >
        {{ completedCount }}/{{ totalCount }} completed
      </div>
    </div>
  </div>
</template>
