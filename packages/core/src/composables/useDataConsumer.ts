/**
 * useDataConsumer
 *
 * A composable for modules that consume data from other modules.
 * Handles subscriptions, permissions, and live updates.
 */

import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { useBoardStore } from '../stores/boardStore'
import { dataBus } from '../data/DataBus'
import { dataAccessController } from '../data/DataAccessController'
import type { ConnectionStatus } from '../types/dataContract'

interface UseDataConsumerOptions {
  /** Consumer widget ID */
  widgetId: string
  /** Contract ID to consume */
  contractId: string
  /** Reactive getter for provider widget ID (from module state) */
  getProviderWidgetId: () => string | null
}

interface UseDataConsumerReturn<T> {
  /** Current connection status */
  status: ComputedRef<ConnectionStatus>
  /** Current data (null if not connected) */
  data: Ref<T | null>
  /** Last update timestamp */
  lastUpdated: Ref<number | null>
  /** Available providers for this contract */
  availableProviders: ComputedRef<Array<{ id: string; moduleId: string }>>
  /** Connect to a provider (grants permission and updates subscription) */
  connect: (providerWidgetId: string) => boolean
  /** Disconnect from current provider */
  disconnect: () => boolean
  /** Refresh data from current provider */
  refresh: () => void
}

/**
 * Composable for modules that consume data from other modules.
 *
 * Usage:
 * ```ts
 * const { status, data, availableProviders, connect, disconnect } = useDataConsumer<PublicTodoList>({
 *   widgetId: props.context.widgetId,
 *   contractId: 'boardkit.todo.v1',
 *   getProviderWidgetId: () => props.context.state.connectedProvider,
 * })
 * ```
 */
export function useDataConsumer<T = unknown>(
  options: UseDataConsumerOptions
): UseDataConsumerReturn<T> {
  const { widgetId, contractId, getProviderWidgetId } = options
  const boardStore = useBoardStore()

  const data = ref<T | null>(null) as Ref<T | null>
  const lastUpdated = ref<number | null>(null)
  let unsubscribe: (() => void) | null = null

  // Compute connection status
  const status = computed<ConnectionStatus>(() => {
    const providerWidgetId = getProviderWidgetId()
    if (!providerWidgetId) return 'disconnected'

    return dataAccessController.getConnectionStatus(
      boardStore.permissions,
      boardStore.widgets,
      widgetId,
      providerWidgetId,
      contractId
    )
  })

  // Get available providers
  const availableProviders = computed(() => {
    return boardStore.getAvailableProviders(contractId)
  })

  // Subscribe to data bus when connected
  function setupSubscription(): void {
    // Clean up existing subscription
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    const providerWidgetId = getProviderWidgetId()

    if (!providerWidgetId || status.value !== 'connected') {
      data.value = null
      return
    }

    unsubscribe = dataBus.subscribe(widgetId, providerWidgetId, contractId, (newData) => {
      data.value = newData as T
      lastUpdated.value = Date.now()
    })
  }

  // Watch for provider changes and status changes
  watch([getProviderWidgetId, status], () => setupSubscription(), { immediate: true })

  // Connect to a provider
  function connect(newProviderWidgetId: string): boolean {
    const permission = boardStore.grantDataPermission(widgetId, newProviderWidgetId, contractId)
    return permission !== null
  }

  // Disconnect from current provider
  function disconnect(): boolean {
    const providerWidgetId = getProviderWidgetId()
    if (!providerWidgetId) return false

    return boardStore.revokeDataPermissionByLink(widgetId, providerWidgetId, contractId)
  }

  // Manually refresh data
  function refresh(): void {
    const providerWidgetId = getProviderWidgetId()
    if (!providerWidgetId) return

    const cachedData = dataBus.getData(providerWidgetId, contractId)
    if (cachedData !== null) {
      data.value = cachedData as T
      lastUpdated.value = Date.now()
    }
  }

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    status,
    data,
    lastUpdated,
    availableProviders,
    connect,
    disconnect,
    refresh,
  }
}
