<script setup lang="ts">
import { ref, computed } from 'vue'
import { BkButton, BkIcon, BkInput, BkDropdown } from '@boardkit/ui'
import type { DropdownItem } from '@boardkit/ui'
import type { KanbanColumn as KanbanColumnType, KanbanItem } from '../types'
import KanbanCard from './KanbanCard.vue'

interface Props {
  column: KanbanColumnType
  items: KanbanItem[]
  showItemCount?: boolean
  showWipLimits?: boolean
  showDueDate?: boolean
  showPriority?: boolean
  showTags?: boolean
  showChecklist?: boolean
  compactMode?: boolean
  quickCardCreation?: boolean
  // Drag state
  draggedItemId?: string | null
  isDragOver?: boolean
  dragOverItemId?: string | null
  dropPosition?: 'before' | 'after' | null
}

const props = withDefaults(defineProps<Props>(), {
  showItemCount: true,
  showWipLimits: true,
  showDueDate: true,
  showPriority: true,
  showTags: true,
  showChecklist: true,
  compactMode: false,
  quickCardCreation: false,
  draggedItemId: null,
  isDragOver: false,
  dragOverItemId: null,
  dropPosition: null,
})

const emit = defineEmits<{
  addItem: [columnId: string, title: string]
  addItemFull: [columnId: string]
  deleteItem: [itemId: string]
  clickItem: [item: KanbanItem]
  contextmenuItem: [item: KanbanItem, e: MouseEvent]
  editColumn: [column: KanbanColumnType]
  deleteColumn: [columnId: string]
  contextmenuColumn: [column: KanbanColumnType, e: MouseEvent]
  // Drag events
  dragstart: [e: DragEvent, itemId: string]
  dragover: [e: DragEvent, columnId: string]
  dragoverItem: [e: DragEvent, itemId: string, columnId: string]
  dragleave: [e: DragEvent]
  drop: [e: DragEvent, columnId: string]
  dragend: []
}>()

// Column menu
const columnMenuItems: DropdownItem[] = [
  { id: 'edit', label: 'Edit column', icon: 'pencil' },
  { id: 'delete', label: 'Delete column', icon: 'trash-2', destructive: true },
]

function handleColumnMenuSelect(item: { id: string }) {
  if (item.id === 'edit') {
    emit('editColumn', props.column)
  } else if (item.id === 'delete') {
    emit('deleteColumn', props.column.id)
  }
}

// Local state
const isAddingItem = ref(false)
const newItemTitle = ref('')

// Computed
const isOverWipLimit = computed(() => {
  if (props.column.wipLimit === null) return false
  return props.items.length > props.column.wipLimit
})

const sortedItems = computed(() =>
  [...props.items].sort((a, b) => a.order - b.order)
)

// Handlers
function handleAddItem() {
  if (!newItemTitle.value.trim()) return
  emit('addItem', props.column.id, newItemTitle.value.trim())
  newItemTitle.value = ''
  isAddingItem.value = false
}

function handleCancelAdd() {
  newItemTitle.value = ''
  isAddingItem.value = false
}

function handleDragOver(e: DragEvent) {
  emit('dragover', e, props.column.id)
}

function handleDragOverItem(e: DragEvent, itemId: string) {
  emit('dragoverItem', e, itemId, props.column.id)
}

function handleDragLeave(e: DragEvent) {
  emit('dragleave', e)
}

function handleDrop(e: DragEvent) {
  emit('drop', e, props.column.id)
}

function handleColumnContextMenu(e: MouseEvent) {
  e.preventDefault()
  emit('contextmenuColumn', props.column, e)
}

function handleCardContextMenu(item: KanbanItem, e: MouseEvent) {
  emit('contextmenuItem', item, e)
}

function handleAddCardClick() {
  if (props.quickCardCreation) {
    isAddingItem.value = true
  } else {
    emit('addItemFull', props.column.id)
  }
}
</script>

<template>
  <div
    class="kanban-column flex-shrink-0 w-56 flex flex-col rounded-xl bg-muted/40 border border-border/50"
    :class="{ 'border-primary border-2': isDragOver && !dragOverItemId }"
    data-kanban-column
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @contextmenu="handleColumnContextMenu"
  >
    <!-- Column header -->
    <div
      class="group/header flex items-center justify-between px-3 py-2 border-b border-border/30"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="w-2.5 h-2.5 rounded-full flex-shrink-0 border-2"
          :style="{
            backgroundColor: column.color,
            borderColor: column.color + '40'
          }"
        />
        <span class="text-xs font-semibold text-foreground truncate">
          {{ column.title }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Item count / WIP limit -->
        <span
          v-if="showItemCount"
          class="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
          :class="{
            'bg-destructive/10 text-destructive': isOverWipLimit,
            'text-muted-foreground': !isOverWipLimit
          }"
        >
          {{ items.length }}
          <template v-if="showWipLimits && column.wipLimit !== null">
            /{{ column.wipLimit }}
          </template>
        </span>

        <!-- Column menu -->
        <BkDropdown
          :items="columnMenuItems"
          align="right"
          :min-width="180"
          @select="handleColumnMenuSelect"
        >
          <template #trigger>
            <button
              class="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors"
            >
              <BkIcon icon="more-horizontal" :size="14" />
            </button>
          </template>
        </BkDropdown>
      </div>
    </div>

    <!-- Items -->
    <div class="kanban-items flex-1 overflow-y-auto px-2 py-2 space-y-2">
      <KanbanCard
        v-for="item in sortedItems"
        :key="item.id"
        :item="item"
        :is-dragging="draggedItemId === item.id"
        :is-drag-over="dragOverItemId === item.id"
        :drop-position="dragOverItemId === item.id ? dropPosition : null"
        :show-due-date="showDueDate"
        :show-priority="showPriority"
        :show-tags="showTags"
        :show-checklist="showChecklist"
        :compact-mode="compactMode"
        @delete="emit('deleteItem', $event)"
        @click="emit('clickItem', $event)"
        @contextmenu="handleCardContextMenu"
        @dragstart="emit('dragstart', $event, item.id)"
        @dragover="handleDragOverItem($event, item.id)"
        @dragend="emit('dragend')"
      />

      <!-- Empty state -->
      <div
        v-if="sortedItems.length === 0 && !isAddingItem"
        class="flex flex-col items-center py-6 text-center"
      >
        <BkIcon icon="inbox" :size="20" class="text-muted-foreground/40 mb-1.5" />
        <span class="text-[11px] text-muted-foreground/60">No cards yet</span>
      </div>

      <!-- Add item form -->
      <div v-if="isAddingItem" class="space-y-1.5">
        <BkInput
          v-model="newItemTitle"
          placeholder="Card title..."
          size="sm"
          class="text-xs"
          autofocus
          @keyup.enter="handleAddItem"
          @keyup.escape="handleCancelAdd"
        />
        <div class="flex gap-1">
          <BkButton size="sm" class="flex-1 text-xs h-7" @click="handleAddItem">
            Add
          </BkButton>
          <BkButton
            variant="ghost"
            size="sm"
            class="text-xs h-7"
            @click="handleCancelAdd"
          >
            Cancel
          </BkButton>
        </div>
      </div>
    </div>

    <!-- Add button -->
    <button
      v-if="!isAddingItem"
      class="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 border-t border-border/30 hover:bg-muted/80 transition-colors rounded-b-xl"
      @click="handleAddCardClick"
    >
      <BkIcon icon="plus" :size="14" />
      Add card
    </button>
  </div>
</template>

<style scoped>
.kanban-items {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.kanban-items::-webkit-scrollbar {
  width: 4px;
}

.kanban-items::-webkit-scrollbar-track {
  background: transparent;
}

.kanban-items::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 2px;
}
</style>
