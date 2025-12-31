<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Toast } from '../types/toast'
import BkIcon from './BkIcon.vue'

interface Props {
  toast: Toast
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

// Animation state
const isVisible = ref(false)
const isLeaving = ref(false)

// Icon based on type
const iconName = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'check-circle'
    case 'error':
      return 'x-circle'
    case 'warning':
      return 'alert-triangle'
    case 'info':
    default:
      return 'info'
  }
})

// Icon color based on type
const iconClass = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'text-success'
    case 'error':
      return 'text-destructive'
    case 'warning':
      return 'text-warning'
    case 'info':
    default:
      return 'text-primary'
  }
})

// Auto-dismiss timer
let dismissTimer: ReturnType<typeof setTimeout> | null = null

function startDismissTimer() {
  const duration = props.toast.duration ?? (props.toast.type === 'error' ? 5000 : 3000)
  if (duration > 0) {
    dismissTimer = setTimeout(() => {
      dismiss()
    }, duration)
  }
}

function stopDismissTimer() {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

function dismiss() {
  if (isLeaving.value) return
  isLeaving.value = true

  // Wait for exit animation
  setTimeout(() => {
    emit('dismiss', props.toast.id)
  }, 200)
}

function handleAction() {
  props.toast.action?.onClick()
  dismiss()
}

onMounted(() => {
  // Trigger enter animation
  requestAnimationFrame(() => {
    isVisible.value = true
  })
  startDismissTimer()
})

onUnmounted(() => {
  stopDismissTimer()
})
</script>

<template>
  <div
    class="bk-toast flex items-start gap-3 w-80 p-3 rounded-lg border border-border bg-popover shadow-lg transition-all duration-200"
    :class="{
      'opacity-0 translate-x-4': !isVisible || isLeaving,
      'opacity-100 translate-x-0': isVisible && !isLeaving,
    }"
    @mouseenter="stopDismissTimer"
    @mouseleave="startDismissTimer"
  >
    <!-- Icon -->
    <BkIcon :icon="iconName" :size="18" :class="iconClass" class="shrink-0 mt-0.5" />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Title (optional) -->
      <p v-if="toast.title" class="text-sm font-medium text-foreground">
        {{ toast.title }}
      </p>
      <!-- Message -->
      <p class="text-sm text-muted-foreground" :class="{ 'mt-0.5': toast.title }">
        {{ toast.message }}
      </p>
      <!-- Action (optional) -->
      <button
        v-if="toast.action"
        class="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        @click="handleAction"
      >
        {{ toast.action.label }}
      </button>
    </div>

    <!-- Dismiss button -->
    <button
      class="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 -m-0.5"
      @click="dismiss"
    >
      <BkIcon icon="x" :size="14" />
    </button>
  </div>
</template>
