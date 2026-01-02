<script setup lang="ts">
import { ref, computed } from 'vue'
import BkIcon from './BkIcon.vue'

export interface HistoryItem {
  id: string
  /** Description of the action - supports both 'label' and 'action' for backwards compatibility */
  label?: string
  action?: string
  timestamp: number
}

interface HistoryGroup {
  label: string
  items: HistoryItem[]
  isExpanded: boolean
}

/** Helper to get the label from an item (supports both 'label' and 'action' properties) */
function getItemLabel(item: HistoryItem): string {
  return item.label ?? item.action ?? 'Unknown action'
}

interface Props {
  items: HistoryItem[]
  title?: string
  emptyIcon?: string
  emptyText?: string
  maxItems?: number
  minWidth?: number
  showGoToLatest?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'History',
  emptyIcon: 'check',
  emptyText: 'Up to date',
  maxItems: 50,
  minWidth: 260,
  showGoToLatest: false,
})

const emit = defineEmits<{
  select: [id: string]
  goToLatest: []
}>()

// Track which groups are expanded
const expandedGroups = ref<Set<number>>(new Set())

// Group consecutive items with the same label
const groupedItems = computed<HistoryGroup[]>(() => {
  const limited = props.items.slice(0, props.maxItems)
  const groups: HistoryGroup[] = []

  for (const item of limited) {
    const lastGroup = groups[groups.length - 1]
    const itemLabel = getItemLabel(item)

    if (lastGroup && lastGroup.label === itemLabel) {
      lastGroup.items.push(item)
    } else {
      groups.push({
        label: itemLabel,
        items: [item],
        isExpanded: false,
      })
    }
  }

  return groups
})

const toggleGroup = (index: number) => {
  if (expandedGroups.value.has(index)) {
    expandedGroups.value.delete(index)
  } else {
    expandedGroups.value.add(index)
  }
  // Trigger reactivity
  expandedGroups.value = new Set(expandedGroups.value)
}

const isGroupExpanded = (index: number) => expandedGroups.value.has(index)

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
</script>

<template>
  <div
    class="rounded-lg border border-border bg-popover shadow-lg max-h-80 overflow-hidden flex flex-col"
    :style="{ minWidth: `${minWidth}px` }"
  >
    <!-- Header -->
    <div class="px-3 py-2 border-b border-border shrink-0 flex items-center justify-between gap-2">
      <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {{ title }}
      </span>
      <button
        v-if="showGoToLatest && items.length > 0"
        class="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        @click="emit('goToLatest')"
      >
        Go to latest
      </button>
    </div>

    <!-- Items -->
    <div class="py-1.5 overflow-auto flex-1">
      <template v-if="groupedItems.length > 0">
        <template v-for="(group, groupIndex) in groupedItems" :key="groupIndex">
          <!-- Single item (no grouping needed) -->
          <button
            v-if="group.items.length === 1"
            class="w-full mx-1.5 px-2.5 py-2 text-left rounded-md flex flex-col gap-0.5 bg-transparent transition-colors hover:bg-accent"
            :style="{ width: 'calc(100% - 12px)' }"
            @click="handleSelect(group.items[0].id)"
          >
            <span class="text-sm text-foreground truncate">{{ group.label }}</span>
            <span class="text-xs text-muted-foreground">{{ formatTimestamp(group.items[0].timestamp) }}</span>
          </button>

          <!-- Group header (multiple items) -->
          <template v-else>
            <button
              class="w-full mx-1.5 px-2.5 py-2 text-left rounded-md flex items-center gap-2 bg-transparent transition-colors hover:bg-accent"
              :style="{ width: 'calc(100% - 12px)' }"
              @click="toggleGroup(groupIndex)"
            >
              <BkIcon
                :icon="isGroupExpanded(groupIndex) ? 'chevron-down' : 'chevron-right'"
                :size="14"
                class="text-muted-foreground shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-foreground truncate">{{ group.label }}</span>
                  <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                    {{ group.items.length }}
                  </span>
                </div>
                <span class="text-xs text-muted-foreground">{{ formatTimestamp(group.items[0].timestamp) }}</span>
              </div>
            </button>

            <!-- Expanded group items -->
            <div v-if="isGroupExpanded(groupIndex)" class="ml-4 border-l border-border">
              <button
                v-for="item in group.items"
                :key="item.id"
                class="w-full mx-1.5 pl-3 pr-2.5 py-1.5 text-left rounded-md flex flex-col gap-0.5 bg-transparent transition-colors hover:bg-accent"
                :style="{ width: 'calc(100% - 12px)' }"
                @click="handleSelect(item.id)"
              >
                <span class="text-sm text-foreground truncate">{{ group.label }}</span>
                <span class="text-xs text-muted-foreground">{{ formatTimestamp(item.timestamp) }}</span>
              </button>
            </div>
          </template>
        </template>
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
