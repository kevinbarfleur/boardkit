<script setup lang="ts">
import { provide, reactive, ref, computed, type Ref } from 'vue'
import { nanoid } from 'nanoid'
import type { Toast, ToastType, ToastOptions, UseToastReturn } from '../types/toast'
import { TOAST_INJECTION_KEY } from '../composables/useToast'
import BkToast from './BkToast.vue'

// Toast state
const toasts: Ref<Toast[]> = ref([])

// Default durations by type
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 5000,
  error: 5000,
}

/**
 * Show a toast notification.
 */
function show(message: string, type: ToastType = 'info', options?: ToastOptions): string {
  const id = nanoid()

  const toast: Toast = {
    id,
    message,
    type,
    duration: options?.duration ?? DEFAULT_DURATIONS[type],
    title: options?.title,
    action: options?.action,
  }

  toasts.value = [...toasts.value, toast]
  return id
}

/**
 * Shorthand functions.
 */
function success(message: string, options?: ToastOptions): string {
  return show(message, 'success', options)
}

function error(message: string, options?: ToastOptions): string {
  return show(message, 'error', options)
}

function info(message: string, options?: ToastOptions): string {
  return show(message, 'info', options)
}

function warning(message: string, options?: ToastOptions): string {
  return show(message, 'warning', options)
}

/**
 * Dismiss a specific toast.
 */
function dismiss(id: string): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

/**
 * Dismiss all toasts.
 */
function dismissAll(): void {
  toasts.value = []
}

// Provide the toast API
const toastApi: UseToastReturn = reactive({
  toasts: computed(() => toasts.value),
  show,
  success,
  error,
  info,
  warning,
  dismiss,
  dismissAll,
})

provide(TOAST_INJECTION_KEY, toastApi)
</script>

<template>
  <!-- Pass through default slot for app content -->
  <slot />

  <!-- Toast container (bottom-right) -->
  <Teleport to="body">
    <div
      class="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto"
        >
          <BkToast :toast="toast" @dismiss="dismiss" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-move {
  transition: transform 0.2s ease;
}
</style>
