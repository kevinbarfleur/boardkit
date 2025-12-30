import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBoardStore } from './boardStore'
import type { DataPermission } from '../types/dataContract'

/**
 * Data Sharing Store
 *
 * Provides a dedicated API for data sharing operations.
 * Delegates to boardStore for implementation.
 *
 * This store offers:
 * - Cleaner API for data sharing operations
 * - Better testability
 * - Preparation for future separation of concerns
 */
export const useDataSharingStore = defineStore('dataSharing', () => {
  // Access to the board store
  const boardStore = useBoardStore()

  // ============================================================================
  // Computed State (Read-only views)
  // ============================================================================

  const dataSharing = computed(() => boardStore.document?.dataSharing)
  const permissions = computed(() => boardStore.permissions)
  const dataLinks = computed(() => boardStore.dataLinks)

  // ============================================================================
  // Permission Management (Delegates to boardStore)
  // ============================================================================

  /**
   * Grant permission for a consumer to read from a provider.
   */
  function grantDataPermission(
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): DataPermission | null {
    return boardStore.grantDataPermission(consumerWidgetId, providerWidgetId, contractId)
  }

  /**
   * Revoke a data permission by ID.
   */
  function revokeDataPermission(permissionId: string): boolean {
    return boardStore.revokeDataPermission(permissionId)
  }

  /**
   * Revoke permission by consumer, provider, and contract IDs.
   */
  function revokeDataPermissionByLink(
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): boolean {
    return boardStore.revokeDataPermissionByLink(consumerWidgetId, providerWidgetId, contractId)
  }

  /**
   * Clean up data sharing state when a widget is deleted.
   * Note: This is called internally by boardStore.removeWidget()
   */
  function cleanupWidgetDataSharing(widgetId: string): void {
    // This delegates to the boardStore's internal function
    // which handles both permission cleanup and DataBus cleanup
    const doc = boardStore.document
    if (!doc?.dataSharing) return

    // Remove all permissions where widget is consumer or provider
    doc.dataSharing.permissions = doc.dataSharing.permissions.filter(
      (p) => p.consumerWidgetId !== widgetId && p.providerWidgetId !== widgetId
    )

    // Remove all links
    doc.dataSharing.links = doc.dataSharing.links.filter(
      (l) => l.consumerWidgetId !== widgetId && l.providerWidgetId !== widgetId
    )
  }

  // ============================================================================
  // Queries (Delegates to boardStore)
  // ============================================================================

  /**
   * Get all permissions for a consumer widget.
   */
  function getConsumerPermissions(consumerWidgetId: string): DataPermission[] {
    return boardStore.getConsumerPermissions(consumerWidgetId)
  }

  /**
   * Get all permissions for a provider widget.
   */
  function getProviderPermissions(providerWidgetId: string): DataPermission[] {
    return boardStore.getProviderPermissions(providerWidgetId)
  }

  /**
   * Get all widgets that can provide a specific contract.
   */
  function getAvailableProviders(contractId: string): Array<{ id: string; moduleId: string }> {
    return boardStore.getAvailableProviders(contractId)
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State (read-only)
    dataSharing,
    permissions,
    dataLinks,

    // Mutations
    grantDataPermission,
    revokeDataPermission,
    revokeDataPermissionByLink,
    cleanupWidgetDataSharing,

    // Queries
    getConsumerPermissions,
    getProviderPermissions,
    getAvailableProviders,
  }
})
