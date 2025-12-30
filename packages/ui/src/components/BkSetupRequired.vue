<script setup lang="ts">
/**
 * BkSetupRequired
 *
 * Empty state component displayed when a module requires configuration
 * before it can be used. Shows an icon, message, and a configure button.
 */
import BkButton from './BkButton.vue'
import BkIcon from './BkIcon.vue'

interface Props {
  /** Icon name (Lucide) */
  icon?: string
  /** Main message */
  message?: string
  /** Optional secondary hint text */
  hint?: string
  /** Button label */
  buttonLabel?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'settings',
  message: 'Setup Required',
  hint: undefined,
  buttonLabel: 'Configure',
})

const emit = defineEmits<{
  configure: []
}>()
</script>

<template>
  <div class="bk-setup-required h-full flex flex-col items-center justify-center p-4 text-center">
    <!-- Icon container -->
    <div
      class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3"
    >
      <BkIcon :icon="icon" :size="24" class="text-muted-foreground" />
    </div>

    <!-- Message -->
    <h3 class="text-sm font-medium text-foreground mb-1">
      Setup Required
    </h3>

    <!-- Description -->
    <p class="text-xs text-muted-foreground mb-1 max-w-[200px]">
      {{ message }}
    </p>

    <!-- Hint -->
    <p v-if="hint" class="text-xs text-muted-foreground/70 mb-3 max-w-[200px]">
      {{ hint }}
    </p>

    <!-- Spacer if no hint -->
    <div v-else class="mb-3" />

    <!-- Configure button -->
    <BkButton variant="secondary" size="sm" @click="emit('configure')">
      <BkIcon icon="settings" :size="14" class="mr-1.5" />
      {{ buttonLabel }}
    </BkButton>
  </div>
</template>
