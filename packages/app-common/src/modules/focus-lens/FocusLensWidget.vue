<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useConsumeData, useModuleConfiguration, todoContractV1, type PublicTodoList } from '@boardkit/core'
import { BkIcon, BkSetupRequired } from '@boardkit/ui'
import type { FocusLensState } from './types'
import { defaultFocusLensSettings } from './types'

interface Props {
  context: ModuleContext<FocusLensState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'open-settings': [options?: { tab?: string }]
}>()

// Configuration check
const { needsSetup, setupMessage, setupIcon } = useModuleConfiguration(props.context)

function handleConfigure() {
  emit('open-settings', { tab: 'configure' })
}

// Settings with defaults
const autoRefresh = computed(
  () => props.context.state.autoRefresh ?? defaultFocusLensSettings.autoRefresh
)
const showSourceName = computed(
  () => props.context.state.showSourceName ?? defaultFocusLensSettings.showSourceName
)

// Use the data consumer composable
const { status, data } = useConsumeData<FocusLensState, PublicTodoList>(
  props.context,
  todoContractV1
)

// Random task index for refreshing in random mode
const randomIndex = ref(0)

// Get the next incomplete task
const nextTask = computed(() => {
  if (!data.value) return null

  const pending = data.value.items.filter((i) => !i.completed)
  if (pending.length === 0) return null

  if (props.context.state.showMode === 'next') {
    return pending[0]
  } else {
    // Random mode - use the reactive randomIndex
    return pending[randomIndex.value % pending.length]
  }
})

// Remaining count
const remainingCount = computed(() => {
  if (!data.value) return 0
  return data.value.progress.total - data.value.progress.done
})

// Auto-refresh for random mode
let refreshInterval: ReturnType<typeof setInterval> | null = null

function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }

  if (autoRefresh.value > 0 && props.context.state.showMode === 'random') {
    refreshInterval = setInterval(() => {
      randomIndex.value = Math.floor(Math.random() * 1000)
    }, autoRefresh.value * 1000)
  }
}

watch(
  [autoRefresh, () => props.context.state.showMode],
  () => setupAutoRefresh(),
  { immediate: true }
)

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="focus-lens h-full flex flex-col gap-2 p-2">
    <!-- Connected state with data -->
    <template v-if="status === 'connected' && data">
      <div v-if="showSourceName" class="text-xs text-muted-foreground flex items-center gap-1">
        <BkIcon icon="target" :size="12" />
        <span class="truncate">{{ data.title || 'Todo List' }}</span>
      </div>

      <!-- Next task display -->
      <div v-if="nextTask" class="flex-1 flex items-center justify-center">
        <div class="text-center px-2">
          <div class="text-base font-medium text-foreground leading-tight">
            {{ nextTask.label }}
          </div>
          <div class="text-xs text-muted-foreground mt-2">
            {{ remainingCount }} task{{ remainingCount !== 1 ? 's' : '' }} remaining
          </div>
        </div>
      </div>

      <!-- All done state -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <BkIcon icon="check-circle" :size="32" class="text-green-500 mx-auto mb-2" />
          <div class="text-sm font-medium text-foreground">All done!</div>
          <div class="text-xs text-muted-foreground">No pending tasks</div>
        </div>
      </div>
    </template>

    <!-- Broken connection -->
    <template v-else-if="status === 'broken'">
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center px-4">
          <BkIcon icon="unlink" :size="24" class="text-destructive mx-auto mb-2" />
          <div class="text-sm text-muted-foreground mb-1">Source was deleted</div>
          <div class="text-xs text-muted-foreground/70">
            Use Settings to reconnect
          </div>
        </div>
      </div>
    </template>

    <!-- Not connected - Setup Required -->
    <template v-else>
      <BkSetupRequired
        :icon="setupIcon"
        :message="setupMessage"
        @configure="handleConfigure"
      />
    </template>
  </div>
</template>
