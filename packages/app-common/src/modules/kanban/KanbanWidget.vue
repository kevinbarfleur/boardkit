<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, kanbanContractV1, kanbanStatsContractV1, truncate } from '@boardkit/core'
import { BkButton, BkIcon, BkInput } from '@boardkit/ui'
import type { KanbanState, KanbanItem, KanbanColumn } from './types'
import type { PublicKanbanBoard, PublicKanbanStats } from '@boardkit/core'

interface Props {
  context: ModuleContext<KanbanState>
}

const props = defineProps<Props>()

// Local state
const draggedItemId = ref<string | null>(null)
const dragOverColumnId = ref<string | null>(null)
const addingToColumn = ref<string | null>(null)
const newItemTitle = ref('')

// Computed properties
const columns = computed(() =>
  [...(props.context.state.columns || [])].sort((a, b) => a.order - b.order)
)
const items = computed(() => props.context.state.items || [])
const showWipLimits = computed(() => props.context.state.showWipLimits)
const showItemCount = computed(() => props.context.state.showItemCount)
const showCompletionRate = computed(() => props.context.state.showCompletionRate)

function getColumnItems(columnId: string): KanbanItem[] {
  return items.value
    .filter((item) => item.columnId === columnId)
    .sort((a, b) => a.order - b.order)
}

function getColumnItemCount(columnId: string): number {
  return items.value.filter((item) => item.columnId === columnId).length
}

function isOverWipLimit(column: KanbanColumn): boolean {
  if (column.wipLimit === null) return false
  return getColumnItemCount(column.id) > column.wipLimit
}

const lastColumn = computed(() => columns.value[columns.value.length - 1])

const completionStats = computed(() => {
  const total = items.value.length
  const completed = lastColumn.value ? getColumnItemCount(lastColumn.value.id) : 0
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, rate }
})

// Drag & Drop handlers
function handleDragStart(e: DragEvent, itemId: string) {
  draggedItemId.value = itemId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }
}

function handleDragOver(e: DragEvent, columnId: string) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverColumnId.value = columnId
}

function handleDragLeave() {
  dragOverColumnId.value = null
}

function handleDrop(e: DragEvent, targetColumnId: string) {
  e.preventDefault()
  dragOverColumnId.value = null

  if (!draggedItemId.value) return

  const itemIndex = items.value.findIndex((item) => item.id === draggedItemId.value)
  if (itemIndex === -1) return

  const item = items.value[itemIndex]
  if (item.columnId === targetColumnId) {
    draggedItemId.value = null
    return
  }

  // Get target column name for history label
  const targetColumn = columns.value.find((c) => c.id === targetColumnId)
  const columnName = targetColumn?.title ?? 'column'

  // Get max order in target column
  const targetItems = getColumnItems(targetColumnId)
  const maxOrder = targetItems.length > 0
    ? Math.max(...targetItems.map((i) => i.order))
    : -1

  const newItems = [...items.value]
  newItems[itemIndex] = {
    ...item,
    columnId: targetColumnId,
    order: maxOrder + 1,
  }

  props.context.updateState(
    { items: newItems },
    {
      captureHistory: true,
      historyLabel: `Moved: ${truncate(item.title, 20)} → ${columnName}`,
    }
  )
  draggedItemId.value = null
}

function handleDragEnd() {
  draggedItemId.value = null
  dragOverColumnId.value = null
}

// Item management
function addItem(columnId: string) {
  if (!newItemTitle.value.trim()) return

  const title = newItemTitle.value.trim()
  const column = columns.value.find((c) => c.id === columnId)
  const columnName = column?.title ?? 'column'

  const columnItems = getColumnItems(columnId)
  const maxOrder = columnItems.length > 0
    ? Math.max(...columnItems.map((i) => i.order))
    : -1

  const newItem: KanbanItem = {
    id: crypto.randomUUID(),
    title,
    description: '',
    columnId,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
  }

  props.context.updateState(
    { items: [...items.value, newItem] },
    {
      captureHistory: true,
      historyLabel: `Added card: ${truncate(title, 20)} to ${columnName}`,
    }
  )

  newItemTitle.value = ''
  addingToColumn.value = null
}

function removeItem(itemId: string) {
  const item = items.value.find((i) => i.id === itemId)

  props.context.updateState(
    { items: items.value.filter((i) => i.id !== itemId) },
    {
      captureHistory: true,
      historyLabel: `Deleted card: ${truncate(item?.title, 25)}`,
    }
  )
}

// Data sharing - Board contract
useProvideData(props.context, kanbanContractV1, {
  project: (state): PublicKanbanBoard => {
    const cols = state.columns || []
    const itms = state.items || []

    return {
      widgetId: props.context.widgetId,
      title: state.title || 'Kanban',
      totalItems: itms.length,
      columns: cols.map((col) => {
        const count = itms.filter((i) => i.columnId === col.id).length
        return {
          id: col.id,
          title: col.title,
          itemCount: count,
          wipLimit: col.wipLimit,
          isOverLimit: col.wipLimit !== null && count > col.wipLimit,
        }
      }),
      items: itms.map(({ id, title, columnId }) => ({ id, title, columnId })),
    }
  },
})

// Data sharing - Stats contract
useProvideData(props.context, kanbanStatsContractV1, {
  project: (state): PublicKanbanStats => {
    const cols = [...(state.columns || [])].sort((a, b) => a.order - b.order)
    const itms = state.items || []
    const total = itms.length
    const lastCol = cols[cols.length - 1]
    const completed = lastCol ? itms.filter((i) => i.columnId === lastCol.id).length : 0

    return {
      widgetId: props.context.widgetId,
      totalItems: total,
      completedItems: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      columnStats: cols.map((col) => {
        const count = itms.filter((i) => i.columnId === col.id).length
        return {
          columnId: col.id,
          title: col.title,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      }),
    }
  },
})
</script>

<template>
  <div class="kanban h-full flex flex-col overflow-hidden">
    <!-- Header -->
    <div
      v-if="showCompletionRate"
      class="flex items-center justify-between px-3 py-2 border-b border-border"
    >
      <span class="text-xs text-muted-foreground">
        {{ completionStats.completed }}/{{ completionStats.total }} done
      </span>
      <span class="text-xs text-muted-foreground">
        {{ completionStats.rate }}%
      </span>
    </div>

    <!-- Columns -->
    <div class="flex-1 flex gap-2 p-2 overflow-x-auto">
      <div
        v-for="column in columns"
        :key="column.id"
        class="flex-shrink-0 w-48 flex flex-col rounded-lg bg-muted/50"
        :class="{ 'ring-2 ring-primary': dragOverColumnId === column.id }"
        @dragover="handleDragOver($event, column.id)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, column.id)"
      >
        <!-- Column header -->
        <div class="flex items-center justify-between px-2 py-1.5">
          <div class="flex items-center gap-1.5">
            <div
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: column.color }"
            />
            <span class="text-xs font-medium text-foreground">{{ column.title }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span
              v-if="showItemCount"
              class="text-xs text-muted-foreground"
              :class="{ 'text-destructive': isOverWipLimit(column) }"
            >
              {{ getColumnItemCount(column.id) }}
              <template v-if="showWipLimits && column.wipLimit !== null">
                /{{ column.wipLimit }}
              </template>
            </span>
          </div>
        </div>

        <!-- Items -->
        <div class="flex-1 overflow-y-auto px-1.5 pb-1.5 space-y-1.5">
          <div
            v-for="item in getColumnItems(column.id)"
            :key="item.id"
            class="group bg-card rounded-md px-2 py-1.5 cursor-grab active:cursor-grabbing border border-border hover:border-primary/50 transition-colors"
            :class="{ 'opacity-50': draggedItemId === item.id }"
            draggable="true"
            @dragstart="handleDragStart($event, item.id)"
            @dragend="handleDragEnd"
          >
            <div class="flex items-start justify-between gap-1">
              <span class="text-xs text-foreground line-clamp-2">{{ item.title }}</span>
              <button
                class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5"
                @click.stop="removeItem(item.id)"
              >
                <BkIcon icon="x" :size="12" />
              </button>
            </div>
          </div>

          <!-- Add item form -->
          <div v-if="addingToColumn === column.id" class="space-y-1">
            <BkInput
              v-model="newItemTitle"
              placeholder="Card title..."
              size="sm"
              class="text-xs"
              @keyup.enter="addItem(column.id)"
              @keyup.escape="addingToColumn = null"
            />
            <div class="flex gap-1">
              <BkButton size="sm" class="flex-1 text-xs h-6" @click="addItem(column.id)">
                Add
              </BkButton>
              <BkButton
                variant="ghost"
                size="sm"
                class="text-xs h-6"
                @click="addingToColumn = null"
              >
                Cancel
              </BkButton>
            </div>
          </div>

          <!-- Add button -->
          <button
            v-else
            class="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 rounded hover:bg-muted transition-colors"
            @click="addingToColumn = column.id"
          >
            <BkIcon icon="plus" :size="12" />
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
