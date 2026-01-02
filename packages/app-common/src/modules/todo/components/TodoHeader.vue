<script setup lang="ts">
import { BkEditableInput } from '@boardkit/ui'
import type { ProgressStats } from '../composables/useTodoItems'

interface Props {
  title: string
  description: string
  progress: ProgressStats
  showProgress: 'none' | 'bar' | 'counter'
  isSelected: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:description': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <!-- Title -->
    <BkEditableInput
      v-if="isSelected"
      :model-value="title"
      placeholder="List title..."
      variant="title"
      @update:model-value="emit('update:title', $event)"
    />
    <span v-else-if="title" class="text-base font-medium text-foreground">
      {{ title }}
    </span>

    <!-- Description -->
    <BkEditableInput
      v-if="isSelected"
      :model-value="description"
      placeholder="Description..."
      variant="subtitle"
      @update:model-value="emit('update:description', $event)"
    />
    <span v-else-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </span>

    <!-- Progress indicator -->
    <div v-if="showProgress !== 'none' && progress.total > 0" class="flex items-center gap-2 mt-1">
      <!-- Bar progress -->
      <template v-if="showProgress === 'bar'">
        <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-300"
            :style="{ width: `${progress.percent}%` }"
          />
        </div>
        <span class="text-xs text-muted-foreground shrink-0">{{ progress.percent }}%</span>
      </template>

      <!-- Counter progress -->
      <template v-else-if="showProgress === 'counter'">
        <span class="text-xs text-muted-foreground">
          {{ progress.completed }}/{{ progress.total }} completed
        </span>
      </template>
    </div>
  </div>
</template>
