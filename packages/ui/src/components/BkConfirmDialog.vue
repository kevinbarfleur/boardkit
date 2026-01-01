<script setup lang="ts">
/**
 * BkConfirmDialog
 *
 * A confirmation dialog component for destructive or important actions.
 * Wraps BkModal with standardized confirm/cancel buttons.
 */
import BkModal from './BkModal.vue'
import BkButton from './BkButton.vue'
import BkIcon from './BkIcon.vue'

interface Props {
  /** Whether the dialog is open */
  open: boolean
  /** Dialog title */
  title: string
  /** Description text */
  description?: string
  /** Confirm button text */
  confirmLabel?: string
  /** Cancel button text */
  cancelLabel?: string
  /** Whether the action is destructive (shows red confirm button) */
  destructive?: boolean
  /** Icon to show (optional) */
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
  icon: '',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('close')
}

function handleCancel() {
  emit('cancel')
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BkModal :open="open" @close="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          v-if="icon"
          class="flex h-10 w-10 items-center justify-center rounded-full"
          :class="destructive ? 'bg-destructive/10' : 'bg-primary/10'"
        >
          <BkIcon
            :icon="icon"
            :size="20"
            :class="destructive ? 'text-destructive' : 'text-primary'"
          />
        </div>
        <h3 class="text-lg font-medium text-foreground">{{ title }}</h3>
      </div>
    </template>

    <p v-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </p>

    <slot />

    <template #footer>
      <BkButton variant="ghost" @click="handleCancel">
        {{ cancelLabel }}
      </BkButton>
      <BkButton
        :variant="destructive ? 'destructive' : 'default'"
        @click="handleConfirm"
      >
        {{ confirmLabel }}
      </BkButton>
    </template>
  </BkModal>
</template>
