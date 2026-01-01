<script setup lang="ts">
/**
 * BkConfiguredItemsList
 *
 * Displays a list of configured items with the ability to reorder and remove.
 * Used for displaying metrics, connections, or any other configured items.
 */
import { ref, computed } from 'vue'
import BkIcon from './BkIcon.vue'
import BkButton from './BkButton.vue'
import BkFormSection from './BkFormSection.vue'

export interface ConfiguredItem {
  /** Unique identifier */
  id: string
  /** Main label */
  label: string
  /** Secondary text (metadata) */
  meta?: string
  /** Icon name */
  icon?: string
}

interface Props {
  /** Section title */
  title?: string
  /** Section icon */
  icon?: string
  /** List of items */
  items: ConfiguredItem[]
  /** Whether items can be reordered via drag-drop */
  draggable?: boolean
  /** Button label for adding items */
  addButtonLabel?: string
  /** Empty state text */
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Configured Items',
  icon: 'list',
  draggable: false,
  addButtonLabel: 'Add Item',
  emptyText: 'No items configured',
})

const emit = defineEmits<{
  remove: [itemId: string]
  reorder: [items: ConfiguredItem[]]
  add: []
}>()

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function handleDragStart(index: number, event: DragEvent) {
  if (!props.draggable) return
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function handleDragOver(index: number, event: DragEvent) {
  if (!props.draggable || draggedIndex.value === null) return
  event.preventDefault()
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(targetIndex: number, event: DragEvent) {
  if (!props.draggable || draggedIndex.value === null) return
  event.preventDefault()

  const fromIndex = draggedIndex.value
  const toIndex = targetIndex

  if (fromIndex !== toIndex) {
    const newItems = [...props.items]
    const [removed] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, removed)
    emit('reorder', newItems)
  }

  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}

function getItemIcon(item: ConfiguredItem): string {
  return item.icon || 'circle'
}
</script>

<template>
  <BkFormSection :title="title" no-dividers>
    <template #title>
      <span class="flex items-center gap-1.5">
        <BkIcon v-if="icon" :icon="icon" :size="12" />
        {{ title }}
        <span v-if="items.length > 0" class="text-muted-foreground">
          ({{ items.length }})
        </span>
      </span>
    </template>

    <div class="p-3 space-y-3">
      <!-- Empty state -->
      <div v-if="items.length === 0" class="py-4 text-center">
        <BkIcon icon="inbox" :size="24" class="mx-auto mb-2 text-muted-foreground" />
        <p class="text-xs text-muted-foreground">{{ emptyText }}</p>
      </div>

      <!-- Items list -->
      <div v-else class="space-y-1">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="flex items-center gap-2 p-2 rounded-md bg-muted/50 group transition-all"
          :class="[
            draggable ? 'cursor-grab active:cursor-grabbing' : '',
            dragOverIndex === index ? 'ring-2 ring-primary ring-offset-1' : '',
            draggedIndex === index ? 'opacity-50' : '',
          ]"
          :draggable="draggable"
          @dragstart="handleDragStart(index, $event)"
          @dragover="handleDragOver(index, $event)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(index, $event)"
          @dragend="handleDragEnd"
        >
          <!-- Drag handle -->
          <div
            v-if="draggable"
            class="shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground"
          >
            <BkIcon icon="grip-vertical" :size="14" />
          </div>

          <!-- Icon -->
          <div
            class="shrink-0 w-6 h-6 rounded flex items-center justify-center bg-background"
          >
            <BkIcon :icon="getItemIcon(item)" :size="12" class="text-muted-foreground" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="text-sm text-foreground truncate">
              {{ item.label }}
            </div>
            <div v-if="item.meta" class="text-xs text-muted-foreground truncate">
              {{ item.meta }}
            </div>
          </div>

          <!-- Remove button -->
          <button
            type="button"
            class="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
            title="Remove"
            @click="emit('remove', item.id)"
          >
            <BkIcon icon="x" :size="14" />
          </button>
        </div>
      </div>

      <!-- Drag hint -->
      <p v-if="draggable && items.length > 1" class="text-xs text-muted-foreground/70 text-center">
        Drag to reorder
      </p>

      <!-- Add button -->
      <BkButton
        variant="outline"
        size="sm"
        class="w-full"
        @click="emit('add')"
      >
        <BkIcon icon="plus" :size="14" class="mr-1.5" />
        {{ addButtonLabel }}
      </BkButton>
    </div>
  </BkFormSection>
</template>
