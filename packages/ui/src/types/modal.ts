import type { SettingsField } from '@boardkit/core'

/**
 * Configuration for opening a form modal.
 */
export interface ModalConfig<T = Record<string, unknown>> {
  /** Modal title */
  title: string

  /** Optional description below the title */
  description?: string

  /** Form fields to render */
  fields: SettingsField[]

  /** Initial values for the form */
  initialValues?: Partial<T>

  /** Submit button label (default: "Submit") */
  submitLabel?: string

  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string

  /** Whether this is a destructive action (red submit button) */
  destructive?: boolean

  /** Modal size */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Result returned when a modal is closed.
 */
export interface ModalResult<T> {
  /** Whether the user confirmed (submitted) the modal */
  confirmed: boolean

  /** Form data if confirmed, null otherwise */
  data: T | null
}

/**
 * Configuration for a simple confirm dialog.
 */
export interface ConfirmConfig {
  /** Dialog title */
  title: string

  /** Dialog message/description */
  message: string

  /** Confirm button label (default: "Confirm") */
  confirmLabel?: string

  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string

  /** Whether this is a destructive action */
  destructive?: boolean
}

/**
 * Internal state for a modal.
 */
export interface ModalState {
  /** Whether the modal is open */
  isOpen: boolean

  /** Current modal configuration */
  config: ModalConfig | null

  /** Current form values */
  values: Record<string, unknown>

  /** Resolve function for the promise */
  resolve: ((result: ModalResult<unknown>) => void) | null
}

/**
 * Return type of useModal composable.
 */
export interface UseModalReturn {
  /** Open a form modal and wait for result */
  openModal: <T = Record<string, unknown>>(config: ModalConfig<T>) => Promise<ModalResult<T>>

  /** Open a simple confirm dialog */
  confirm: (config: ConfirmConfig) => Promise<boolean>
}
