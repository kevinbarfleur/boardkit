/**
 * DataContractRegistry
 *
 * A singleton registry for data contracts. Modules register their contracts
 * here so consumers can discover available data sources.
 */

import type { DataContract } from '../types/dataContract'

class DataContractRegistry {
  private contracts = new Map<string, DataContract>()

  /**
   * Register a data contract.
   */
  register<T>(contract: DataContract<T>): void {
    if (this.contracts.has(contract.id)) {
      console.warn(`[DataContractRegistry] Contract "${contract.id}" already registered`)
    }
    this.contracts.set(contract.id, contract as DataContract)
  }

  /**
   * Get a contract by ID.
   */
  get<T = unknown>(contractId: string): DataContract<T> | undefined {
    return this.contracts.get(contractId) as DataContract<T> | undefined
  }

  /**
   * Check if a contract exists.
   */
  has(contractId: string): boolean {
    return this.contracts.has(contractId)
  }

  /**
   * Get all contracts for a specific provider module.
   */
  getByProvider(providerId: string): DataContract[] {
    return Array.from(this.contracts.values()).filter((c) => c.providerId === providerId)
  }

  /**
   * Get all registered contracts.
   */
  getAll(): DataContract[] {
    return Array.from(this.contracts.values())
  }

  /**
   * Unregister a contract by ID.
   */
  unregister(contractId: string): boolean {
    return this.contracts.delete(contractId)
  }

  /**
   * Clear all contracts (for testing).
   */
  clear(): void {
    this.contracts.clear()
  }
}

// Singleton instance
export const dataContractRegistry = new DataContractRegistry()
export { DataContractRegistry }
