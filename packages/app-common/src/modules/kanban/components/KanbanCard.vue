<script setup lang="ts">
import { computed } from 'vue'
import { BkIcon } from '@boardkit/ui'
import type { KanbanItem } from '../types'
import { getTagColor } from '../types'

interface Props {
  item: KanbanItem
  isDragging?: boolean
  isDragOver?: boolean
  dropPosition?: 'before' | 'after' | null
  showDueDate?: boolean
  showPriority?: boolean
  showTags?: boolean
  showChecklist?: boolean
  compactMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  isDragOver: false,
  dropPosition: null,
  showDueDate: true,
  showPriority: true,
  showTags: true,
  showChecklist: true,
  compactMode: false,
})

const emit = defineEmits<{
  delete: [itemId: string]
  click: [item: KanbanItem]
  contextmenu: [item: KanbanItem, e: MouseEvent]
  dragstart: [e: DragEvent, itemId: string]
  dragover: [e: DragEvent, itemId: string]
  dragend: []
}>()

// Checklist progress
const checklistProgress = computed(() => {
  if (!props.item.checklist?.length) return null
  const done = props.item.checklist.filter((c) => c.completed).length
  const total = props.item.checklist.length
  return { done, total }
})

// Due date status
const dueDateStatus = computed(() => {
  if (!props.item.dueDate) return null
  const due = new Date(props.item.dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 3) return 'soon'
  return 'normal'
})

// Format due date for display
const formattedDueDate = computed(() => {
  if (!props.item.dueDate) return null
  const date = new Date(props.item.dueDate)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

// Priority color
const priorityColor = computed(() => {
  switch (props.item.priority) {
    case 'high': return '#ef4444'
    case 'medium': return '#f59e0b'
    case 'low': return '#3b82f6'
    default: return null
  }
})

// Visible tags (limit to 4)
const visibleTags = computed(() => {
  const tags = props.item.tags || []
  return tags.slice(0, 4)
})

const hiddenTagsCount = computed(() => {
  const tags = props.item.tags || []
  return Math.max(0, tags.length - 4)
})

function handleDragStart(e: DragEvent) {
  emit('dragstart', e, props.item.id)
}

function handleDragOver(e: DragEvent) {
  emit('dragover', e, props.item.id)
}

function handleDragEnd() {
  emit('dragend')
}

function handleClick() {
  emit('click', props.item)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.item.id)
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation() // Prevent column context menu
  emit('contextmenu', props.item, e)
}
</script>

<template>
  <div
    class="kanban-card group relative bg-card rounded-lg border border-border transition-all cursor-pointer shadow-sm hover:shadow-md"
    :class="{
      'opacity-50': isDragging,
      'cursor-grab active:cursor-grabbing': !isDragging,
      'hover:border-primary/50': !isDragging,
      'py-1.5 px-2.5': compactMode,
      'py-2 px-3': !compactMode,
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @dragend="handleDragEnd"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Drop indicator -->
    <div
      v-if="isDragOver && dropPosition === 'before'"
      class="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full"
    />
    <div
      v-if="isDragOver && dropPosition === 'after'"
      class="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
    />

    <!-- Priority indicator (left edge) -->
    <div
      v-if="showPriority && priorityColor"
      class="absolute inset-y-0 left-0 w-1 rounded-l-lg"
      :style="{ backgroundColor: priorityColor }"
    />

    <!-- Content -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <span
          class="text-sm font-medium text-foreground line-clamp-2 leading-snug"
          :class="{ 'line-clamp-1': compactMode }"
        >
          {{ item.title }}
        </span>

        <!-- Description preview (non-compact mode only) -->
        <p
          v-if="!compactMode && item.description"
          class="text-[11px] text-muted-foreground line-clamp-1 mt-0.5"
        >
          {{ item.description }}
        </p>

        <!-- Tags -->
        <div
          v-if="showTags && visibleTags.length > 0"
          class="flex flex-wrap gap-1 mt-1.5"
        >
          <span
            v-for="tag in visibleTags"
            :key="tag"
            class="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md"
            :style="{
              backgroundColor: getTagColor(tag) + '20',
              color: getTagColor(tag),
              border: `1px solid ${getTagColor(tag)}30`
            }"
          >
            {{ tag }}
          </span>
          <span
            v-if="hiddenTagsCount > 0"
            class="inline-block px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            +{{ hiddenTagsCount }}
          </span>
        </div>

        <!-- Metadata row -->
        <div
          v-if="(showDueDate && item.dueDate) || (showChecklist && checklistProgress)"
          class="flex items-center gap-2 mt-1.5"
        >
          <!-- Due date -->
          <span
            v-if="showDueDate && item.dueDate"
            class="flex items-center gap-1 text-[10px] font-medium"
            :class="{
              'text-destructive': dueDateStatus === 'overdue',
              'text-amber-500': dueDateStatus === 'today' || dueDateStatus === 'soon',
              'text-muted-foreground': dueDateStatus === 'normal',
            }"
          >
            <BkIcon icon="calendar" :size="10" />
            {{ formattedDueDate }}
          </span>

          <!-- Checklist progress -->
          <span
            v-if="showChecklist && checklistProgress"
            class="flex items-center gap-1 text-[10px] font-medium"
            :class="{
              'text-emerald-500': checklistProgress.done === checklistProgress.total,
              'text-muted-foreground': checklistProgress.done !== checklistProgress.total,
            }"
          >
            <BkIcon icon="check-square" :size="10" />
            {{ checklistProgress.done }}/{{ checklistProgress.total }}
          </span>
        </div>
      </div>

      <!-- Delete button -->
      <button
        class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 -mr-1 -mt-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
        @click="handleDelete"
      >
        <BkIcon icon="trash-2" :size="12" />
      </button>
    </div>
  </div>
</template>
