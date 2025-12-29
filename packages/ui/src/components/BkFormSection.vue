<script setup lang="ts">
import { ref, computed } from 'vue'
import BkIcon from './BkIcon.vue'

interface Props {
  title?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  noDividers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
  defaultCollapsed: false,
  noDividers: false,
})

const isCollapsed = ref(props.defaultCollapsed)

const toggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}

const contentClasses = computed(() => {
  const base = ['rounded-md border border-border bg-card']
  if (!props.noDividers) {
    base.push('divide-y divide-border')
  }
  return base.join(' ')
})
</script>

<template>
  <div class="space-y-2">
    <!-- Section header -->
    <div
      v-if="title || $slots.title || $slots.actions"
      class="flex items-center justify-between px-1"
    >
      <!-- Title -->
      <component
        :is="collapsible ? 'button' : 'div'"
        :type="collapsible ? 'button' : undefined"
        class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        :class="collapsible ? 'cursor-pointer hover:text-foreground transition-colors' : ''"
        @click="toggleCollapse"
      >
        <BkIcon
          v-if="collapsible"
          icon="chevron-right"
          :size="12"
          class="shrink-0 transition-transform duration-200"
          :class="isCollapsed ? '' : 'rotate-90'"
        />
        <slot name="title">
          {{ title }}
        </slot>
      </component>

      <!-- Actions slot -->
      <div v-if="$slots.actions" class="flex items-center gap-1">
        <slot name="actions" />
      </div>
    </div>

    <!-- Content -->
    <div
      v-show="!isCollapsed"
      :class="contentClasses"
    >
      <slot />
    </div>
  </div>
</template>
