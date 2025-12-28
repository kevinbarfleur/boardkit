<script setup lang="ts">
import { ref } from 'vue'
import BkIcon from './BkIcon.vue'

export interface HistoryItem {
  id: string
  action: string
  timestamp: number
}

interface Props {
  items: HistoryItem[]
  title?: string
  emptyIcon?: string
  emptyText?: string
  maxItems?: number
  minWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'History',
  emptyIcon: 'check',
  emptyText: 'Up to date',
  maxItems: 20,
  minWidth: 240,
})

const emit = defineEmits<{
  select: [id: string]
}>()

const selectedIndex = ref(-1)

const displayItems = () => {
  return props.items.slice(0, props.maxItems)
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins}m ago`
  }

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleSelect = (id: string) => {
  emit('select', id)
}

const handleMouseEnter = (index: number) => {
  selectedIndex.value = index
}

const handleMouseLeave = () => {
  selectedIndex.value = -1
}
</script>

<template>
  <div
    class="rounded-lg border border-border bg-popover shadow-lg max-h-80 overflow-hidden flex flex-col"
    :style="{ minWidth: `${minWidth}px` }"
  >
    <!-- Header -->
    <div class="px-3 py-2 border-b border-border shrink-0">
      <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {{ title }}
      </span>
    </div>

    <!-- Items -->
    <div class="py-1.5 overflow-auto flex-1">
      <template v-if="items.length > 0">
        <button
          v-for="(item, index) in displayItems()"
          :key="item.id"
          class="w-full mx-1.5 px-2.5 py-2 text-left rounded-md flex flex-col gap-0.5 transition-colors"
          :class="[
            index === selectedIndex
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          ]"
          :style="{ width: 'calc(100% - 12px)' }"
          @click="handleSelect(item.id)"
          @mouseenter="handleMouseEnter(index)"
          @mouseleave="handleMouseLeave"
        >
          <span class="text-sm text-foreground truncate">{{ item.action }}</span>
          <span class="text-xs text-muted-foreground">{{ formatTimestamp(item.timestamp) }}</span>
        </button>
      </template>

      <!-- Empty state -->
      <div
        v-else
        class="px-3 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <BkIcon :icon="emptyIcon" :size="16" class="text-green-500" />
        <span>{{ emptyText }}</span>
      </div>
    </div>
  </div>
</template>
