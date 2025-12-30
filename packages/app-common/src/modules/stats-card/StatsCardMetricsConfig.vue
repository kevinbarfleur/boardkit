<script setup lang="ts">
/**
 * StatsCardMetricsConfig
 *
 * Custom configuration component for Stats Card.
 * Provides a multi-step flow for adding metrics from various data sources.
 */
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
import type { StatsCardState, StatMetricConfig, StatSourceType } from './types'
import { metricTemplates } from './types'

interface Props {
  context: ModuleContext<StatsCardState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [key: string, value: unknown]
}>()

// Local state
const selectedSourceType = ref<StatSourceType>('todo')

// Consume data from all contract types
const { availableProviders: todoProviders, connect: connectTodo } =
  useConsumeData<StatsCardState, PublicTodoList>(props.context, todoContractV1, {
    multi: true,
    stateKey: 'connectedTodoProviders',
  })

const { availableProviders: counterProviders, connect: connectCounter } =
  useConsumeData<StatsCardState, PublicCounter>(props.context, counterContractV1, {
    multi: true,
    stateKey: 'connectedCounterProviders',
  })

const { availableProviders: habitsProviders, connect: connectHabits } =
  useConsumeData<StatsCardState, PublicHabitStats>(props.context, habitsStatsContractV1, {
    multi: true,
    stateKey: 'connectedHabitProviders',
  })

const { availableProviders: kanbanProviders, connect: connectKanban } =
  useConsumeData<StatsCardState, PublicKanbanStats>(props.context, kanbanStatsContractV1, {
    multi: true,
    stateKey: 'connectedKanbanProviders',
  })

const { availableProviders: timerProviders, connect: connectTimer } =
  useConsumeData<StatsCardState, PublicTimerHistory>(props.context, timerHistoryContractV1, {
    multi: true,
    stateKey: 'connectedTimerProviders',
  })

// Computed
const metrics = computed(() => props.context.state.metrics || [])

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

const sourceTypeOptions = [
  { value: 'todo', label: 'Todo Lists' },
  { value: 'counter', label: 'Counters' },
  { value: 'habits', label: 'Habits' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'timer', label: 'Timer' },
]

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

  emit('update', 'metrics', [...metrics.value, newMetric])
}

function removeMetric(metricId: string) {
  emit('update', 'metrics', metrics.value.filter((m) => m.id !== metricId))
}

// Get source label for a metric
function getSourceLabel(metric: StatMetricConfig): string {
  const sourceLabels: Record<StatSourceType, string> = {
    todo: 'Todo',
    counter: 'Counter',
    habits: 'Habits',
    kanban: 'Kanban',
    timer: 'Timer',
  }
  return `${sourceLabels[metric.sourceType]}: ${metric.sourceWidgetId.slice(0, 8)}`
}
</script>

<template>
  <div class="stats-card-config space-y-4">
    <!-- Current Metrics -->
    <div v-if="metrics.length > 0" class="space-y-2">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Configured Metrics
      </div>
      <div class="space-y-1">
        <div
          v-for="metric in metrics"
          :key="metric.id"
          class="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
        >
          <div class="flex items-center gap-2">
            <BkIcon :icon="metric.icon" :size="14" class="text-muted-foreground" />
            <div>
              <div class="text-sm font-medium text-foreground">{{ metric.label }}</div>
              <div class="text-xs text-muted-foreground">{{ getSourceLabel(metric) }}</div>
            </div>
          </div>
          <BkButton
            variant="ghost"
            size="sm"
            @click="removeMetric(metric.id)"
          >
            <BkIcon icon="x" :size="14" class="text-muted-foreground hover:text-destructive" />
          </BkButton>
        </div>
      </div>
    </div>

    <!-- Add Metric Section -->
    <div class="space-y-3">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Add Metric
      </div>

      <!-- Source Type Selector -->
      <BkSelect
        v-model="selectedSourceType"
        :options="sourceTypeOptions"
        size="sm"
      />

      <!-- Available Providers -->
      <div v-if="filteredProviders.length > 0" class="space-y-2">
        <div
          v-for="provider in filteredProviders"
          :key="provider.id"
          class="p-2 border border-border rounded-lg"
        >
          <div class="text-sm font-medium text-foreground mb-2">{{ provider.label }}</div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="template in metricTemplates[selectedSourceType]"
              :key="template.key"
              class="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs transition-colors"
              @click="addMetric(provider.id, selectedSourceType, template.key)"
            >
              <span class="flex items-center gap-1">
                <BkIcon :icon="template.icon" :size="12" />
                {{ template.label }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
        <BkIcon icon="inbox" :size="24" class="mx-auto mb-2 opacity-50" />
        <p>No {{ selectedSourceType }} widgets on board</p>
        <p class="text-xs mt-1">Add a widget to the canvas first</p>
      </div>
    </div>
  </div>
</template>
