<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ModuleContext, SettingsField, ModuleContextMenuEvent, ModuleMenuGroup } from '@boardkit/core'
import { useProvideData, todoContractV1, truncate, type PublicTodoList } from '@boardkit/core'
import { BkIcon, useModal } from '@boardkit/ui'
import type { TodoState, TodoItem, TodoPriority, TodoSettings } from './types'
import { defaultTodoSettings } from './types'
import {
  processItems,
  getProgressStats,
  toggleItemCompletion,
  updateItemPriority,
  updateItemDueDate,
  removeItem,
  findItem,
} from './composables'
import { TodoHeader, TodoList } from './components'

interface Props {
  context: ModuleContext<TodoState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  moduleContextMenu: [event: ModuleContextMenuEvent]
}>()

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

// Modal API
const { openModal } = useModal()

// UI state
const deleteConfirmId = ref<string | null>(null)

// Computed state
const title = computed(() => props.context.state.title || '')
const description = computed(() => props.context.state.description || '')
const isSelected = computed(() => props.context.isSelected)
const allItems = computed(() => props.context.state.items || [])

// Settings object for child components
const settings = computed<TodoSettings>(() => ({
  strikeCompleted: props.context.state.strikeCompleted ?? defaultTodoSettings.strikeCompleted,
  hideCompleted: props.context.state.hideCompleted ?? defaultTodoSettings.hideCompleted,
  showProgress: props.context.state.showProgress ?? defaultTodoSettings.showProgress,
  showDueDate: props.context.state.showDueDate ?? defaultTodoSettings.showDueDate,
  showPriority: props.context.state.showPriority ?? defaultTodoSettings.showPriority,
  enableReorder: props.context.state.enableReorder ?? defaultTodoSettings.enableReorder,
  autoSort: props.context.state.autoSort ?? defaultTodoSettings.autoSort,
  cascadeCompletion: props.context.state.cascadeCompletion ?? defaultTodoSettings.cascadeCompletion,
  confirmDelete: props.context.state.confirmDelete ?? defaultTodoSettings.confirmDelete,
}))

// Processed items (filtered + sorted)
const items = computed(() =>
  processItems(allItems.value, settings.value.hideCompleted, settings.value.autoSort)
)

// Progress stats
const progress = computed(() => getProgressStats(allItems.value))

// --- Actions ---

const updateTitle = (value: string) => {
  props.context.updateState(
    { title: value },
    { captureHistory: true, historyLabel: `Renamed list: ${truncate(value, 25)}`, debounceMs: 1000 }
  )
}

const updateDescription = (value: string) => {
  props.context.updateState(
    { description: value },
    { captureHistory: true, historyLabel: `Updated description`, debounceMs: 1000 }
  )
}

// Define form fields for the add task modal
const getAddTaskFields = (isSubTask: boolean): SettingsField[] => [
  {
    type: 'text',
    key: 'label',
    label: isSubTask ? 'Sub-task name' : 'Task name',
    placeholder: 'Enter task name...',
  },
  {
    type: 'textarea',
    key: 'description',
    label: 'Description',
    placeholder: 'Add a description (optional)',
    rows: 3,
  },
  {
    type: 'button-group',
    key: 'priority',
    label: 'Priority',
    options: [
      { value: '', label: 'None' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  },
  {
    type: 'date',
    key: 'dueDate',
    label: 'Due date',
    showPresets: true,
    placeholder: 'No due date',
  },
]

// Open add task modal
const openAddTaskModal = async (parentId?: string) => {
  const isSubTask = !!parentId

  const result = await openModal<{
    label: string
    description?: string
    priority?: TodoPriority | ''
    dueDate?: string | null
  }>({
    title: isSubTask ? 'Add sub-task' : 'Add task',
    fields: getAddTaskFields(isSubTask),
    initialValues: { priority: '' },
    submitLabel: isSubTask ? 'Add sub-task' : 'Add task',
  })

  if (result.confirmed && result.data?.label?.trim()) {
    const newItem: TodoItem = {
      id: nanoid(),
      label: result.data.label.trim(),
      description: result.data.description?.trim() || undefined,
      completed: false,
      priority: result.data.priority || undefined,
      dueDate: result.data.dueDate || undefined,
      parentId,
    }

    const historyLabel = parentId
      ? `Added sub-task: ${truncate(result.data.label, 30)}`
      : `Added todo: ${truncate(result.data.label, 30)}`

    props.context.updateState(
      { items: [...allItems.value, newItem] },
      { captureHistory: true, historyLabel }
    )
  }
}

const toggleTodo = (id: string, completed: boolean) => {
  const item = findItem(allItems.value, id)
  const updated = toggleItemCompletion(
    allItems.value,
    id,
    completed,
    settings.value.cascadeCompletion
  )
  const label = completed
    ? `Checked: ${truncate(item?.label, 30)}`
    : `Unchecked: ${truncate(item?.label, 30)}`
  props.context.updateState({ items: updated }, { captureHistory: true, historyLabel: label })
}

const updatePriority = (id: string, priority: TodoPriority | undefined) => {
  const item = findItem(allItems.value, id)
  const updated = updateItemPriority(allItems.value, id, priority)
  const priorityLabel = priority ? `${priority} priority` : 'no priority'
  props.context.updateState(
    { items: updated },
    { captureHistory: true, historyLabel: `Set ${priorityLabel}: ${truncate(item?.label, 25)}` }
  )
}

const updateDueDate = (id: string, dueDate: string | undefined) => {
  const item = findItem(allItems.value, id)
  const updated = updateItemDueDate(allItems.value, id, dueDate)
  const dateLabel = dueDate ? `due ${dueDate}` : 'no due date'
  props.context.updateState(
    { items: updated },
    { captureHistory: true, historyLabel: `Set ${dateLabel}: ${truncate(item?.label, 25)}` }
  )
}

const requestDelete = (id: string) => {
  if (settings.value.confirmDelete) {
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
  const item = findItem(allItems.value, id)
  const updated = removeItem(allItems.value, id)
  props.context.updateState(
    { items: updated },
    { captureHistory: true, historyLabel: `Deleted todo: ${truncate(item?.label, 30)}` }
  )
}

// --- Item Context Menu ---

/**
 * Build context menu groups for a specific item.
 * These are emitted to BoardCanvas which combines them with widget-level actions.
 */
const buildItemContextMenuGroups = (item: TodoItem): ModuleMenuGroup[] => {
  const groups: ModuleMenuGroup[] = []

  // Task actions group
  const taskActions: ModuleMenuGroup = {
    label: 'Task',
    items: [
      {
        id: `edit:${item.id}`,
        label: 'Edit',
        icon: 'pencil',
      },
      {
        id: `toggle:${item.id}`,
        label: item.completed ? 'Mark incomplete' : 'Mark complete',
        icon: item.completed ? 'circle' : 'check-circle',
      },
    ],
  }

  // Add sub-task option (only for root items)
  if (!item.parentId) {
    taskActions.items.push({
      id: `add-subtask:${item.id}`,
      label: 'Add sub-task',
      icon: 'corner-down-right',
    })
  }

  groups.push(taskActions)

  // Delete action in separate group
  groups.push({
    items: [
      {
        id: `delete:${item.id}`,
        label: 'Delete task',
        icon: 'trash-2',
        destructive: true,
      },
    ],
  })

  return groups
}

/**
 * Handle item context menu - emits to parent for combined rendering with widget actions.
 */
const handleItemContextMenu = (itemId: string, e: MouseEvent) => {
  const item = findItem(allItems.value, itemId)
  if (!item) return

  const groups = buildItemContextMenuGroups(item)

  emit('moduleContextMenu', {
    x: e.clientX,
    y: e.clientY,
    groups,
    onSelect: handleModuleMenuSelect,
  })
}

/**
 * Handle selection from module-specific menu items.
 * Called by BoardCanvas when a module menu item is selected.
 */
const handleModuleMenuSelect = async (menuItemId: string) => {
  // Parse the action and itemId from the menu item id (format: "action:itemId")
  const [action, itemId] = menuItemId.split(':')
  if (!itemId) return

  switch (action) {
    case 'edit':
      await openEditModal(itemId)
      break
    case 'toggle': {
      const item = findItem(allItems.value, itemId)
      if (item) toggleTodo(itemId, !item.completed)
      break
    }
    case 'add-subtask':
      await openAddTaskModal(itemId)
      break
    case 'delete':
      requestDelete(itemId)
      break
  }
}

// Open edit modal for an existing item
const openEditModal = async (itemId: string) => {
  const item = findItem(allItems.value, itemId)
  if (!item) return

  const result = await openModal<{
    label: string
    description?: string
    priority?: TodoPriority | ''
    dueDate?: string | null
  }>({
    title: 'Edit task',
    fields: getAddTaskFields(!!item.parentId),
    initialValues: {
      label: item.label,
      description: item.description || '',
      priority: item.priority || '',
      dueDate: item.dueDate || null,
    },
    submitLabel: 'Save',
  })

  if (result.confirmed && result.data?.label?.trim()) {
    const updatedItems = allItems.value.map((i) =>
      i.id === itemId
        ? {
            ...i,
            label: result.data!.label.trim(),
            description: result.data!.description?.trim() || undefined,
            priority: result.data!.priority || undefined,
            dueDate: result.data!.dueDate || undefined,
          }
        : i
    )

    props.context.updateState(
      { items: updatedItems },
      { captureHistory: true, historyLabel: `Edited: ${truncate(result.data.label, 30)}` }
    )
  }
}
</script>

<template>
  <div class="todo-widget h-full flex flex-col gap-2">
    <!-- Header: Title, Description, Progress -->
    <TodoHeader
      v-if="title || description || isSelected"
      :title="title"
      :description="description"
      :progress="progress"
      :show-progress="settings.showProgress"
      :is-selected="isSelected"
      @update:title="updateTitle"
      @update:description="updateDescription"
    />

    <!-- Todo list -->
    <TodoList
      :items="items"
      :all-items="allItems"
      :settings="settings"
      :is-selected="isSelected"
      :hide-completed="settings.hideCompleted"
      @toggle="toggleTodo"
      @update-priority="updatePriority"
      @update-due-date="updateDueDate"
      @delete="requestDelete"
      @open-sub-task-input="(id) => openAddTaskModal(id)"
      @contextmenu="handleItemContextMenu"
    />

    <!-- Add task button (always visible, discrete) -->
    <button
      class="flex items-center gap-2 p-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
      @click.stop="openAddTaskModal()"
    >
      <BkIcon icon="plus" :size="16" />
      <span>Add task</span>
    </button>

    <!-- Delete confirmation dialog -->
    <Teleport to="body">
      <div v-if="deleteConfirmId" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-overlay/50" @click="cancelDelete" />
        <div class="relative bg-popover border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p class="text-sm text-foreground mb-4">Delete this task?</p>
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
