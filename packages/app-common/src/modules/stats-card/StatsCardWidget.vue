<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import {
  useConsumeData,
  useModuleConfiguration,
  todoContractV1,
  counterContractV1,
  habitsStatsContractV1,
  kanbanStatsContractV1,
  timerHistoryContractV1,
} from '@boardkit/core'
import type {
  PublicTodoList,
  PublicCounter,
  PublicHabitStats,
  PublicKanbanStats,
  PublicTimerHistory,
} from '@boardkit/core'
import { BkIcon, BkSetupRequired } from '@boardkit/ui'
import type { StatsCardState, StatMetricConfig, LayoutMode } from './types'

interface Props {
  context: ModuleContext<StatsCardState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'open-settings': [options?: { tab?: string }]
}>()

// Configuration check
const { setupMessage, setupIcon } = useModuleConfiguration(props.context)

function handleConfigure() {
  emit('open-settings', { tab: 'configure' })
}

// Consume data from all contract types (needed to resolve metric values)
const { allData: todoData } =
  useConsumeData<StatsCardState, PublicTodoList>(props.context, todoContractV1, {
    multi: true,
    stateKey: 'connectedTodoProviders',
  })

const { allData: counterData } =
  useConsumeData<StatsCardState, PublicCounter>(props.context, counterContractV1, {
    multi: true,
    stateKey: 'connectedCounterProviders',
  })

const { allData: habitsData } =
  useConsumeData<StatsCardState, PublicHabitStats>(props.context, habitsStatsContractV1, {
    multi: true,
    stateKey: 'connectedHabitProviders',
  })

const { allData: kanbanData } =
  useConsumeData<StatsCardState, PublicKanbanStats>(props.context, kanbanStatsContractV1, {
    multi: true,
    stateKey: 'connectedKanbanProviders',
  })

const { allData: timerData } =
  useConsumeData<StatsCardState, PublicTimerHistory>(props.context, timerHistoryContractV1, {
    multi: true,
    stateKey: 'connectedTimerProviders',
  })

// Computed
const metrics = computed(() => props.context.state.metrics || [])
const layout = computed(() => props.context.state.layout)
const showIcons = computed(() => props.context.state.showIcons)
const showLabels = computed(() => props.context.state.showLabels)

const layoutClass = computed(() => {
  const layouts: Record<LayoutMode, string> = {
    '1x1': 'grid-cols-1',
    '2x1': 'grid-cols-2',
    '1x4': 'grid-cols-1',
    '2x2': 'grid-cols-2',
  }
  return layouts[layout.value]
})

// Aggregate all data for metric resolution
const allSourceData = computed(() => ({
  todo: todoData.value,
  counter: counterData.value,
  habits: habitsData.value,
  kanban: kanbanData.value,
  timer: timerData.value,
}))

// Resolve metric value from source data
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) return null
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

function resolveMetricValue(metric: StatMetricConfig): number | string | null {
  const sourceDataList = allSourceData.value[metric.sourceType] as unknown[]
  if (!sourceDataList || sourceDataList.length === 0) return null

  const source = sourceDataList.find(
    (d) => (d as { widgetId: string }).widgetId === metric.sourceWidgetId
  )
  if (!source) return null

  const value = getNestedValue(source, metric.metricKey)
  return value as number | string | null
}

function formatValue(value: number | string | null, format: string): string {
  if (value === null || value === undefined) return '-'

  switch (format) {
    case 'percent':
      return `${value}%`
    case 'duration': {
      const seconds = Number(value)
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    }
    case 'number':
    default:
      return String(value)
  }
}
</script>

<template>
  <div class="stats-card h-full flex flex-col p-3 gap-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-foreground">{{ context.state.title || 'Stats' }}</span>
    </div>

    <!-- Metrics grid -->
    <div
      v-if="metrics.length > 0"
      class="flex-1 grid gap-2"
      :class="layoutClass"
    >
      <div
        v-for="metric in metrics"
        :key="metric.id"
        class="bg-muted/50 rounded-lg p-3 flex flex-col items-center justify-center"
      >
        <BkIcon
          v-if="showIcons"
          :icon="metric.icon"
          :size="16"
          class="text-muted-foreground mb-1"
        />

        <span class="text-xl font-bold text-foreground">
          {{ formatValue(resolveMetricValue(metric), metric.format) }}
        </span>

        <span
          v-if="showLabels"
          class="text-xs text-muted-foreground"
        >
          {{ metric.label }}
        </span>
      </div>
    </div>

    <!-- Empty state - Setup Required -->
    <BkSetupRequired
      v-else
      :icon="setupIcon"
      :message="setupMessage"
      @configure="handleConfigure"
    />
  </div>
</template>
