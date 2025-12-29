/**
 * DataAccessController
 *
 * Controls access permissions for data sharing between modules.
 * Validates that consumers have permission to read from providers.
 */

import { nanoid } from 'nanoid'
import type {
  DataPermission,
  DataLink,
  ConnectionStatus,
} from '../types/dataContract'
import { dataContractRegistry } from './DataContractRegistry'

class DataAccessController {
  /**
   * Check if a consumer has permission to read from a provider.
   */
  checkAccess(
    permissions: DataPermission[],
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): boolean {
    return permissions.some(
      (p) =>
        p.consumerWidgetId === consumerWidgetId &&
        p.providerWidgetId === providerWidgetId &&
        p.contractId === contractId &&
        p.scope === 'read'
    )
  }

  /**
   * Get connection status for a consumer-provider pair.
   */
  getConnectionStatus(
    permissions: DataPermission[],
    widgets: Array<{ id: string }>,
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): ConnectionStatus {
    // Check if provider widget exists
    const providerExists = widgets.some((w) => w.id === providerWidgetId)
    if (!providerExists) {
      return 'broken'
    }

    // Check permission
    const hasPermission = this.checkAccess(
      permissions,
      consumerWidgetId,
      providerWidgetId,
      contractId
    )

    return hasPermission ? 'connected' : 'disconnected'
  }

  /**
   * Create a new permission.
   */
  createPermission(
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): DataPermission {
    return {
      id: nanoid(),
      consumerWidgetId,
      providerWidgetId,
      contractId,
      scope: 'read',
      grantedAt: Date.now(),
    }
  }

  /**
   * Create a link from a permission.
   */
  createLink(permission: DataPermission): DataLink {
    return {
      consumerWidgetId: permission.consumerWidgetId,
      providerWidgetId: permission.providerWidgetId,
      contractId: permission.contractId,
    }
  }

  /**
   * Find a specific permission.
   */
  findPermission(
    permissions: DataPermission[],
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): DataPermission | undefined {
    return permissions.find(
      (p) =>
        p.consumerWidgetId === consumerWidgetId &&
        p.providerWidgetId === providerWidgetId &&
        p.contractId === contractId
    )
  }

  /**
   * Find all permissions for a consumer widget.
   */
  getConsumerPermissions(
    permissions: DataPermission[],
    consumerWidgetId: string
  ): DataPermission[] {
    return permissions.filter((p) => p.consumerWidgetId === consumerWidgetId)
  }

  /**
   * Find all permissions for a provider widget.
   */
  getProviderPermissions(
    permissions: DataPermission[],
    providerWidgetId: string
  ): DataPermission[] {
    return permissions.filter((p) => p.providerWidgetId === providerWidgetId)
  }

  /**
   * Get all widgets that can provide a specific contract.
   */
  getAvailableProviders(
    widgets: Array<{ id: string; moduleId: string }>,
    contractId: string
  ): Array<{ id: string; moduleId: string }> {
    const contract = dataContractRegistry.get(contractId)
    if (!contract) return []

    return widgets.filter((w) => w.moduleId === contract.providerId)
  }

  /**
   * Check if a widget can be a provider for a contract.
   */
  canProvide(
    widgets: Array<{ id: string; moduleId: string }>,
    widgetId: string,
    contractId: string
  ): boolean {
    const contract = dataContractRegistry.get(contractId)
    if (!contract) return false

    const widget = widgets.find((w) => w.id === widgetId)
    if (!widget) return false

    return widget.moduleId === contract.providerId
  }
}

// Singleton instance
export const dataAccessController = new DataAccessController()
export { DataAccessController }
