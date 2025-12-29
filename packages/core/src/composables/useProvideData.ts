/**
 * useProvideData
 *
 * Simplified composable for modules that provide data to other modules.
 * Takes ModuleContext directly for a cleaner API.
 */

import { watch, onUnmounted } from 'vue'
import { dataBus } from '../data/DataBus'
import { dataContractRegistry } from '../data/DataContractRegistry'
import type { ModuleContext } from '../types/module'
import type { DataContract } from '../types/dataContract'

interface UseProvideDataOptions<TState, TProjection> {
  /**
   * Function to project module state to contract format.
   * If not provided, the state is published as-is (must match contract shape).
   */
  project?: (state: TState, widgetId: string) => TProjection
}

interface UseProvideDataReturn {
  /** Manually trigger a publish */
  publish: () => void
}

/**
 * Simplified composable for data providers.
 *
 * @example
 * // Simple: state matches contract shape (no projection needed)
 * useProvideData(props.context, todoContractV1)
 *
 * @example
 * // With projection: transform state to contract shape
 * useProvideData(props.context, todoContractV1, {
 *   project: (state, widgetId) => ({
 *     widgetId,
 *     title: state.title,
 *     items: state.items.map(({ id, label, completed }) => ({ id, label, completed })),
 *     progress: { done: state.items.filter(i => i.completed).length, total: state.items.length }
 *   })
 * })
 */
export function useProvideData<TState, TProjection>(
  context: ModuleContext<TState>,
  contract: DataContract<TProjection>,
  options?: UseProvideDataOptions<TState, TProjection>
): UseProvideDataReturn {
  const { widgetId } = context
  const project = options?.project

  // Ensure contract is registered
  if (!dataContractRegistry.has(contract.id)) {
    dataContractRegistry.register(contract)
  }

  // Publish current data to the DataBus
  function publish(): void {
    const state = context.state
    const data = project
      ? project(state, widgetId)
      : (state as unknown as TProjection)
    dataBus.publish(widgetId, contract.id, data)
  }

  // Initial publish
  publish()

  // Watch for state changes and republish
  const stopWatch = watch(
    () => context.state,
    () => publish(),
    { deep: true }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatch()
  })

  return {
    publish,
  }
}
