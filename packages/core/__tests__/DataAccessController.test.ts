import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DataAccessController, dataAccessController } from '../src/data/DataAccessController'
import { dataContractRegistry } from '../src/data/DataContractRegistry'
import type { DataPermission, DataContract } from '../src/types/dataContract'

// =============================================================================
// Mock Data
// =============================================================================

const mockContract: DataContract = {
  id: 'boardkit.mock.v1',
  name: 'Mock Contract',
  description: 'A mock contract for testing',
  version: '1.0.0',
  providerId: 'mock-module',
}

const mockContract2: DataContract = {
  id: 'boardkit.other.v1',
  name: 'Other Contract',
  description: 'Another mock contract',
  version: '1.0.0',
  providerId: 'other-module',
}

function createTestPermission(overrides: Partial<DataPermission> = {}): DataPermission {
  return {
    id: 'perm-1',
    consumerWidgetId: 'consumer-1',
    providerWidgetId: 'provider-1',
    contractId: 'boardkit.mock.v1',
    scope: 'read',
    grantedAt: Date.now(),
    ...overrides,
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('DataAccessController', () => {
  let controller: DataAccessController

  beforeEach(() => {
    controller = new DataAccessController()
    dataContractRegistry.clear()
    dataContractRegistry.register(mockContract)
    dataContractRegistry.register(mockContract2)
  })

  afterEach(() => {
    dataContractRegistry.clear()
  })

  // ===========================================================================
  // checkAccess()
  // ===========================================================================

  describe('checkAccess()', () => {
    it('should return true when permission exists', () => {
      const permissions = [createTestPermission()]

      const hasAccess = controller.checkAccess(
        permissions,
        'consumer-1',
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(hasAccess).toBe(true)
    })

    it('should return false when no permission exists', () => {
      const permissions: DataPermission[] = []

      const hasAccess = controller.checkAccess(
        permissions,
        'consumer-1',
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(hasAccess).toBe(false)
    })

    it('should return false for different consumer', () => {
      const permissions = [createTestPermission({ consumerWidgetId: 'consumer-1' })]

      const hasAccess = controller.checkAccess(
        permissions,
        'consumer-2', // Different consumer
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(hasAccess).toBe(false)
    })

    it('should return false for different provider', () => {
      const permissions = [createTestPermission({ providerWidgetId: 'provider-1' })]

      const hasAccess = controller.checkAccess(
        permissions,
        'consumer-1',
        'provider-2', // Different provider
        'boardkit.mock.v1'
      )

      expect(hasAccess).toBe(false)
    })

    it('should return false for different contract', () => {
      const permissions = [createTestPermission({ contractId: 'boardkit.mock.v1' })]

      const hasAccess = controller.checkAccess(
        permissions,
        'consumer-1',
        'provider-1',
        'boardkit.other.v1' // Different contract
      )

      expect(hasAccess).toBe(false)
    })

    it('should only match read scope', () => {
      const permissions = [
        {
          ...createTestPermission(),
          scope: 'read' as const,
        },
      ]

      const hasAccess = controller.checkAccess(
        permissions,
        'consumer-1',
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(hasAccess).toBe(true)
    })
  })

  // ===========================================================================
  // getConnectionStatus()
  // ===========================================================================

  describe('getConnectionStatus()', () => {
    const widgets = [
      { id: 'provider-1' },
      { id: 'consumer-1' },
    ]

    it('should return "connected" when provider exists and permission granted', () => {
      const permissions = [createTestPermission()]

      const status = controller.getConnectionStatus(
        permissions,
        widgets,
        'consumer-1',
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(status).toBe('connected')
    })

    it('should return "disconnected" when provider exists but no permission', () => {
      const permissions: DataPermission[] = []

      const status = controller.getConnectionStatus(
        permissions,
        widgets,
        'consumer-1',
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(status).toBe('disconnected')
    })

    it('should return "broken" when provider widget does not exist', () => {
      const permissions = [createTestPermission({ providerWidgetId: 'deleted-provider' })]
      const widgetsWithoutProvider = [{ id: 'consumer-1' }]

      const status = controller.getConnectionStatus(
        permissions,
        widgetsWithoutProvider,
        'consumer-1',
        'deleted-provider',
        'boardkit.mock.v1'
      )

      expect(status).toBe('broken')
    })

    it('should prioritize "broken" over "disconnected"', () => {
      // Provider doesn't exist AND no permission
      const permissions: DataPermission[] = []
      const widgetsWithoutProvider = [{ id: 'consumer-1' }]

      const status = controller.getConnectionStatus(
        permissions,
        widgetsWithoutProvider,
        'consumer-1',
        'missing-provider',
        'boardkit.mock.v1'
      )

      expect(status).toBe('broken')
    })
  })

  // ===========================================================================
  // createPermission()
  // ===========================================================================

  describe('createPermission()', () => {
    it('should create a permission with unique ID', () => {
      const perm1 = controller.createPermission('consumer-1', 'provider-1', 'contract-1')
      const perm2 = controller.createPermission('consumer-1', 'provider-1', 'contract-1')

      expect(perm1.id).toBeTruthy()
      expect(perm2.id).toBeTruthy()
      expect(perm1.id).not.toBe(perm2.id)
    })

    it('should set correct consumer, provider, and contract', () => {
      const perm = controller.createPermission(
        'my-consumer',
        'my-provider',
        'boardkit.mock.v1'
      )

      expect(perm.consumerWidgetId).toBe('my-consumer')
      expect(perm.providerWidgetId).toBe('my-provider')
      expect(perm.contractId).toBe('boardkit.mock.v1')
    })

    it('should set scope to "read"', () => {
      const perm = controller.createPermission('c', 'p', 'contract')

      expect(perm.scope).toBe('read')
    })

    it('should set grantedAt timestamp', () => {
      const before = Date.now()
      const perm = controller.createPermission('c', 'p', 'contract')
      const after = Date.now()

      expect(perm.grantedAt).toBeGreaterThanOrEqual(before)
      expect(perm.grantedAt).toBeLessThanOrEqual(after)
    })
  })

  // ===========================================================================
  // createLink()
  // ===========================================================================

  describe('createLink()', () => {
    it('should create a link from a permission', () => {
      const permission = createTestPermission({
        consumerWidgetId: 'cons-123',
        providerWidgetId: 'prov-456',
        contractId: 'boardkit.test.v1',
      })

      const link = controller.createLink(permission)

      expect(link.consumerWidgetId).toBe('cons-123')
      expect(link.providerWidgetId).toBe('prov-456')
      expect(link.contractId).toBe('boardkit.test.v1')
    })

    it('should not include permission ID or timestamp', () => {
      const permission = createTestPermission()

      const link = controller.createLink(permission)

      expect('id' in link).toBe(false)
      expect('grantedAt' in link).toBe(false)
      expect('scope' in link).toBe(false)
    })
  })

  // ===========================================================================
  // findPermission()
  // ===========================================================================

  describe('findPermission()', () => {
    it('should find matching permission', () => {
      const target = createTestPermission({
        consumerWidgetId: 'c1',
        providerWidgetId: 'p1',
        contractId: 'contract-a',
      })
      const other = createTestPermission({
        id: 'other',
        consumerWidgetId: 'c2',
        providerWidgetId: 'p2',
        contractId: 'contract-b',
      })

      const found = controller.findPermission(
        [target, other],
        'c1',
        'p1',
        'contract-a'
      )

      expect(found).toBe(target)
    })

    it('should return undefined when not found', () => {
      const permissions = [createTestPermission()]

      const found = controller.findPermission(
        permissions,
        'not-found',
        'provider',
        'contract'
      )

      expect(found).toBeUndefined()
    })

    it('should return first match if multiple exist', () => {
      const first = createTestPermission({ id: 'first' })
      const second = createTestPermission({ id: 'second' })

      const found = controller.findPermission(
        [first, second],
        'consumer-1',
        'provider-1',
        'boardkit.mock.v1'
      )

      expect(found?.id).toBe('first')
    })
  })

  // ===========================================================================
  // getConsumerPermissions()
  // ===========================================================================

  describe('getConsumerPermissions()', () => {
    it('should return all permissions for a consumer', () => {
      const permissions = [
        createTestPermission({ id: 'p1', consumerWidgetId: 'consumer-a', providerWidgetId: 'prov-1' }),
        createTestPermission({ id: 'p2', consumerWidgetId: 'consumer-a', providerWidgetId: 'prov-2' }),
        createTestPermission({ id: 'p3', consumerWidgetId: 'consumer-b', providerWidgetId: 'prov-1' }),
      ]

      const result = controller.getConsumerPermissions(permissions, 'consumer-a')

      expect(result.length).toBe(2)
      expect(result.every(p => p.consumerWidgetId === 'consumer-a')).toBe(true)
    })

    it('should return empty array for consumer with no permissions', () => {
      const permissions = [createTestPermission({ consumerWidgetId: 'other' })]

      const result = controller.getConsumerPermissions(permissions, 'non-existent')

      expect(result).toEqual([])
    })
  })

  // ===========================================================================
  // getProviderPermissions()
  // ===========================================================================

  describe('getProviderPermissions()', () => {
    it('should return all permissions for a provider', () => {
      const permissions = [
        createTestPermission({ id: 'p1', providerWidgetId: 'provider-x', consumerWidgetId: 'c1' }),
        createTestPermission({ id: 'p2', providerWidgetId: 'provider-x', consumerWidgetId: 'c2' }),
        createTestPermission({ id: 'p3', providerWidgetId: 'provider-y', consumerWidgetId: 'c1' }),
      ]

      const result = controller.getProviderPermissions(permissions, 'provider-x')

      expect(result.length).toBe(2)
      expect(result.every(p => p.providerWidgetId === 'provider-x')).toBe(true)
    })

    it('should return empty array for provider with no consumers', () => {
      const permissions = [createTestPermission({ providerWidgetId: 'other' })]

      const result = controller.getProviderPermissions(permissions, 'non-existent')

      expect(result).toEqual([])
    })
  })

  // ===========================================================================
  // getAvailableProviders()
  // ===========================================================================

  describe('getAvailableProviders()', () => {
    it('should return widgets matching contract provider', () => {
      const widgets = [
        { id: 'w1', moduleId: 'mock-module' },
        { id: 'w2', moduleId: 'mock-module' },
        { id: 'w3', moduleId: 'other-module' },
      ]

      const result = controller.getAvailableProviders(widgets, 'boardkit.mock.v1')

      expect(result.length).toBe(2)
      expect(result.every(w => w.moduleId === 'mock-module')).toBe(true)
    })

    it('should return empty array for unknown contract', () => {
      const widgets = [{ id: 'w1', moduleId: 'mock-module' }]

      const result = controller.getAvailableProviders(widgets, 'unknown.contract.v1')

      expect(result).toEqual([])
    })

    it('should return empty array when no widgets match', () => {
      const widgets = [
        { id: 'w1', moduleId: 'unrelated-module' },
      ]

      const result = controller.getAvailableProviders(widgets, 'boardkit.mock.v1')

      expect(result).toEqual([])
    })
  })

  // ===========================================================================
  // canProvide()
  // ===========================================================================

  describe('canProvide()', () => {
    it('should return true when widget can provide contract', () => {
      const widgets = [{ id: 'widget-1', moduleId: 'mock-module' }]

      const result = controller.canProvide(widgets, 'widget-1', 'boardkit.mock.v1')

      expect(result).toBe(true)
    })

    it('should return false when widget has wrong module', () => {
      const widgets = [{ id: 'widget-1', moduleId: 'wrong-module' }]

      const result = controller.canProvide(widgets, 'widget-1', 'boardkit.mock.v1')

      expect(result).toBe(false)
    })

    it('should return false when widget does not exist', () => {
      const widgets = [{ id: 'other-widget', moduleId: 'mock-module' }]

      const result = controller.canProvide(widgets, 'non-existent', 'boardkit.mock.v1')

      expect(result).toBe(false)
    })

    it('should return false for unknown contract', () => {
      const widgets = [{ id: 'widget-1', moduleId: 'mock-module' }]

      const result = controller.canProvide(widgets, 'widget-1', 'unknown.contract.v1')

      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // Singleton Export
  // ===========================================================================

  describe('Singleton Export', () => {
    it('should export a singleton instance', () => {
      expect(dataAccessController).toBeInstanceOf(DataAccessController)
    })

    it('should work like a regular instance', () => {
      const perm = dataAccessController.createPermission('c', 'p', 'contract')

      expect(perm.consumerWidgetId).toBe('c')
      expect(perm.providerWidgetId).toBe('p')
      expect(perm.scope).toBe('read')
    })
  })
})
