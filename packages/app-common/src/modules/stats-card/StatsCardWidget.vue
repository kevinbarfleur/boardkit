<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import {
  useConsumeData,
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
import { BkButton, BkIcon, BkSelect } from '@boardkit/ui'
import type { StatsCardState, StatMetricConfig, StatSourceType, LayoutMode } from './types'
import { metricTemplates } from './types'

interface Props {
  context: ModuleContext<StatsCardState>
}

const props = defineProps<Props>()

// Local state
const isConfiguring = ref(false)
const selectedSourceType = ref<StatSourceType>('todo')

// Consume data from all contract types
const { allData: todoData, availableProviders: todoProviders, connect: connectTodo, disconnect: disconnectTodo } =
  useConsumeData<StatsCardState, PublicTodoList>(props.context, todoContractV1, {
    multi: true,
    stateKey: 'connectedTodoProviders',
  })

const { allData: counterData, availableProviders: counterProviders, connect: connectCounter, disconnect: disconnectCounter } =
  useConsumeData<StatsCardState, PublicCounter>(props.context, counterContractV1, {
    multi: true,
    stateKey: 'connectedCounterProviders',
  })

const { allData: habitsData, availableProviders: habitsProviders, connect: connectHabits, disconnect: disconnectHabits } =
  useConsumeData<StatsCardState, PublicHabitStats>(props.context, habitsStatsContractV1, {
    multi: true,
    stateKey: 'connectedHabitProviders',
  })

const { allData: kanbanData, availableProviders: kanbanProviders, connect: connectKanban, disconnect: disconnectKanban } =
  useConsumeData<StatsCardState, PublicKanbanStats>(props.context, kanbanStatsContractV1, {
    multi: true,
    stateKey: 'connectedKanbanProviders',
  })

const { allData: timerData, availableProviders: timerProviders, connect: connectTimer, disconnect: disconnectTimer } =
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

// Get all available providers across all types
const allProviders = computed(() => {
  const providers: Array<{ id: string; type: StatSourceType; label: string }> = []

  todoProviders.value.forEach((p) => {
    providers.push({ id: p.id, type: 'todo', label: `Todo: ${p.id.slice(0, 8)}` })
  })
  counterProviders.value.forEach((p) => {
    providers.push({ id: p.id, type: 'counter', label: `Counter: ${p.id.slice(0, 8)}` })
  })
  habitsProviders.value.forEach((p) => {
    providers.push({ id: p.id, type: 'habits', label: `Habits: ${p.id.slice(0, 8)}` })
  })
  kanbanProviders.value.forEach((p) => {
    providers.push({ id: p.id, type: 'kanban', label: `Kanban: ${p.id.slice(0, 8)}` })
  })
  timerProviders.value.forEach((p) => {
    providers.push({ id: p.id, type: 'timer', label: `Timer: ${p.id.slice(0, 8)}` })
  })

  return providers
})

const filteredProviders = computed(() =>
  allProviders.value.filter((p) => p.type === selectedSourceType.value)
)

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

// Actions
function connectProvider(providerId: string, type: StatSourceType) {
  switch (type) {
    case 'todo':
      connectTodo(providerId)
      break
    case 'counter':
      connectCounter(providerId)
      break
    case 'habits':
      connectHabits(providerId)
      break
    case 'kanban':
      connectKanban(providerId)
      break
    case 'timer':
      connectTimer(providerId)
      break
  }
}

function addMetric(providerId: string, type: StatSourceType, metricKey: string) {
  const template = metricTemplates[type].find((t) => t.key === metricKey)
  if (!template) return

  // Ensure provider is connected
  connectProvider(providerId, type)

  const newMetric: StatMetricConfig = {
    id: crypto.randomUUID(),
    sourceType: type,
    sourceWidgetId: providerId,
    metricKey,
    label: template.label,
    format: template.format,
    icon: template.icon,
  }

  props.context.updateState({
    metrics: [...metrics.value, newMetric],
  })
}

function removeMetric(metricId: string) {
  props.context.updateState({
    metrics: metrics.value.filter((m) => m.id !== metricId),
  })
}

const sourceTypeOptions = [
  { value: 'todo', label: 'Todo Lists' },
  { value: 'counter', label: 'Counters' },
  { value: 'habits', label: 'Habits' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'timer', label: 'Timer' },
]
</script>

<template>
  <div class="stats-card h-full flex flex-col p-3 gap-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-foreground">{{ context.state.title || 'Stats' }}</span>
      <BkButton
        variant="ghost"
        size="sm"
        @click="isConfiguring = !isConfiguring"
      >
        <BkIcon :icon="isConfiguring ? 'x' : 'settings'" :size="14" />
      </BkButton>
    </div>

    <!-- Configuration panel -->
    <div v-if="isConfiguring" class="space-y-2 p-2 bg-muted rounded-lg">
      <div class="flex gap-2">
        <BkSelect
          v-model="selectedSourceType"
          :options="sourceTypeOptions"
          size="sm"
          class="flex-1"
        />
      </div>

      <div v-if="filteredProviders.length > 0" class="space-y-1">
        <div class="text-xs text-muted-foreground">Available sources:</div>
        <div
          v-for="provider in filteredProviders"
          :key="provider.id"
          class="text-xs"
        >
          <div class="font-medium text-foreground mb-1">{{ provider.label }}</div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="template in metricTemplates[selectedSourceType]"
              :key="template.key"
              class="px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs"
              @click="addMetric(provider.id, selectedSourceType, template.key)"
            >
              + {{ template.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-xs text-muted-foreground text-center py-2">
        No {{ selectedSourceType }} widgets on board
      </div>
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
        class="bg-muted/50 rounded-lg p-3 flex flex-col items-center justify-center relative group"
      >
        <button
          class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          @click="removeMetric(metric.id)"
        >
          <BkIcon icon="x" :size="12" />
        </button>

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

    <!-- Empty state -->
    <div
      v-else
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <BkIcon icon="bar-chart-2" :size="24" class="text-muted-foreground mx-auto mb-2" />
        <div class="text-sm text-muted-foreground">No metrics configured</div>
        <BkButton
          variant="ghost"
          size="sm"
          class="mt-2"
          @click="isConfiguring = true"
        >
          Add metrics
        </BkButton>
      </div>
    </div>
  </div>
</template>
