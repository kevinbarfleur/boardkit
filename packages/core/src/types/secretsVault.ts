/**
 * SecretsVault Interface
 *
 * Provides secure storage for sensitive data (API keys, tokens, etc.)
 * that should NOT be stored in .boardkit files.
 *
 * Secrets are stored separately from documents:
 * - Web: IndexedDB "boardkit-secrets" store
 * - Desktop: Local filesystem (with optional encryption)
 *
 * In module state, secrets are referenced as "secret:key_name"
 * and resolved at runtime via this vault.
 */

export interface SecretsVault {
  /**
   * Get a secret value by key.
   * @returns The secret value, or null if not found
   */
  get(key: string): Promise<string | null>

  /**
   * Set a secret value.
   * @param key - The key to store the secret under
   * @param value - The secret value to store
   */
  set(key: string, value: string): Promise<void>

  /**
   * Delete a secret.
   * @param key - The key of the secret to delete
   */
  delete(key: string): Promise<void>

  /**
   * List all secret keys (not values).
   * @returns Array of all stored secret keys
   */
  listKeys(): Promise<string[]>

  /**
   * Check if a secret exists.
   * @param key - The key to check
   * @returns True if the secret exists
   */
  has(key: string): Promise<boolean>

  /**
   * Clear all secrets from the vault.
   * Use with caution - this is destructive.
   */
  clear(): Promise<void>
}

/**
 * Secret reference prefix used in module state.
 * Values starting with this prefix are resolved via the vault.
 */
export const SECRET_REF_PREFIX = 'secret:'

/**
 * Check if a value is a secret reference.
 */
export function isSecretRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(SECRET_REF_PREFIX)
}

/**
 * Extract the secret key from a reference.
 * @param ref - The secret reference (e.g., "secret:my_api_key")
 * @returns The key (e.g., "my_api_key")
 */
export function getSecretKey(ref: string): string {
  return ref.replace(SECRET_REF_PREFIX, '')
}

/**
 * Create a secret reference from a key.
 * @param key - The secret key
 * @returns The reference string (e.g., "secret:my_api_key")
 */
export function makeSecretRef(key: string): string {
  return `${SECRET_REF_PREFIX}${key}`
}
