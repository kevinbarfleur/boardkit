import type { ModuleDefinition } from '../types/module'
import { consumerRegistry } from '../data/ConsumerRegistry'
import { dataContractRegistry } from '../data/DataContractRegistry'

/**
 * Define a Boardkit module.
 * This is the primary API for creating modules.
 *
 * @example
 * ```ts
 * const TextModule = defineModule({
 *   moduleId: 'text',
 *   version: '0.1.0',
 *   displayName: 'Text',
 *   component: TextWidget,
 *   defaultState: () => ({ content: '' }),
 *   serialize: (state) => state,
 *   deserialize: (data) => data as TextState,
 * })
 * ```
 */
export function defineModule<TState>(
  definition: ModuleDefinition<TState>
): ModuleDefinition<TState> {
  // Validate required fields
  if (!definition.moduleId) {
    throw new Error('Module must have a moduleId')
  }
  if (!definition.version) {
    throw new Error('Module must have a version')
  }
  if (!definition.component) {
    throw new Error('Module must have a component')
  }
  if (!definition.defaultState) {
    throw new Error('Module must have a defaultState function')
  }
  if (!definition.serialize) {
    throw new Error('Module must have a serialize function')
  }
  if (!definition.deserialize) {
    throw new Error('Module must have a deserialize function')
  }

  // Auto-register consumers
  if (definition.consumes) {
    for (const config of definition.consumes) {
      consumerRegistry.register({
        moduleId: definition.moduleId,
        contractId: config.contract.id,
        multiSelect: config.multi ?? false,
        stateKey: config.stateKey,
        sourceLabel: config.sourceLabel,
      })
    }
  }

  // Auto-register provided contracts
  if (definition.provides) {
    for (const contract of definition.provides) {
      if (!dataContractRegistry.has(contract.id)) {
        dataContractRegistry.register(contract)
      }
    }
  }

  return {
    minWidth: 200,
    minHeight: 100,
    defaultWidth: 300,
    defaultHeight: 200,
    ...definition,
  }
}
