<script setup lang="ts">
import { computed } from 'vue'
import BkModal from './BkModal.vue'
import BkButton from './BkButton.vue'
import BkIcon from './BkIcon.vue'

interface Props {
  open: boolean
  targetTheme: 'light' | 'dark'
  elementCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const themeLabel = computed(() =>
  props.targetTheme === 'light' ? 'light mode' : 'dark mode'
)
</script>

<template>
  <BkModal :open="open" size="sm" @close="emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
        >
          <BkIcon icon="sun-moon" :size="20" class="text-primary" />
        </div>
        <h3 class="text-base font-medium text-foreground font-serif">
          Switching to {{ themeLabel }}
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">
        You have {{ elementCount }} element{{ elementCount > 1 ? 's' : '' }} on
        the canvas. Colors will be automatically inverted for better visibility.
      </p>

      <div class="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <BkIcon
          icon="info"
          :size="16"
          class="flex-shrink-0 text-muted-foreground"
        />
        <p class="text-xs text-muted-foreground">
          This is a visual effect only. Exported images will use original
          colors.
        </p>
      </div>
    </div>

    <template #footer>
      <BkButton variant="ghost" @click="emit('close')"> Cancel </BkButton>
      <BkButton @click="emit('confirm')"> Continue </BkButton>
    </template>
  </BkModal>
</template>
