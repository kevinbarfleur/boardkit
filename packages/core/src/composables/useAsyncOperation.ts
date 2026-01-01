/**
 * useAsyncOperation Composable
 *
 * Provides a standardized pattern for handling async operations in modules.
 * Manages loading state, error handling, and success callbacks.
 *
 * @example
 * const { data, isLoading, error, execute } = useAsyncOperation<CalendarEvent[]>({
 *   onSuccess: (events) => {
 *     context.updateState({ events, lastSync: Date.now() })
 *   },
 *   onError: (err) => {
 *     console.error('Failed to fetch events:', err)
 *   },
 * })
 *
 * const refresh = () => {
 *   execute(async () => {
 *     const res = await fetch('https://api.example.com/events')
 *     if (!res.ok) throw new Error('API error')
 *     return res.json()
 *   })
 * }
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface AsyncOperationOptions<T> {
  /** Reset error on new execution (default: true) */
  resetOnExecute?: boolean

  /** Callback on success */
  onSuccess?: (data: T) => void

  /** Callback on error */
  onError?: (error: Error) => void

  /** Initial data value */
  initialData?: T | null
}

export interface AsyncOperationState<T> {
  /** The resulting data (null if not yet executed or on error) */
  data: Ref<T | null>

  /** Whether an operation is currently in progress */
  isLoading: Ref<boolean>

  /** Error message if the operation failed */
  error: Ref<string | null>

  /** Whether the last operation succeeded */
  isSuccess: ComputedRef<boolean>

  /** Whether the last operation failed */
  isError: ComputedRef<boolean>

  /** Whether an operation has been executed at least once */
  hasExecuted: Ref<boolean>
}

export interface UseAsyncOperationReturn<T> extends AsyncOperationState<T> {
  /**
   * Execute an async function with automatic state management.
   * @param fn - The async function to execute
   * @returns The result on success, null on error
   */
  execute: (fn: () => Promise<T>) => Promise<T | null>

  /**
   * Reset all state to initial values.
   */
  reset: () => void

  /**
   * Manually set an error state.
   */
  setError: (message: string) => void

  /**
   * Clear the error state.
   */
  clearError: () => void
}

/**
 * Composable for handling async operations with loading/error states.
 *
 * @example Basic usage
 * const { isLoading, error, execute } = useAsyncOperation()
 *
 * await execute(async () => {
 *   const response = await fetch('/api/data')
 *   return response.json()
 * })
 *
 * @example With callbacks
 * const { execute } = useAsyncOperation({
 *   onSuccess: (data) => console.log('Got data:', data),
 *   onError: (err) => showToast(err.message),
 * })
 *
 * @example Multiple operations
 * const saveOperation = useAsyncOperation({ onSuccess: () => showToast('Saved!') })
 * const loadOperation = useAsyncOperation({ onSuccess: (data) => setItems(data) })
 */
export function useAsyncOperation<T = unknown>(
  options: AsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> {
  const {
    resetOnExecute = true,
    onSuccess,
    onError,
    initialData = null,
  } = options

  // State
  const data = ref<T | null>(initialData) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasExecuted = ref(false)

  // Computed states
  const isSuccess = computed(() => hasExecuted.value && error.value === null && !isLoading.value)
  const isError = computed(() => error.value !== null)

  /**
   * Execute an async operation with automatic state management.
   */
  async function execute(fn: () => Promise<T>): Promise<T | null> {
    if (resetOnExecute) {
      error.value = null
    }

    isLoading.value = true
    hasExecuted.value = true

    try {
      const result = await fn()
      data.value = result
      error.value = null
      onSuccess?.(result)
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err.message
      data.value = null
      onError?.(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reset all state to initial values.
   */
  function reset(): void {
    data.value = initialData
    isLoading.value = false
    error.value = null
    hasExecuted.value = false
  }

  /**
   * Manually set an error state.
   */
  function setError(message: string): void {
    error.value = message
    hasExecuted.value = true
  }

  /**
   * Clear the error state.
   */
  function clearError(): void {
    error.value = null
  }

  return {
    data,
    isLoading,
    error,
    isSuccess,
    isError,
    hasExecuted,
    execute,
    reset,
    setError,
    clearError,
  }
}
