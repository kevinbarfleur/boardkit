import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  migrateDocument,
  needsMigration,
  getDocumentVersion,
  CURRENT_DOCUMENT_VERSION,
} from '../src/migrations'

describe('Document Migrations', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('getDocumentVersion()', () => {
    it('should return version from document', () => {
      expect(getDocumentVersion({ version: 2 })).toBe(2)
      expect(getDocumentVersion({ version: 1 })).toBe(1)
      expect(getDocumentVersion({ version: 0 })).toBe(0)
    })

    it('should return 0 for document without version', () => {
      expect(getDocumentVersion({})).toBe(0)
      expect(getDocumentVersion({ board: {} })).toBe(0)
    })

    it('should return 0 for invalid input', () => {
      expect(getDocumentVersion(null)).toBe(0)
      expect(getDocumentVersion(undefined)).toBe(0)
      expect(getDocumentVersion('string')).toBe(0)
      expect(getDocumentVersion(123)).toBe(0)
    })
  })

  describe('needsMigration()', () => {
    it('should return true for old versions', () => {
      expect(needsMigration({ version: 0 })).toBe(true)
      expect(needsMigration({ version: 1 })).toBe(true)
      expect(needsMigration({})).toBe(true) // No version = v0
    })

    it('should return false for current version', () => {
      expect(needsMigration({ version: CURRENT_DOCUMENT_VERSION })).toBe(false)
    })

    it('should return false for invalid input', () => {
      expect(needsMigration(null)).toBe(false)
      expect(needsMigration(undefined)).toBe(false)
    })
  })

  describe('migrateDocument()', () => {
    it('should throw for invalid input', () => {
      expect(() => migrateDocument(null)).toThrow('Invalid document: expected an object')
      expect(() => migrateDocument(undefined)).toThrow('Invalid document: expected an object')
      expect(() => migrateDocument('string')).toThrow('Invalid document: expected an object')
    })

    it('should return document unchanged if already at current version', () => {
      const doc = {
        version: CURRENT_DOCUMENT_VERSION,
        meta: { title: 'Test' },
        board: { widgets: [], elements: [], background: { pattern: 'dots', color: 'auto' } },
        modules: {},
        dataSharing: { permissions: [], links: [] },
      }

      const result = migrateDocument(doc)

      expect(result).toBe(doc) // Same reference, no modification
    })

    it('should throw for future versions', () => {
      const futureDoc = {
        version: CURRENT_DOCUMENT_VERSION + 1,
        meta: { title: 'Future' },
      }

      expect(() => migrateDocument(futureDoc)).toThrow(
        `Document version ${CURRENT_DOCUMENT_VERSION + 1} is newer than supported version ${CURRENT_DOCUMENT_VERSION}`
      )
    })

    describe('v0 -> v1 migration', () => {
      it('should add elements array', () => {
        const v0Doc = {
          version: 0,
          meta: { title: 'V0 Doc' },
          board: { widgets: [] },
          modules: {},
        }

        const result = migrateDocument(v0Doc)

        expect(result.board.elements).toBeDefined()
        expect(Array.isArray(result.board.elements)).toBe(true)
      })

      it('should add background configuration', () => {
        const v0Doc = {
          version: 0,
          meta: { title: 'V0 Doc' },
          board: { widgets: [] },
          modules: {},
        }

        const result = migrateDocument(v0Doc)

        expect(result.board.background).toBeDefined()
        expect(result.board.background.pattern).toBe('dots')
        expect(result.board.background.color).toBe('auto')
      })

      it('should preserve existing elements if present', () => {
        const v0Doc = {
          version: 0,
          meta: { title: 'V0 Doc' },
          board: {
            widgets: [],
            elements: [{ id: 'existing-element' }],
          },
          modules: {},
        }

        const result = migrateDocument(v0Doc)

        expect(result.board.elements).toEqual([{ id: 'existing-element' }])
      })
    })

    describe('v1 -> v2 migration', () => {
      it('should add dataSharing', () => {
        const v1Doc = {
          version: 1,
          meta: { title: 'V1 Doc' },
          board: {
            widgets: [],
            elements: [],
            background: { pattern: 'dots', color: 'auto' },
          },
          modules: {},
        }

        const result = migrateDocument(v1Doc)

        expect(result.dataSharing).toBeDefined()
        expect(result.dataSharing.permissions).toEqual([])
        expect(result.dataSharing.links).toEqual([])
      })

      it('should preserve existing dataSharing if present', () => {
        const v1Doc = {
          version: 1,
          meta: { title: 'V1 Doc' },
          board: { widgets: [], elements: [], background: { pattern: 'dots', color: 'auto' } },
          modules: {},
          dataSharing: {
            permissions: [{ widgetId: 'test', contracts: ['contract-1'] }],
            links: [],
          },
        }

        const result = migrateDocument(v1Doc)

        expect(result.dataSharing.permissions).toHaveLength(1)
        expect(result.dataSharing.permissions[0].widgetId).toBe('test')
      })
    })

    describe('full migration path v0 -> v2', () => {
      it('should migrate through all versions', () => {
        const v0Doc = {
          // No version = v0
          meta: { title: 'Very Old Doc', created: '2024-01-01' },
          board: { widgets: [{ id: 'widget-1', moduleId: 'text' }] },
          modules: { 'widget-1': { content: 'Hello' } },
        }

        const result = migrateDocument(v0Doc)

        // Should be at current version
        expect(result.version).toBe(CURRENT_DOCUMENT_VERSION)

        // Should have v1 additions
        expect(result.board.elements).toBeDefined()
        expect(result.board.background).toBeDefined()

        // Should have v2 additions
        expect(result.dataSharing).toBeDefined()

        // Should preserve original data
        expect(result.meta.title).toBe('Very Old Doc')
        expect(result.board.widgets).toHaveLength(1)
        expect(result.modules['widget-1'].content).toBe('Hello')
      })

      it('should log migration steps', () => {
        const v0Doc = {
          meta: { title: 'Test' },
          board: { widgets: [] },
          modules: {},
        }

        migrateDocument(v0Doc)

        expect(consoleLogSpy).toHaveBeenCalledWith('Migrating document from v0 to v1')
        expect(consoleLogSpy).toHaveBeenCalledWith('Migrating document from v1 to v2')
      })
    })
  })

  describe('CURRENT_DOCUMENT_VERSION', () => {
    it('should be 2', () => {
      expect(CURRENT_DOCUMENT_VERSION).toBe(2)
    })
  })
})
