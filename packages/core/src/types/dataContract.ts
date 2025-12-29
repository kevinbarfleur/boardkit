/**
 * Data Contract Types
 *
 * These types define the inter-module data sharing system for Boardkit.
 * Modules can expose data through versioned contracts, and other modules
 * can consume this data in a read-only, permission-controlled manner.
 */

// ============================================================================
// Contract Types
// ============================================================================

/**
 * A versioned data contract that defines a schema for inter-module data sharing.
 * Contract IDs follow the pattern: `boardkit.<moduleId>.v<major>`
 */
export interface DataContract<T = unknown> {
  /** Unique contract identifier (e.g., 'boardkit.todo.v1') */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what data this contract exposes */
  description: string
  /** Version string (semver) */
  version: string
  /** The module ID that can provide this contract */
  providerId: string
  /** Optional phantom type for TypeScript inference */
  _type?: T
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * A permission grant allowing a consumer to read data from a provider.
 */
export interface DataPermission {
  /** Unique permission ID */
  id: string
  /** Widget ID of the consumer */
  consumerWidgetId: string
  /** Widget ID of the provider */
  providerWidgetId: string
  /** Contract being accessed */
  contractId: string
  /** Permission scope (read-only for V0) */
  scope: 'read'
  /** Timestamp when permission was granted */
  grantedAt: number
}

/**
 * A link between consumer and provider (simplified view of permission).
 */
export interface DataLink {
  /** Consumer widget ID */
  consumerWidgetId: string
  /** Provider widget ID */
  providerWidgetId: string
  /** Contract ID */
  contractId: string
}

// ============================================================================
// Document Extension
// ============================================================================

/**
 * Data sharing section of the document.
 * Added in document version 2.
 */
export interface DataSharingState {
  permissions: DataPermission[]
  links: DataLink[]
}

// ============================================================================
// Connection Types
// ============================================================================

/**
 * Status of a data connection from consumer's perspective.
 */
export type ConnectionStatus =
  | 'connected' // Provider exists and permission granted
  | 'disconnected' // Permission revoked or never granted
  | 'broken' // Provider widget was deleted
  | 'pending' // Permission requested but not yet granted

/**
 * A consumer's view of a connected provider.
 */
export interface DataConnection<T = unknown> {
  /** Provider widget ID */
  providerWidgetId: string
  /** Contract ID */
  contractId: string
  /** Current connection status */
  status: ConnectionStatus
  /** Current data (null if not connected or broken) */
  data: T | null
  /** Last update timestamp */
  lastUpdated: number | null
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an empty data sharing state.
 */
export function createEmptyDataSharingState(): DataSharingState {
  return {
    permissions: [],
    links: [],
  }
}
