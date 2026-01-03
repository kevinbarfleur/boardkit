<script setup lang="ts">
/**
 * TaskLinkPopover - Dropdown to select a task to link to the timer
 *
 * Shows tasks from connected todo lists and kanban boards,
 * grouped by their source widget.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BkIcon, BkButton } from '@boardkit/ui'
import type { TaskReference } from '../types'

interface TaskItem {
  widgetId: string
  widgetTitle: string
  taskId: string
  taskLabel: string
  sourceType: 'todo' | 'kanban'
}

interface TaskGroup {
  widgetId: string
  title: string
  icon: string
  tasks: TaskItem[]
}

interface Props {
  /** Grouped tasks from connected providers */
  taskGroups: TaskGroup[]
  /** Whether no providers are connected */
  noProviders?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  noProviders: false,
})

const emit = defineEmits<{
  select: [task: TaskReference]
  configure: []
}>()

const isOpen = ref(false)
const popoverRef = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleSelect(task: TaskItem) {
  emit('select', {
    widgetId: task.widgetId,
    taskId: task.taskId,
    taskLabel: task.taskLabel,
    sourceType: task.sourceType,
  })
  close()
}

function handleConfigure() {
  emit('configure')
  close()
}

function handleClickOutside(event: MouseEvent) {
  if (popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const hasAnyTasks = computed(() => {
  return props.taskGroups.some((group) => group.tasks.length > 0)
})
</script>

<template>
  <div ref="popoverRef" class="relative inline-block">
    <!-- Trigger button -->
    <button
      type="button"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-dashed border-border hover:border-border-strong transition-colors"
      @click.stop="toggle"
    >
      <BkIcon icon="link" :size="14" />
      <span>Link a task</span>
    </button>

    <!-- Popover content -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2 left-0 min-w-[240px] max-w-[320px] max-h-[300px] overflow-auto rounded-lg border border-border bg-popover shadow-lg"
      >
        <!-- No providers connected -->
        <div v-if="noProviders" class="p-4 text-center">
          <BkIcon icon="link-2-off" :size="24" class="mx-auto text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground mb-3">
            No task sources connected
          </p>
          <BkButton size="sm" variant="secondary" @click="handleConfigure">
            <BkIcon icon="settings" :size="14" />
            Configure
          </BkButton>
        </div>

        <!-- No tasks available -->
        <div v-else-if="!hasAnyTasks" class="p-4 text-center">
          <BkIcon icon="inbox" :size="24" class="mx-auto text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">
            No pending tasks
          </p>
        </div>

        <!-- Task list grouped by source -->
        <div v-else class="py-1">
          <template v-for="group in taskGroups" :key="group.widgetId">
            <template v-if="group.tasks.length > 0">
              <!-- Group header -->
              <div class="px-3 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <BkIcon :icon="group.icon" :size="12" />
                <span class="truncate">{{ group.title }}</span>
              </div>

              <!-- Tasks in group -->
              <button
                v-for="task in group.tasks"
                :key="task.taskId"
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors"
                @click="handleSelect(task)"
              >
                <span class="w-4 h-4 rounded-full border border-border shrink-0" />
                <span class="truncate">{{ task.taskLabel }}</span>
              </button>
            </template>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>
