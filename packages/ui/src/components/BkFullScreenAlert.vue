<script setup lang="ts">
/**
 * BkFullScreenAlert
 *
 * A full-screen alert modal with backdrop blur.
 * Used for important notifications like meeting reminders, deadlines, etc.
 * Supports customizable icon, title, subtitle, and action buttons.
 */
import BkIcon from './BkIcon.vue'
import BkButton from './BkButton.vue'

interface Props {
  /** Alert title */
  title: string
  /** Subtitle/label displayed above the title */
  subtitle?: string
  /** Icon to display in the badge */
  icon?: string
  /** Icon color class (defaults to text-primary) */
  iconColor?: string
  /** Whether to show the close button */
  showClose?: boolean
  /** Primary action button label */
  primaryLabel?: string
  /** Secondary action button label */
  secondaryLabel?: string
  /** Primary button icon (optional) */
  primaryIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: 'bell',
  iconColor: 'text-primary',
  showClose: true,
  primaryLabel: 'Confirm',
  secondaryLabel: 'Dismiss',
  primaryIcon: '',
})

const emit = defineEmits<{
  /** Emitted when primary action is clicked */
  primary: []
  /** Emitted when secondary action is clicked */
  secondary: []
  /** Emitted when close button or backdrop is clicked */
  close: []
}>()

function handlePrimary() {
  emit('primary')
}

function handleSecondary() {
  emit('secondary')
}

function handleClose() {
  emit('close')
}

function handleBackdropClick() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-md"
          @click="handleBackdropClick"
        />

        <!-- Modal -->
        <div class="relative bg-popover rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
          <!-- Header -->
          <div class="p-5 pb-4">
            <div class="flex items-start gap-4">
              <!-- Icon badge -->
              <div
                v-if="icon"
                class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
              >
                <BkIcon :icon="icon" :size="24" :class="iconColor" />
              </div>

              <!-- Title & subtitle -->
              <div class="flex-1 min-w-0">
                <p
                  v-if="subtitle"
                  class="text-xs font-medium text-primary uppercase tracking-wide mb-1"
                >
                  {{ subtitle }}
                </p>
                <h2 class="text-lg font-semibold text-foreground leading-tight">
                  {{ title }}
                </h2>
              </div>

              <!-- Close button -->
              <button
                v-if="showClose"
                class="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                @click="handleClose"
              >
                <BkIcon icon="x" :size="18" class="text-muted-foreground" />
              </button>
            </div>
          </div>

          <!-- Content slot -->
          <div class="px-5 pb-5 space-y-4">
            <slot />

            <!-- Actions -->
            <div class="flex gap-3 pt-3">
              <BkButton
                variant="outline"
                class="flex-1"
                @click="handleSecondary"
              >
                {{ secondaryLabel }}
              </BkButton>
              <BkButton
                variant="default"
                class="flex-1"
                @click="handlePrimary"
              >
                <BkIcon v-if="primaryIcon" :icon="primaryIcon" :size="16" class="mr-2" />
                {{ primaryLabel }}
              </BkButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
