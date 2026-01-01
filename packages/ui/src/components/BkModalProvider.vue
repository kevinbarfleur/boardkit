<script setup lang="ts">
/**
 * BkModalProvider
 *
 * Provides the modal API to the component tree via provide/inject.
 * Renders modals when opened via useModal().
 */
import { ref, provide, computed } from 'vue'
import { MODAL_INJECTION_KEY } from '../composables/useModal'
import type { ModalConfig, ModalResult, ConfirmConfig, UseModalReturn } from '../types/modal'
import BkFormModal from './BkFormModal.vue'
import BkConfirmDialog from './BkConfirmDialog.vue'

// Form modal state
const formModalConfig = ref<ModalConfig | null>(null)
const formModalValues = ref<Record<string, unknown>>({})
const formModalResolve = ref<((result: ModalResult<unknown>) => void) | null>(null)

const isFormModalOpen = computed(() => formModalConfig.value !== null)

// Confirm dialog state
const confirmConfig = ref<ConfirmConfig | null>(null)
const confirmResolve = ref<((result: boolean) => void) | null>(null)

const isConfirmOpen = computed(() => confirmConfig.value !== null)

// Open a form modal
function openModal<T = Record<string, unknown>>(config: ModalConfig<T>): Promise<ModalResult<T>> {
  return new Promise((resolve) => {
    formModalConfig.value = config as ModalConfig
    formModalValues.value = { ...(config.initialValues || {}) }
    formModalResolve.value = resolve as (result: ModalResult<unknown>) => void
  })
}

// Handle form modal submit
function handleFormSubmit() {
  if (formModalResolve.value) {
    formModalResolve.value({
      confirmed: true,
      data: { ...formModalValues.value },
    })
  }
  closeFormModal()
}

// Handle form modal cancel
function handleFormCancel() {
  if (formModalResolve.value) {
    formModalResolve.value({
      confirmed: false,
      data: null,
    })
  }
  closeFormModal()
}

// Close form modal and clean up
function closeFormModal() {
  formModalConfig.value = null
  formModalValues.value = {}
  formModalResolve.value = null
}

// Handle field update
function handleFieldUpdate(key: string, value: unknown) {
  formModalValues.value = {
    ...formModalValues.value,
    [key]: value,
  }
}

// Open a confirm dialog
function confirm(config: ConfirmConfig): Promise<boolean> {
  return new Promise((resolve) => {
    confirmConfig.value = config
    confirmResolve.value = resolve
  })
}

// Handle confirm dialog confirm
function handleConfirm() {
  if (confirmResolve.value) {
    confirmResolve.value(true)
  }
  closeConfirmDialog()
}

// Handle confirm dialog cancel
function handleConfirmCancel() {
  if (confirmResolve.value) {
    confirmResolve.value(false)
  }
  closeConfirmDialog()
}

// Close confirm dialog and clean up
function closeConfirmDialog() {
  confirmConfig.value = null
  confirmResolve.value = null
}

// Provide the modal API
const modalApi: UseModalReturn = {
  openModal,
  confirm,
}

provide(MODAL_INJECTION_KEY, modalApi)
</script>

<template>
  <!-- Render children -->
  <slot />

  <!-- Form Modal -->
  <BkFormModal
    v-if="formModalConfig"
    :open="isFormModalOpen"
    :config="formModalConfig"
    :values="formModalValues"
    @submit="handleFormSubmit"
    @cancel="handleFormCancel"
    @update="handleFieldUpdate"
  />

  <!-- Confirm Dialog -->
  <BkConfirmDialog
    v-if="confirmConfig"
    :open="isConfirmOpen"
    :title="confirmConfig.title"
    :description="confirmConfig.message"
    :confirm-label="confirmConfig.confirmLabel"
    :cancel-label="confirmConfig.cancelLabel"
    :destructive="confirmConfig.destructive"
    @confirm="handleConfirm"
    @cancel="handleConfirmCancel"
  />
</template>
