/**
 * SecretsVault Service
 *
 * Singleton for managing secrets across the application.
 * Platform-specific implementations are injected at app startup.
 */

import type { SecretsVault } from '../types/secretsVault'

let vaultInstance: SecretsVault | null = null

/**
 * Set the secrets vault implementation.
 * Must be called once at app startup before any secret operations.
 *
 * @example
 * // In apps/web/src/main.ts
 * import { setSecretsVault } from '@boardkit/core'
 * import { webSecretsVault } from '@boardkit/platform'
 * setSecretsVault(webSecretsVault)
 *
 * @example
 * // In apps/desktop/src/main.ts
 * import { setSecretsVault } from '@boardkit/core'
 * import { tauriSecretsVault } from '@boardkit/platform'
 * setSecretsVault(tauriSecretsVault)
 */
export function setSecretsVault(vault: SecretsVault): void {
  if (vaultInstance) {
    console.warn('SecretsVault already initialized. Replacing instance.')
  }
  vaultInstance = vault
}

/**
 * Get the secrets vault instance.
 * Throws if not initialized.
 */
export function getSecretsVault(): SecretsVault {
  if (!vaultInstance) {
    throw new Error(
      'SecretsVault not initialized. Call setSecretsVault() at app startup.'
    )
  }
  return vaultInstance
}

/**
 * Check if the secrets vault is initialized.
 */
export function isSecretsVaultInitialized(): boolean {
  return vaultInstance !== null
}
