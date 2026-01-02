<script setup lang="ts">
import { computed } from 'vue'
import BkIcon from './BkIcon.vue'

interface Props {
  label: string
  layout?: 'inline' | 'stacked'
  icon?: string
  hint?: string
  htmlFor?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'inline',
})

const isInline = computed(() => props.layout === 'inline')
</script>

<template>
  <div class="p-3 overflow-hidden">
    <!-- Inline layout: label left, control right -->
    <div v-if="isInline" class="flex items-center gap-3">
      <!-- Label section -->
      <label
        :for="htmlFor"
        class="flex items-center gap-2 text-sm text-foreground shrink-0"
      >
        <BkIcon
          v-if="icon"
          :icon="icon"
          :size="14"
          class="shrink-0 text-muted-foreground"
        />
        <span>
          {{ label }}
          <span v-if="required" class="text-destructive">*</span>
        </span>
      </label>

      <!-- Control slot - flex-1 fills remaining space, justify-end for right alignment -->
      <div class="flex-1 min-w-0 flex justify-end">
        <slot />
      </div>
    </div>

    <!-- Stacked layout: label above, control below -->
    <div v-else class="space-y-2">
      <!-- Label section -->
      <label
        :for="htmlFor"
        class="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <BkIcon
          v-if="icon"
          :icon="icon"
          :size="14"
          class="shrink-0 text-muted-foreground"
        />
        <span>
          {{ label }}
          <span v-if="required" class="text-destructive">*</span>
        </span>
      </label>

      <!-- Control slot -->
      <div class="min-w-0">
        <slot />
      </div>
    </div>

    <!-- Hint text -->
    <div
      v-if="hint || $slots.hint"
      class="mt-1.5 text-xs text-muted-foreground"
      :class="isInline ? '' : 'ml-0'"
    >
      <slot name="hint">
        {{ hint }}
      </slot>
    </div>
  </div>
</template>
