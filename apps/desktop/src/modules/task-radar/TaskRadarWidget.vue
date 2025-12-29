<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useConsumeData, todoContractV1, type PublicTodoList } from '@boardkit/core'
import { BkIcon } from '@boardkit/ui'
import type { TaskRadarState } from './types'
import { defaultTaskRadarSettings } from './types'

interface Props {
  context: ModuleContext<TaskRadarState>
}

const props = defineProps<Props>()

// Settings with defaults
const showEmptyLists = computed(
  () => props.context.state.showEmptyLists ?? defaultTaskRadarSettings.showEmptyLists
)
const groupBySource = computed(
  () => props.context.state.groupBySource ?? defaultTaskRadarSettings.groupBySource
)

// Use the multi-consumer composable - handles all subscription management automatically
const { connections: rawConnections, allData } = useConsumeData<TaskRadarState, PublicTodoList>(
  props.context,
  todoContractV1,
  { multi: true }
)

// Compute aggregate stats from all connected data
const stats = computed(() => {
  let totalTasks = 0
  let completedTasks = 0

  for (const data of allData.value) {
    totalTasks += data.progress.total
    completedTasks += data.progress.done
  }

  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    total: totalTasks,
    completed: completedTasks,
    pending: pendingTasks,
    completionRate,
  }
})

// Get connection status for each connected provider (filtered based on settings)
const connections = computed(() => {
  const all = Array.from(rawConnections.value.values()).map((conn) => ({
    providerId: conn.providerId,
    status: conn.status,
    data: conn.data,
  }))

  // Filter out empty lists if showEmptyLists is false
  if (!showEmptyLists.value) {
    return all.filter((c) => c.data && c.data.progress.total > 0)
  }

  return all
})

// Expose groupBySource for future detailed view implementation
// Currently the widget only has 'summary' mode, groupBySource will be used when detailed view is added
const _groupBySource = groupBySource
</script>

<template>
  <div class="task-radar h-full flex flex-col gap-3 p-2">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <BkIcon icon="radar" :size="16" class="text-primary" />
        <h3 class="font-semibold text-foreground">{{ context.state.title }}</h3>
      </div>
      <span class="text-xs text-muted-foreground">
        {{ connections.length }} source{{ connections.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Stats Summary -->
    <div v-if="stats.total > 0" class="space-y-2">
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-lg bg-muted p-2 text-center">
          <div class="text-lg font-bold text-foreground">{{ stats.total }}</div>
          <div class="text-xs text-muted-foreground">Total</div>
        </div>
        <div class="rounded-lg bg-green-500/10 p-2 text-center">
          <div class="text-lg font-bold text-green-600">{{ stats.completed }}</div>
          <div class="text-xs text-muted-foreground">Done</div>
        </div>
        <div class="rounded-lg bg-amber-500/10 p-2 text-center">
          <div class="text-lg font-bold text-amber-600">{{ stats.pending }}</div>
          <div class="text-xs text-muted-foreground">Pending</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="h-2 rounded-full bg-muted overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-300"
          :style="{ width: `${stats.completionRate}%` }"
        />
      </div>
      <div class="text-xs text-muted-foreground text-center">
        {{ stats.completionRate }}% complete
      </div>
    </div>

    <!-- Empty state when no providers connected -->
    <div
      v-if="connections.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center px-4"
    >
      <BkIcon icon="link" :size="32" class="text-muted-foreground mb-3" />
      <p class="text-sm text-muted-foreground mb-1">No data sources connected</p>
      <p class="text-xs text-muted-foreground/70">
        Right-click or use header menu to connect Todo lists
      </p>
    </div>

    <!-- Connected Sources (compact view when data is showing) -->
    <div v-if="connections.length > 0 && stats.total > 0" class="text-xs text-muted-foreground">
      <span class="font-medium">Sources:</span>
      {{ connections.map(c => c.data?.title || 'Todo List').join(', ') }}
    </div>
  </div>
</template>
