/**
 * useConsumeData
 *
 * Simplified composable for modules that consume data from other modules.
 * Supports both single-provider and multi-provider modes.
 * Takes ModuleContext directly for a cleaner API.
 */

import { ref, shallowRef, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { useBoardStore } from '../stores/boardStore'
import { dataBus } from '../data/DataBus'
import { dataAccessController } from '../data/DataAccessController'
import type { ModuleContext } from '../types/module'
import type { DataContract, ConnectionStatus } from '../types/dataContract'

// ============================================================================
// Types
// ============================================================================

interface ConsumeDataSingleOptions {
  /** Single provider mode (default) */
  multi?: false
  /** Key in state where provider ID is stored (default: 'connectedProvider') */
  stateKey?: string
}

interface ConsumeDataMultiOptions {
  /** Multi provider mode */
  multi: true
  /** Key in state where provider IDs array is stored (default: 'connectedProviders') */
  stateKey?: string
}

type ConsumeDataOptions = ConsumeDataSingleOptions | ConsumeDataMultiOptions

/** Single provider return type */
interface UseConsumeDataSingleReturn<T> {
  /** Current connection status */
  status: ComputedRef<ConnectionStatus>
  /** Current data (null if not connected) */
  data: Ref<T | null>
  /** Last update timestamp */
  lastUpdated: Ref<number | null>
  /** Available providers for this contract */
  availableProviders: ComputedRef<Array<{ id: string; moduleId: string }>>
  /** Connect to a provider */
  connect: (providerWidgetId: string) => boolean
  /** Disconnect from current provider */
  disconnect: () => boolean
  /** Refresh data from current provider */
  refresh: () => void
}

/** Connection info for multi-provider mode */
interface DataConnection<T> {
  providerId: string
  status: ConnectionStatus
  data: T | null
  lastUpdated: number | null
}

/** Multi provider return type */
interface UseConsumeDataMultiReturn<T> {
  /** All connections as a reactive Map */
  connections: ComputedRef<Map<string, DataConnection<T>>>
  /** Flat array of all connected data (convenience helper) */
  allData: ComputedRef<T[]>
  /** Available providers for this contract */
  availableProviders: ComputedRef<Array<{ id: string; moduleId: string }>>
  /** Connect to a provider */
  connect: (providerWidgetId: string) => boolean
  /** Disconnect from a specific provider */
  disconnect: (providerWidgetId: string) => boolean
  /** Disconnect all providers */
  disconnectAll: () => void
  /** Check if connected to a specific provider */
  isConnected: (providerWidgetId: string) => boolean
}

// ============================================================================
// Overloaded function signatures for type inference
// ============================================================================

/**
 * Consume data from a single provider (default mode).
 */
export function useConsumeData<TState, TProjection>(
  context: ModuleContext<TState>,
  contract: DataContract<TProjection>,
  options?: ConsumeDataSingleOptions
): UseConsumeDataSingleReturn<TProjection>

/**
 * Consume data from multiple providers.
 */
export function useConsumeData<TState, TProjection>(
  context: ModuleContext<TState>,
  contract: DataContract<TProjection>,
  options: ConsumeDataMultiOptions
): UseConsumeDataMultiReturn<TProjection>

// ============================================================================
// Implementation
// ============================================================================

export function useConsumeData<TState, TProjection>(
  context: ModuleContext<TState>,
  contract: DataContract<TProjection>,
  options: ConsumeDataOptions = {}
): UseConsumeDataSingleReturn<TProjection> | UseConsumeDataMultiReturn<TProjection> {
  const isMulti = options.multi === true

  if (isMulti) {
    const stateKey = options.stateKey ?? 'connectedProviders'
    return createMultiConsumer<TState, TProjection>(context, contract, stateKey)
  } else {
    const stateKey = options.stateKey ?? 'connectedProvider'
    return createSingleConsumer<TState, TProjection>(context, contract, stateKey)
  }
}

// ============================================================================
// Single Consumer Implementation
// ============================================================================

function createSingleConsumer<TState, TProjection>(
  context: ModuleContext<TState>,
  contract: DataContract<TProjection>,
  stateKey: string
): UseConsumeDataSingleReturn<TProjection> {
  const { widgetId } = context
  const boardStore = useBoardStore()

  const data = ref<TProjection | null>(null) as Ref<TProjection | null>
  const lastUpdated = ref<number | null>(null)
  let unsubscribe: (() => void) | null = null

  // Get provider widget ID from state
  const getProviderWidgetId = () => (context.state as Record<string, unknown>)[stateKey] as string | null

  // Compute connection status
  const status = computed<ConnectionStatus>(() => {
    const providerWidgetId = getProviderWidgetId()
    if (!providerWidgetId) return 'disconnected'

    return dataAccessController.getConnectionStatus(
      boardStore.permissions,
      boardStore.widgets,
      widgetId,
      providerWidgetId,
      contract.id
    )
  })

  // Get available providers
  const availableProviders = computed(() => {
    return boardStore.getAvailableProviders(contract.id)
  })

  // Subscribe to data bus when connected
  function setupSubscription(): void {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    const providerWidgetId = getProviderWidgetId()

    if (!providerWidgetId || status.value !== 'connected') {
      data.value = null
      return
    }

    unsubscribe = dataBus.subscribe(widgetId, providerWidgetId, contract.id, (newData) => {
      data.value = newData as TProjection
      lastUpdated.value = Date.now()
    })
  }

  // Watch for provider changes and status changes
  watch([getProviderWidgetId, status], () => setupSubscription(), { immediate: true })

  // Connect to a provider
  function connect(providerWidgetId: string): boolean {
    const permission = boardStore.grantDataPermission(widgetId, providerWidgetId, contract.id)
    if (permission) {
      context.updateState({ [stateKey]: providerWidgetId } as Partial<TState>)
      return true
    }
    return false
  }

  // Disconnect from current provider
  function disconnect(): boolean {
    const providerWidgetId = getProviderWidgetId()
    if (!providerWidgetId) return false

    const result = boardStore.revokeDataPermissionByLink(widgetId, providerWidgetId, contract.id)
    if (result) {
      context.updateState({ [stateKey]: null } as Partial<TState>)
    }
    return result
  }

  // Manually refresh data
  function refresh(): void {
    const providerWidgetId = getProviderWidgetId()
    if (!providerWidgetId) return

    const cachedData = dataBus.getData(providerWidgetId, contract.id)
    if (cachedData !== null) {
      data.value = cachedData as TProjection
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

// ============================================================================
// Multi Consumer Implementation
// ============================================================================

function createMultiConsumer<TState, TProjection>(
  context: ModuleContext<TState>,
  contract: DataContract<TProjection>,
  stateKey: string
): UseConsumeDataMultiReturn<TProjection> {
  const { widgetId } = context
  const boardStore = useBoardStore()

  const subscriptions = new Map<string, () => void>()
  const dataCache = shallowRef(new Map<string, TProjection>())
  const lastUpdatedCache = shallowRef(new Map<string, number>())

  // Get provider IDs from state
  const getProviderIds = () =>
    ((context.state as Record<string, unknown>)[stateKey] ?? []) as string[]

  // Compute all connections with their status and data
  const connections = computed(() => {
    const result = new Map<string, DataConnection<TProjection>>()

    for (const providerId of getProviderIds()) {
      const providerExists = boardStore.widgets.some((w) => w.id === providerId)
      const hasPermission = boardStore.permissions.some(
        (p) =>
          p.consumerWidgetId === widgetId &&
          p.providerWidgetId === providerId &&
          p.contractId === contract.id
      )

      let status: ConnectionStatus
      if (!providerExists) status = 'broken'
      else if (!hasPermission) status = 'disconnected'
      else status = 'connected'

      result.set(providerId, {
        providerId,
        status,
        data: dataCache.value.get(providerId) ?? null,
        lastUpdated: lastUpdatedCache.value.get(providerId) ?? null,
      })
    }

    return result
  })

  // Convenience: flat array of all connected data
  const allData = computed(() => {
    return Array.from(connections.value.values())
      .filter((c) => c.status === 'connected' && c.data !== null)
      .map((c) => c.data!)
  })

  // Get available providers
  const availableProviders = computed(() => {
    return boardStore.getAvailableProviders(contract.id)
  })

  // Setup subscriptions for all providers
  function setupSubscriptions(): void {
    const currentProviders = new Set(getProviderIds())

    // Remove stale subscriptions
    let cacheChanged = false
    for (const [providerId, unsub] of subscriptions) {
      if (!currentProviders.has(providerId)) {
        unsub()
        subscriptions.delete(providerId)
        dataCache.value.delete(providerId)
        lastUpdatedCache.value.delete(providerId)
        cacheChanged = true
      }
    }

    // Add new subscriptions
    for (const providerId of currentProviders) {
      if (!subscriptions.has(providerId)) {
        const hasPermission = boardStore.permissions.some(
          (p) =>
            p.consumerWidgetId === widgetId &&
            p.providerWidgetId === providerId &&
            p.contractId === contract.id
        )

        if (hasPermission) {
          const unsub = dataBus.subscribe(widgetId, providerId, contract.id, (newData) => {
            const newCache = new Map(dataCache.value)
            newCache.set(providerId, newData as TProjection)
            dataCache.value = newCache

            const newTimestamps = new Map(lastUpdatedCache.value)
            newTimestamps.set(providerId, Date.now())
            lastUpdatedCache.value = newTimestamps
          })
          subscriptions.set(providerId, unsub)
        }
      }
    }

    // Trigger reactivity if cache was modified
    if (cacheChanged) {
      dataCache.value = new Map(dataCache.value)
      lastUpdatedCache.value = new Map(lastUpdatedCache.value)
    }
  }

  // Watch for provider list changes and permission changes
  watch(
    [getProviderIds, () => boardStore.permissions],
    () => setupSubscriptions(),
    { immediate: true, deep: true }
  )

  // Connect to a provider
  function connect(providerWidgetId: string): boolean {
    const permission = boardStore.grantDataPermission(widgetId, providerWidgetId, contract.id)
    if (permission) {
      const current = getProviderIds()
      if (!current.includes(providerWidgetId)) {
        context.updateState({ [stateKey]: [...current, providerWidgetId] } as Partial<TState>)
      }
      return true
    }
    return false
  }

  // Disconnect from a specific provider
  function disconnect(providerWidgetId: string): boolean {
    const result = boardStore.revokeDataPermissionByLink(widgetId, providerWidgetId, contract.id)
    if (result) {
      const current = getProviderIds()
      context.updateState({
        [stateKey]: current.filter((id) => id !== providerWidgetId),
      } as Partial<TState>)
    }
    return result
  }

  // Disconnect all providers
  function disconnectAll(): void {
    for (const providerId of getProviderIds()) {
      boardStore.revokeDataPermissionByLink(widgetId, providerId, contract.id)
    }
    context.updateState({ [stateKey]: [] } as Partial<TState>)
  }

  // Check if connected to a specific provider
  function isConnected(providerWidgetId: string): boolean {
    return connections.value.get(providerWidgetId)?.status === 'connected'
  }

  onUnmounted(() => {
    for (const unsub of subscriptions.values()) {
      unsub()
    }
  })

  return {
    connections,
    allData,
    availableProviders,
    connect,
    disconnect,
    disconnectAll,
    isConnected,
  }
}
