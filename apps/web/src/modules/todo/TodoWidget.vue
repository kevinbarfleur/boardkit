<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, todoContractV1, type PublicTodoList } from '@boardkit/core'
import { BkCheckbox, BkIcon } from '@boardkit/ui'
import type { TodoState, TodoItem, TodoPriority } from './types'
import { defaultTodoSettings } from './types'

interface Props {
  context: ModuleContext<TodoState>
}

const props = defineProps<Props>()

// Register as data provider for todo contract
useProvideData(props.context, todoContractV1, {
  project: (state): PublicTodoList => ({
    widgetId: props.context.widgetId,
    title: state.title || '',
    description: state.description || undefined,
    progress: {
      done: (state.items || []).filter((i) => i.completed).length,
      total: (state.items || []).length,
    },
    items: (state.items || []).map(({ id, label, completed }) => ({ id, label, completed })),
  }),
})

const newTodoLabel = ref('')
const deleteConfirmId = ref<string | null>(null)

const title = computed(() => props.context.state.title || '')
const description = computed(() => props.context.state.description || '')
const isSelected = computed(() => props.context.isSelected)

// Settings with defaults
const strikeCompleted = computed(
  () => props.context.state.strikeCompleted ?? defaultTodoSettings.strikeCompleted
)
const hideCompleted = computed(
  () => props.context.state.hideCompleted ?? defaultTodoSettings.hideCompleted
)
const autoSort = computed(() => props.context.state.autoSort ?? defaultTodoSettings.autoSort)
const showProgress = computed(
  () => props.context.state.showProgress ?? defaultTodoSettings.showProgress
)
const showDueDate = computed(
  () => props.context.state.showDueDate ?? defaultTodoSettings.showDueDate
)
const showPriority = computed(
  () => props.context.state.showPriority ?? defaultTodoSettings.showPriority
)
const confirmDelete = computed(
  () => props.context.state.confirmDelete ?? defaultTodoSettings.confirmDelete
)

// Items with filtering and sorting
const items = computed(() => {
  let result = [...(props.context.state.items || [])]

  // Filter completed if hideCompleted is enabled
  if (hideCompleted.value) {
    result = result.filter((item) => !item.completed)
  }

  // Sort if autoSort is enabled (completed items at bottom, then by priority)
  if (autoSort.value) {
    result.sort((a, b) => {
      // Completed items go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      // Sort by priority (high > medium > low > undefined)
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const aPriority = a.priority ? priorityOrder[a.priority] : 3
      const bPriority = b.priority ? priorityOrder[b.priority] : 3
      return aPriority - bPriority
    })
  }

  return result
})

// Raw items for progress calculation (before filtering)
const allItems = computed(() => props.context.state.items || [])

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
    items: [...allItems.value, newItem],
  })

  newTodoLabel.value = ''
}

const toggleTodo = (id: string, completed: boolean) => {
  const updated = allItems.value.map((item) => (item.id === id ? { ...item, completed } : item))
  props.context.updateState({ items: updated })
}

const updateTodoPriority = (id: string, priority: TodoPriority | undefined) => {
  const updated = allItems.value.map((item) => (item.id === id ? { ...item, priority } : item))
  props.context.updateState({ items: updated })
}

const updateTodoDueDate = (id: string, dueDate: string | undefined) => {
  const updated = allItems.value.map((item) => (item.id === id ? { ...item, dueDate } : item))
  props.context.updateState({ items: updated })
}

const requestDelete = (id: string) => {
  if (confirmDelete.value) {
    deleteConfirmId.value = id
  } else {
    removeTodo(id)
  }
}

const cancelDelete = () => {
  deleteConfirmId.value = null
}

const confirmDeleteAction = () => {
  if (deleteConfirmId.value) {
    removeTodo(deleteConfirmId.value)
    deleteConfirmId.value = null
  }
}

const removeTodo = (id: string) => {
  const updated = allItems.value.filter((item) => item.id !== id)
  props.context.updateState({ items: updated })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    addTodo()
  }
}

// Progress stats
const completedCount = computed(() => allItems.value.filter((i) => i.completed).length)
const totalCount = computed(() => allItems.value.length)
const progressPercent = computed(() =>
  totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0
)

// Priority colors
const getPriorityColor = (priority?: TodoPriority) => {
  switch (priority) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-amber-500'
    case 'low':
      return 'text-blue-500'
    default:
      return 'text-muted-foreground'
  }
}

// Due date formatting
const formatDueDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) return 'Today'
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (dateOnly < today) return 'Overdue'

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const isOverdue = (dateStr?: string) => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}
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

    <!-- Progress indicator -->
    <div v-if="showProgress !== 'none' && allItems.length > 0" class="flex items-center gap-2">
      <!-- Bar progress -->
      <template v-if="showProgress === 'bar'">
        <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
        <span class="text-xs text-muted-foreground shrink-0">{{ progressPercent }}%</span>
      </template>

      <!-- Counter progress -->
      <template v-else-if="showProgress === 'counter'">
        <span class="text-xs text-muted-foreground">
          {{ completedCount }}/{{ totalCount }} completed
        </span>
      </template>
    </div>

    <!-- Add new todo (only when selected) -->
    <div v-if="isSelected" class="flex">
      <input
        v-model="newTodoLabel"
        type="text"
        placeholder="Add a task..."
        class="flex-1 h-9 px-3 text-sm bg-background border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 placeholder:text-muted-foreground"
        @keydown="handleKeydown"
      />
      <button
        class="shrink-0 h-9 px-3 rounded-r-lg border border-l-0 border-border bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
        class="flex items-start gap-2 p-1.5 rounded hover:bg-accent/50 group"
      >
        <BkCheckbox
          :model-value="item.completed"
          class="mt-0.5"
          @update:model-value="(v) => toggleTodo(item.id, v)"
        />

        <div class="flex-1 min-w-0">
          <!-- Task label -->
          <span
            class="text-sm block"
            :class="{
              'line-through text-muted-foreground': item.completed && strikeCompleted,
              'text-muted-foreground': item.completed && !strikeCompleted,
            }"
          >
            {{ item.label }}
          </span>

          <!-- Meta info (due date, priority) -->
          <div
            v-if="(showDueDate && item.dueDate) || (showPriority && item.priority)"
            class="flex items-center gap-2 mt-0.5"
          >
            <!-- Due date -->
            <span
              v-if="showDueDate && item.dueDate"
              class="text-xs flex items-center gap-1"
              :class="isOverdue(item.dueDate) && !item.completed ? 'text-red-500' : 'text-muted-foreground'"
            >
              <BkIcon icon="calendar" :size="10" />
              {{ formatDueDate(item.dueDate) }}
            </span>

            <!-- Priority badge -->
            <span
              v-if="showPriority && item.priority"
              class="text-xs flex items-center gap-0.5"
              :class="getPriorityColor(item.priority)"
            >
              <BkIcon icon="flag" :size="10" />
              {{ item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low' }}
            </span>
          </div>
        </div>

        <!-- Actions (only when selected) -->
        <div v-if="isSelected" class="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Priority button -->
          <div v-if="showPriority" class="relative">
            <button
              class="h-6 w-6 rounded flex items-center justify-center hover:bg-accent"
              :class="getPriorityColor(item.priority)"
              @click="updateTodoPriority(item.id, item.priority === 'high' ? undefined : item.priority === 'medium' ? 'high' : item.priority === 'low' ? 'medium' : 'low')"
              title="Change priority"
            >
              <BkIcon icon="flag" :size="12" />
            </button>
          </div>

          <!-- Due date button -->
          <div v-if="showDueDate" class="relative">
            <input
              type="date"
              :value="item.dueDate || ''"
              class="absolute inset-0 opacity-0 cursor-pointer w-6"
              @change="updateTodoDueDate(item.id, ($event.target as HTMLInputElement).value || undefined)"
            />
            <button
              class="h-6 w-6 rounded flex items-center justify-center hover:bg-accent"
              :class="item.dueDate ? 'text-primary' : 'text-muted-foreground'"
            >
              <BkIcon icon="calendar" :size="12" />
            </button>
          </div>

          <!-- Delete button -->
          <button
            class="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            @click="requestDelete(item.id)"
          >
            <BkIcon icon="x" :size="12" />
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <p
        v-if="items.length === 0 && isSelected"
        class="text-sm text-muted-foreground text-center py-4"
      >
        {{ hideCompleted && allItems.length > 0 ? 'All tasks completed!' : 'No tasks yet' }}
      </p>
    </div>

    <!-- Delete confirmation dialog -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmId"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="fixed inset-0 bg-overlay/50" @click="cancelDelete" />
        <div class="relative bg-popover border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p class="text-sm text-foreground mb-4">
            Delete this task?
          </p>
          <div class="flex justify-end gap-2">
            <button
              class="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
              @click="cancelDelete"
            >
              Cancel
            </button>
            <button
              class="px-3 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
              @click="confirmDeleteAction"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
