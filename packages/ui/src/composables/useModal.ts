import { inject, type InjectionKey } from 'vue'
import type { ModalConfig, ModalResult, ConfirmConfig, UseModalReturn } from '../types/modal'

/**
 * Injection key for the modal API.
 * Used by BkModalProvider to provide the modal functions.
 */
export const MODAL_INJECTION_KEY: InjectionKey<UseModalReturn> = Symbol('bk-modal')

/**
 * Composable for opening modals declaratively.
 *
 * Must be used within a component tree that has BkModalProvider.
 *
 * @example
 * ```ts
 * const { openModal, confirm } = useModal()
 *
 * // Open a form modal
 * const result = await openModal({
 *   title: 'Add task',
 *   fields: [
 *     { type: 'text', key: 'label', label: 'Task name' },
 *     { type: 'textarea', key: 'description', label: 'Description' },
 *   ],
 *   submitLabel: 'Create',
 * })
 *
 * if (result.confirmed) {
 *   console.log(result.data)
 * }
 *
 * // Open a confirm dialog
 * const confirmed = await confirm({
 *   title: 'Delete task?',
 *   message: 'This action cannot be undone.',
 *   destructive: true,
 * })
 * ```
 */
export function useModal(): UseModalReturn {
  const modal = inject(MODAL_INJECTION_KEY)

  if (!modal) {
    throw new Error(
      'useModal() was called without a BkModalProvider in the component tree. ' +
        'Make sure to wrap your app with <BkModalProvider>.'
    )
  }

  return modal
}
