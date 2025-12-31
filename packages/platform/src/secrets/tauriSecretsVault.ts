/**
 * Tauri Secrets Vault Implementation
 *
 * Stores secrets in a JSON file in the app's local data directory.
 * File location: $APP_LOCAL_DATA/secrets.json
 *
 * Note: For enhanced security, consider adding encryption in the future.
 * For now, relying on OS-level file permissions is acceptable for desktop apps.
 */

import {
  readFile,
  writeFile,
  exists,
  mkdir,
  remove,
  BaseDirectory,
} from '@tauri-apps/plugin-fs'
import type { SecretsVault } from '@boardkit/core'

const SECRETS_DIR = 'boardkit-secrets'
const SECRETS_FILE = 'vault.json'

type SecretsData = Record<string, string>

let cachedSecrets: SecretsData | null = null

/**
 * Get the full path for the secrets file.
 */
function getSecretsPath(): string {
  return `${SECRETS_DIR}/${SECRETS_FILE}`
}

/**
 * Ensure the secrets directory exists.
 */
async function ensureSecretsDir(): Promise<void> {
  try {
    const dirExists = await exists(SECRETS_DIR, { baseDir: BaseDirectory.AppLocalData })
    if (!dirExists) {
      await mkdir(SECRETS_DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true })
    }
  } catch (error) {
    console.error('Failed to create secrets directory:', error)
    throw error
  }
}

/**
 * Load secrets from the filesystem.
 */
async function loadSecrets(): Promise<SecretsData> {
  if (cachedSecrets !== null) {
    return cachedSecrets
  }

  try {
    const secretsPath = getSecretsPath()
    const fileExists = await exists(secretsPath, { baseDir: BaseDirectory.AppLocalData })

    if (!fileExists) {
      cachedSecrets = {}
      return cachedSecrets
    }

    const data = await readFile(secretsPath, { baseDir: BaseDirectory.AppLocalData })
    const decoder = new TextDecoder()
    const json = decoder.decode(data)

    cachedSecrets = JSON.parse(json) as SecretsData
    return cachedSecrets
  } catch (error) {
    console.error('Failed to load secrets:', error)
    cachedSecrets = {}
    return cachedSecrets
  }
}

/**
 * Save secrets to the filesystem.
 */
async function saveSecrets(secrets: SecretsData): Promise<void> {
  await ensureSecretsDir()

  const encoder = new TextEncoder()
  const json = JSON.stringify(secrets, null, 2)
  const data = encoder.encode(json)

  const secretsPath = getSecretsPath()
  await writeFile(secretsPath, data, { baseDir: BaseDirectory.AppLocalData })

  cachedSecrets = secrets
}

/**
 * Tauri implementation of SecretsVault using filesystem storage.
 */
export const tauriSecretsVault: SecretsVault = {
  async get(key: string): Promise<string | null> {
    const secrets = await loadSecrets()
    return secrets[key] ?? null
  },

  async set(key: string, value: string): Promise<void> {
    const secrets = await loadSecrets()
    secrets[key] = value
    await saveSecrets(secrets)
  },

  async delete(key: string): Promise<void> {
    const secrets = await loadSecrets()
    delete secrets[key]
    await saveSecrets(secrets)
  },

  async listKeys(): Promise<string[]> {
    const secrets = await loadSecrets()
    return Object.keys(secrets)
  },

  async has(key: string): Promise<boolean> {
    const secrets = await loadSecrets()
    return key in secrets
  },

  async clear(): Promise<void> {
    await ensureSecretsDir()

    const secretsPath = getSecretsPath()
    const fileExists = await exists(secretsPath, { baseDir: BaseDirectory.AppLocalData })

    if (fileExists) {
      await remove(secretsPath, { baseDir: BaseDirectory.AppLocalData })
    }

    cachedSecrets = {}
  },
}
