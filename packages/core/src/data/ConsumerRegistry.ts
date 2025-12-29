/**
 * Consumer Registry
 *
 * Tracks which modules are data consumers and their configuration.
 * Used by the UI layer to determine available actions and settings.
 */

export interface ConsumerDefinition {
  /** Module ID of the consumer */
  moduleId: string
  /** Contract ID this consumer can consume */
  contractId: string
  /** Whether this consumer supports multiple data sources */
  multiSelect: boolean
  /** Key in module state where connection(s) are stored */
  stateKey: string
  /** Human-readable label for the data source type */
  sourceLabel?: string
}

class ConsumerRegistry {
  private consumers = new Map<string, ConsumerDefinition>()

  /**
   * Register a consumer module
   */
  register(definition: ConsumerDefinition): void {
    const key = `${definition.moduleId}:${definition.contractId}`
    this.consumers.set(key, definition)
  }

  /**
   * Unregister a consumer module
   */
  unregister(moduleId: string, contractId: string): void {
    const key = `${moduleId}:${contractId}`
    this.consumers.delete(key)
  }

  /**
   * Get consumer definition for a module and contract
   */
  get(moduleId: string, contractId: string): ConsumerDefinition | undefined {
    const key = `${moduleId}:${contractId}`
    return this.consumers.get(key)
  }

  /**
   * Get all consumer definitions for a module
   */
  getByModule(moduleId: string): ConsumerDefinition[] {
    return Array.from(this.consumers.values()).filter(
      (def) => def.moduleId === moduleId
    )
  }

  /**
   * Get all consumer definitions for a contract
   */
  getByContract(contractId: string): ConsumerDefinition[] {
    return Array.from(this.consumers.values()).filter(
      (def) => def.contractId === contractId
    )
  }

  /**
   * Check if a module is a consumer of any contract
   */
  isConsumer(moduleId: string): boolean {
    return Array.from(this.consumers.values()).some(
      (def) => def.moduleId === moduleId
    )
  }

  /**
   * Check if a module is a consumer of a specific contract
   */
  isConsumerOf(moduleId: string, contractId: string): boolean {
    const key = `${moduleId}:${contractId}`
    return this.consumers.has(key)
  }

  /**
   * Get all registered consumers
   */
  getAll(): ConsumerDefinition[] {
    return Array.from(this.consumers.values())
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.consumers.clear()
  }
}

export const consumerRegistry = new ConsumerRegistry()
export { ConsumerRegistry }
