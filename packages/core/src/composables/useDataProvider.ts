/**
 * useDataProvider
 *
 * A composable for modules that provide data to other modules.
 * Handles automatic publishing to the DataBus when state changes.
 */

import { watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { dataBus } from '../data/DataBus'
import { dataContractRegistry } from '../data/DataContractRegistry'
import type { DataContract } from '../types/dataContract'

interface UseDataProviderOptions<TState, TProjection> {
  /** Widget ID */
  widgetId: string
  /** Contract to provide */
  contract: DataContract<TProjection>
  /** Reactive state getter */
  getState: () => TState
  /** Function to project state to contract format */
  project: (state: TState) => TProjection
}

interface UseDataProviderReturn {
  /** Manually trigger a publish */
  publish: () => void
}

/**
 * Composable for modules that provide data to other modules.
 *
 * Usage:
 * ```ts
 * useDataProvider({
 *   widgetId: props.context.widgetId,
 *   contract: todoContractV1,
 *   getState: () => props.context.state,
 *   project: (state) => ({
 *     widgetId: props.context.widgetId,
 *     title: state.title,
 *     items: state.items,
 *     progress: { done: ..., total: ... },
 *   }),
 * })
 * ```
 */
export function useDataProvider<TState, TProjection>(
  options: UseDataProviderOptions<TState, TProjection>
): UseDataProviderReturn {
  const { widgetId, contract, getState, project } = options

  // Ensure contract is registered
  if (!dataContractRegistry.has(contract.id)) {
    dataContractRegistry.register(contract)
  }

  // Publish current data to the DataBus
  function publish(): void {
    const state = getState()
    const projection = project(state)
    dataBus.publish(widgetId, contract.id, projection)
  }

  // Initial publish
  publish()

  // Watch for state changes and republish
  const stopWatch = watch(getState, () => publish(), { deep: true })

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatch()
    // Note: We don't remove from dataBus here because the widget may
    // still exist (just re-rendering). The cleanup happens in removeWidget.
  })

  return {
    publish,
  }
}
