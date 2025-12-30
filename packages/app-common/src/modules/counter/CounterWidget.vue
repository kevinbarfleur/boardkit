<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useProvideData, counterContractV1 } from '@boardkit/core'
import { BkButton, BkIcon } from '@boardkit/ui'
import type { CounterState } from './types'
import type { PublicCounter } from '@boardkit/core'

interface Props {
  context: ModuleContext<CounterState>
}

const props = defineProps<Props>()

// Computed properties
const value = computed(() => props.context.state.value)
const target = computed(() => props.context.state.target)
const label = computed(() => props.context.state.label || 'Counter')
const unit = computed(() => props.context.state.unit)
const step = computed(() => props.context.state.step || 1)
const showProgress = computed(() => props.context.state.showProgress)
const minValue = computed(() => props.context.state.minValue)
const maxValue = computed(() => props.context.state.maxValue)

const progressPercent = computed(() => {
  if (target.value === null || target.value === 0) return null
  return Math.min(100, Math.round((value.value / target.value) * 100))
})

const isComplete = computed(() => {
  if (target.value === null) return false
  return value.value >= target.value
})

const canIncrement = computed(() => {
  if (maxValue.value === null) return true
  return value.value + step.value <= maxValue.value
})

const canDecrement = computed(() => {
  if (minValue.value === null) return true
  return value.value - step.value >= minValue.value
})

// Methods
function increment() {
  if (!canIncrement.value) return
  props.context.updateState({ value: value.value + step.value })
}

function decrement() {
  if (!canDecrement.value) return
  props.context.updateState({ value: value.value - step.value })
}

function reset() {
  props.context.updateState({ value: 0 })
}

// Daily reset check
function checkDailyReset() {
  if (!props.context.state.resetDaily) return

  const today = new Date().toISOString().split('T')[0]
  const lastReset = props.context.state.lastResetDate

  if (lastReset !== today) {
    props.context.updateState({
      value: 0,
      lastResetDate: today,
    })
  }
}

onMounted(() => {
  checkDailyReset()
})

// Data sharing
useProvideData(props.context, counterContractV1, {
  project: (state): PublicCounter => ({
    widgetId: props.context.widgetId,
    label: state.label || 'Counter',
    value: state.value,
    target: state.target,
    unit: state.unit,
    progressPercent: state.target ? Math.min(100, Math.round((state.value / state.target) * 100)) : null,
    isComplete: state.target !== null && state.value >= state.target,
  }),
})
</script>

<template>
  <div class="counter h-full flex flex-col items-center justify-center p-4 gap-3">
    <!-- Label -->
    <div class="text-sm text-muted-foreground font-medium">
      {{ label }}
    </div>

    <!-- Value display -->
    <div class="flex items-center gap-4">
      <BkButton
        variant="ghost"
        size="icon"
        :disabled="!canDecrement"
        @click="decrement"
      >
        <BkIcon icon="minus" :size="20" />
      </BkButton>

      <div class="text-center min-w-16">
        <span class="text-3xl font-bold text-foreground">{{ value }}</span>
        <span v-if="unit" class="text-sm text-muted-foreground ml-1">{{ unit }}</span>
      </div>

      <BkButton
        variant="ghost"
        size="icon"
        :disabled="!canIncrement"
        @click="increment"
      >
        <BkIcon icon="plus" :size="20" />
      </BkButton>
    </div>

    <!-- Progress bar -->
    <div
      v-if="showProgress && target !== null"
      class="w-full max-w-48"
    >
      <div class="h-2 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full transition-all duration-300"
          :class="isComplete ? 'bg-green-500' : 'bg-primary'"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div class="text-xs text-muted-foreground text-center mt-1">
        {{ value }} / {{ target }} {{ unit }}
        <span v-if="progressPercent !== null">({{ progressPercent }}%)</span>
      </div>
    </div>

    <!-- Reset button -->
    <BkButton
      v-if="value > 0"
      variant="ghost"
      size="sm"
      class="mt-2 text-xs"
      @click="reset"
    >
      <BkIcon icon="rotate-ccw" :size="12" />
      Reset
    </BkButton>
  </div>
</template>
