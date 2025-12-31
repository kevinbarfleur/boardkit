/**
 * useSecrets Composable
 *
 * Provides access to the secrets vault for storing and retrieving sensitive data.
 * Secrets are stored separately from .boardkit documents and are never exported.
 *
 * @example
 * const { getSecret, setSecret, resolveSecretRef } = useSecrets()
 *
 * // Store a secret
 * const ref = await setSecret('google_client_id', 'my-client-id')
 * // ref = "secret:google_client_id"
 *
 * // Retrieve a secret
 * const value = await getSecret('google_client_id')
 * // value = "my-client-id"
 *
 * // Resolve a reference from state
 * const resolved = await resolveSecretRef(state.apiKey)
 * // If state.apiKey = "secret:my_key", resolves to the actual value
 * // If state.apiKey = "plain_value", returns "plain_value"
 */

import { getSecretsVault, isSecretsVaultInitialized } from '../services/secretsVault'
import {
  isSecretRef,
  getSecretKey,
  makeSecretRef,
} from '../types/secretsVault'

export interface UseSecretsReturn {
  /**
   * Get a secret value by its key.
   * @param key - The secret key
   * @returns The secret value, or null if not found
   */
  getSecret: (key: string) => Promise<string | null>

  /**
   * Store a secret and return a reference to use in state.
   * @param key - The key to store the secret under
   * @param value - The secret value to store
   * @returns The secret reference string (e.g., "secret:my_key")
   */
  setSecret: (key: string, value: string) => Promise<string>

  /**
   * Delete a secret by its key.
   * @param key - The secret key to delete
   */
  deleteSecret: (key: string) => Promise<void>

  /**
   * Resolve a value that might be a secret reference.
   * If the value starts with "secret:", resolves from vault.
   * Otherwise returns the value as-is.
   * @param value - The value to resolve (might be a secret ref or plain value)
   * @returns The resolved value
   */
  resolveSecretRef: (value: unknown) => Promise<string | null>

  /**
   * Check if the secrets vault is available.
   * @returns True if vault is initialized
   */
  isVaultAvailable: () => boolean

  /**
   * Check if a secret exists.
   * @param key - The secret key to check
   * @returns True if the secret exists
   */
  hasSecret: (key: string) => Promise<boolean>

  /**
   * List all secret keys (not values).
   * @returns Array of secret keys
   */
  listSecretKeys: () => Promise<string[]>
}

/**
 * Composable for working with secrets.
 * Use this in module components to securely store and retrieve sensitive data.
 */
export function useSecrets(): UseSecretsReturn {
  const isVaultAvailable = (): boolean => {
    return isSecretsVaultInitialized()
  }

  const getSecret = async (key: string): Promise<string | null> => {
    if (!isVaultAvailable()) {
      console.warn('SecretsVault not available')
      return null
    }
    return getSecretsVault().get(key)
  }

  const setSecret = async (key: string, value: string): Promise<string> => {
    if (!isVaultAvailable()) {
      throw new Error('SecretsVault not initialized')
    }
    await getSecretsVault().set(key, value)
    return makeSecretRef(key)
  }

  const deleteSecret = async (key: string): Promise<void> => {
    if (!isVaultAvailable()) {
      console.warn('SecretsVault not available')
      return
    }
    await getSecretsVault().delete(key)
  }

  const resolveSecretRef = async (value: unknown): Promise<string | null> => {
    if (!isSecretRef(value)) {
      return value as string | null
    }

    const key = getSecretKey(value)
    return getSecret(key)
  }

  const hasSecret = async (key: string): Promise<boolean> => {
    if (!isVaultAvailable()) {
      return false
    }
    return getSecretsVault().has(key)
  }

  const listSecretKeys = async (): Promise<string[]> => {
    if (!isVaultAvailable()) {
      return []
    }
    return getSecretsVault().listKeys()
  }

  return {
    getSecret,
    setSecret,
    deleteSecret,
    resolveSecretRef,
    isVaultAvailable,
    hasSecret,
    listSecretKeys,
  }
}
