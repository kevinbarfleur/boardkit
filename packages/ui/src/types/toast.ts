/**
 * Toast System Types
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  /** Unique identifier */
  id: string

  /** Message to display */
  message: string

  /** Toast type (affects styling) */
  type: ToastType

  /** Duration in milliseconds (default: 3000, 0 = no auto-dismiss) */
  duration?: number

  /** Optional title */
  title?: string

  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastOptions {
  /** Duration in milliseconds (default: 3000 for success/info, 5000 for error/warning) */
  duration?: number

  /** Optional title */
  title?: string

  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
}

export interface UseToastReturn {
  /** Current list of active toasts */
  toasts: Toast[]

  /**
   * Show a toast notification.
   * @param message - The message to display
   * @param type - The toast type (default: 'info')
   * @param options - Additional options
   */
  show: (message: string, type?: ToastType, options?: ToastOptions) => string

  /** Shorthand for success toast */
  success: (message: string, options?: ToastOptions) => string

  /** Shorthand for error toast */
  error: (message: string, options?: ToastOptions) => string

  /** Shorthand for info toast */
  info: (message: string, options?: ToastOptions) => string

  /** Shorthand for warning toast */
  warning: (message: string, options?: ToastOptions) => string

  /**
   * Dismiss a specific toast.
   * @param id - The toast ID to dismiss
   */
  dismiss: (id: string) => void

  /** Dismiss all toasts */
  dismissAll: () => void
}
