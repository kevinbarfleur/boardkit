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

const items = computed(() => props.context.state.items)

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
</script>

<template>
  <div class="todo-widget h-full flex flex-col gap-2">
    <!-- Add new todo -->
    <div class="flex gap-2">
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
        <BkIcon icon="plus" size="sm" />
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
          class="h-5 w-5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-opacity"
          @click="removeTodo(item.id)"
        >
          <BkIcon icon="x" size="xs" />
        </button>
      </div>

      <p
        v-if="items.length === 0"
        class="text-sm text-muted-foreground text-center py-4"
      >
        No tasks yet
      </p>
    </div>
  </div>
</template>
