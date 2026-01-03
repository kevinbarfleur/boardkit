/**
 * Document Migration System
 *
 * Handles migration of BoardkitDocument from older versions to the current version.
 * Each migration defines how to transform a document from one version to the next.
 */

import type { BoardkitDocument } from '../types/document'
import { CURRENT_DOCUMENT_VERSION } from '../types/document'
import { DEFAULT_BACKGROUND } from '../types/element'

// ============================================================================
// Types
// ============================================================================

/**
 * A migration that transforms a document from one version to another.
 */
export interface Migration {
  /** Source version */
  fromVersion: number
  /** Target version */
  toVersion: number
  /** Migration function */
  migrate: (doc: LegacyDocument) => LegacyDocument
}

/**
 * Legacy document type (allows any structure for migration).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyDocument = any

// ============================================================================
// Migrations
// ============================================================================

const migrations: Migration[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (doc: LegacyDocument): LegacyDocument => {
      // Migration v0 -> v1:
      // - Add elements array (empty)
      // - Add background configuration
      return {
        ...doc,
        version: 1,
        board: {
          ...doc.board,
          elements: doc.board.elements ?? [],
          background: doc.board.background ?? { ...DEFAULT_BACKGROUND },
        },
      }
    },
  },
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (doc: LegacyDocument): LegacyDocument => {
      // Migration v1 -> v2:
      // - Add dataSharing for inter-module data sharing
      return {
        ...doc,
        version: 2,
        dataSharing: doc.dataSharing ?? {
          permissions: [],
          links: [],
        },
      }
    },
  },
  {
    fromVersion: 2,
    toVersion: 3,
    migrate: (doc: LegacyDocument): LegacyDocument => {
      // Migration v2 -> v3:
      // - Add assets registry for binary files (images)
      return {
        ...doc,
        version: 3,
        assets: doc.assets ?? {
          assets: {},
        },
      }
    },
  },
  {
    fromVersion: 3,
    toVersion: 4,
    migrate: (doc: LegacyDocument): LegacyDocument => {
      // Migration v3 -> v4:
      // - Add canvasSettings for zoom sensitivity, snap-to-grid, and grid spacing
      // - Migrate grid.enabled to canvasSettings.snapToGrid
      const snapEnabled = doc.board?.grid?.enabled ?? true
      return {
        ...doc,
        version: 4,
        board: {
          ...doc.board,
          canvasSettings: {
            zoomSensitivity: 0.002,
            snapToGrid: snapEnabled,
            gridSpacing: 20,
          },
        },
      }
    },
  },
]

// ============================================================================
// Migration Engine
// ============================================================================

/**
 * Find the migration path from one version to another.
 */
function findMigrationPath(fromVersion: number, toVersion: number): Migration[] {
  const path: Migration[] = []
  let currentVersion = fromVersion

  while (currentVersion < toVersion) {
    const migration = migrations.find((m) => m.fromVersion === currentVersion)
    if (!migration) {
      throw new Error(
        `No migration found for version ${currentVersion}. ` +
          `Cannot migrate from v${fromVersion} to v${toVersion}.`
      )
    }
    path.push(migration)
    currentVersion = migration.toVersion
  }

  return path
}

/**
 * Migrate a document to the current version.
 *
 * @param doc - The document to migrate (may be any version)
 * @returns The migrated document with the current version
 * @throws Error if no migration path exists
 */
export function migrateDocument(doc: unknown): BoardkitDocument {
  // Validate basic structure
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid document: expected an object')
  }

  const legacyDoc = doc as LegacyDocument

  // Get document version (default to 0 for very old documents)
  const docVersion = typeof legacyDoc.version === 'number' ? legacyDoc.version : 0

  // Already at current version?
  if (docVersion === CURRENT_DOCUMENT_VERSION) {
    return legacyDoc as BoardkitDocument
  }

  // Future version?
  if (docVersion > CURRENT_DOCUMENT_VERSION) {
    throw new Error(
      `Document version ${docVersion} is newer than supported version ${CURRENT_DOCUMENT_VERSION}. ` +
        `Please update Boardkit to open this document.`
    )
  }

  // Find and apply migrations
  const migrationPath = findMigrationPath(docVersion, CURRENT_DOCUMENT_VERSION)
  let migratedDoc = legacyDoc

  for (const migration of migrationPath) {
    console.log(`Migrating document from v${migration.fromVersion} to v${migration.toVersion}`)
    migratedDoc = migration.migrate(migratedDoc)
  }

  return migratedDoc as BoardkitDocument
}

/**
 * Check if a document needs migration.
 */
export function needsMigration(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') {
    return false
  }

  const legacyDoc = doc as LegacyDocument
  const docVersion = typeof legacyDoc.version === 'number' ? legacyDoc.version : 0

  return docVersion < CURRENT_DOCUMENT_VERSION
}

/**
 * Get the version of a document.
 */
export function getDocumentVersion(doc: unknown): number {
  if (!doc || typeof doc !== 'object') {
    return 0
  }

  const legacyDoc = doc as LegacyDocument
  return typeof legacyDoc.version === 'number' ? legacyDoc.version : 0
}

// Re-export the current version for convenience
export { CURRENT_DOCUMENT_VERSION }
