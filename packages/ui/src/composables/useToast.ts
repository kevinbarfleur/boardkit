import { inject, type InjectionKey } from 'vue'
import type { UseToastReturn } from '../types/toast'

/**
 * Injection key for the toast API.
 * Used by BkToastProvider to provide the toast functions.
 */
export const TOAST_INJECTION_KEY: InjectionKey<UseToastReturn> = Symbol('bk-toast')

/**
 * Composable for showing toast notifications.
 *
 * Must be used within a component tree that has BkToastProvider.
 *
 * @example
 * ```ts
 * const { success, error } = useToast()
 *
 * // Show a success toast
 * success('Changes saved!')
 *
 * // Show an error toast
 * error('Failed to save changes')
 *
 * // Show a toast with options
 * success('File uploaded', {
 *   title: 'Upload complete',
 *   action: {
 *     label: 'View',
 *     onClick: () => navigateToFile(),
 *   },
 * })
 * ```
 */
export function useToast(): UseToastReturn {
  const toast = inject(TOAST_INJECTION_KEY)

  if (!toast) {
    // Return a no-op implementation for non-provided contexts
    // This allows components to use useToast() even if provider isn't set up
    console.warn(
      'useToast() was called without a BkToastProvider in the component tree. ' +
        'Toast notifications will not be shown.'
    )

    return {
      toasts: [],
      show: () => '',
      success: () => '',
      error: () => '',
      info: () => '',
      warning: () => '',
      dismiss: () => {},
      dismissAll: () => {},
    }
  }

  return toast
}
