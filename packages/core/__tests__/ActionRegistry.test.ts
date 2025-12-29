import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ActionRegistry } from '../src/actions/ActionRegistry'
import type { ActionDefinition, ActionContext } from '../src/types/action'

// Helper to create a mock ActionContext
function createMockContext(overrides: Partial<ActionContext> = {}): ActionContext {
  return {
    selectedWidget: null,
    selectedWidgetId: null,
    selectedElement: null,
    selectedElementId: null,
    activeTool: 'select',
    viewport: { x: 0, y: 0, zoom: 1 },
    widgets: [],
    elements: [],
    platform: 'web',
    isDirty: false,
    ...overrides,
  }
}

// Helper to create a mock action
function createMockAction(overrides: Partial<ActionDefinition> = {}): ActionDefinition {
  return {
    id: 'test.action',
    title: 'Test Action',
    group: 'board',
    contexts: ['global'],
    run: vi.fn(),
    ...overrides,
  }
}

describe('ActionRegistry', () => {
  let registry: ActionRegistry

  beforeEach(() => {
    registry = new ActionRegistry()
  })

  describe('register()', () => {
    it('should register an action', () => {
      const action = createMockAction({ id: 'test.register' })
      registry.register(action)

      expect(registry.has('test.register')).toBe(true)
      expect(registry.size).toBe(1)
    })

    it('should set default priority to 0', () => {
      const action = createMockAction({ id: 'test.priority' })
      registry.register(action)

      const registered = registry.get('test.priority')
      expect(registered?.priority).toBe(0)
    })

    it('should preserve explicit priority', () => {
      const action = createMockAction({ id: 'test.priority', priority: 10 })
      registry.register(action)

      const registered = registry.get('test.priority')
      expect(registered?.priority).toBe(10)
    })

    it('should overwrite existing action with same ID', () => {
      const action1 = createMockAction({ id: 'test.overwrite', title: 'First' })
      const action2 = createMockAction({ id: 'test.overwrite', title: 'Second' })

      registry.register(action1)
      registry.register(action2)

      const registered = registry.get('test.overwrite')
      expect(registered?.title).toBe('Second')
      expect(registry.size).toBe(1)
    })
  })

  describe('registerAll()', () => {
    it('should register multiple actions', () => {
      const actions = [
        createMockAction({ id: 'test.action1' }),
        createMockAction({ id: 'test.action2' }),
        createMockAction({ id: 'test.action3' }),
      ]

      registry.registerAll(actions)

      expect(registry.size).toBe(3)
      expect(registry.has('test.action1')).toBe(true)
      expect(registry.has('test.action2')).toBe(true)
      expect(registry.has('test.action3')).toBe(true)
    })
  })

  describe('registerModuleActions()', () => {
    it('should prefix action IDs with module ID', () => {
      registry.registerModuleActions('my-module', [
        { id: 'do-something', title: 'Do Something', contexts: ['global'], run: vi.fn() },
      ])

      expect(registry.has('my-module.do-something')).toBe(true)
    })

    it('should set group to module and add moduleId', () => {
      registry.registerModuleActions('my-module', [
        { id: 'action', title: 'Action', contexts: ['global'], run: vi.fn() },
      ])

      const action = registry.get('my-module.action')
      expect(action?.group).toBe('module')
      expect(action?.moduleId).toBe('my-module')
    })
  })

  describe('unregister()', () => {
    it('should remove an action', () => {
      registry.register(createMockAction({ id: 'test.remove' }))
      expect(registry.has('test.remove')).toBe(true)

      const result = registry.unregister('test.remove')

      expect(result).toBe(true)
      expect(registry.has('test.remove')).toBe(false)
    })

    it('should return false for non-existent action', () => {
      const result = registry.unregister('non.existent')
      expect(result).toBe(false)
    })
  })

  describe('unregisterModule()', () => {
    it('should remove all actions from a module', () => {
      registry.registerModuleActions('module-a', [
        { id: 'action1', title: 'Action 1', contexts: ['global'], run: vi.fn() },
        { id: 'action2', title: 'Action 2', contexts: ['global'], run: vi.fn() },
      ])
      registry.registerModuleActions('module-b', [
        { id: 'action1', title: 'Action 1', contexts: ['global'], run: vi.fn() },
      ])

      expect(registry.size).toBe(3)

      registry.unregisterModule('module-a')

      expect(registry.size).toBe(1)
      expect(registry.has('module-a.action1')).toBe(false)
      expect(registry.has('module-a.action2')).toBe(false)
      expect(registry.has('module-b.action1')).toBe(true)
    })
  })

  describe('get()', () => {
    it('should return action by ID', () => {
      const action = createMockAction({ id: 'test.get' })
      registry.register(action)

      const result = registry.get('test.get')
      expect(result?.id).toBe('test.get')
    })

    it('should return undefined for non-existent ID', () => {
      const result = registry.get('non.existent')
      expect(result).toBeUndefined()
    })
  })

  describe('getAll()', () => {
    beforeEach(() => {
      registry.registerAll([
        createMockAction({ id: 'board.action', group: 'board', contexts: ['global'] }),
        createMockAction({ id: 'widget.action', group: 'widget', contexts: ['widget'] }),
        createMockAction({ id: 'view.action', group: 'view', contexts: ['global', 'canvas'] }),
      ])
    })

    it('should return all actions', () => {
      const all = registry.getAll()
      expect(all.length).toBe(3)
    })

    it('should filter by context', () => {
      const global = registry.getAll({ context: 'global' })
      expect(global.length).toBe(2)
      expect(global.every((a) => a.contexts.includes('global'))).toBe(true)
    })

    it('should filter by group', () => {
      const widgets = registry.getAll({ group: 'widget' })
      expect(widgets.length).toBe(1)
      expect(widgets[0].group).toBe('widget')
    })

    it('should filter by moduleId', () => {
      registry.registerModuleActions('my-module', [
        { id: 'action', title: 'Module Action', contexts: ['global'], run: vi.fn() },
      ])

      const moduleActions = registry.getAll({ moduleId: 'my-module' })
      expect(moduleActions.length).toBe(1)
      expect(moduleActions[0].moduleId).toBe('my-module')
    })

    it('should sort by group order, then priority, then title', () => {
      registry.clear()
      registry.registerAll([
        createMockAction({ id: 'view.low', group: 'view', title: 'Low', priority: 1 }),
        createMockAction({ id: 'board.high', group: 'board', title: 'High', priority: 10 }),
        createMockAction({ id: 'board.low', group: 'board', title: 'Low', priority: 1 }),
        createMockAction({ id: 'widget.mid', group: 'widget', title: 'Mid', priority: 5 }),
      ])

      const sorted = registry.getAll()
      expect(sorted.map((a) => a.id)).toEqual([
        'board.high',
        'board.low',
        'widget.mid',
        'view.low',
      ])
    })
  })

  describe('getAvailable()', () => {
    it('should exclude actions where when() returns false', () => {
      registry.registerAll([
        createMockAction({
          id: 'always.available',
          when: () => true,
        }),
        createMockAction({
          id: 'never.available',
          when: () => false,
        }),
        createMockAction({
          id: 'no.when',
        }),
      ])

      const ctx = createMockContext()
      const available = registry.getAvailable(ctx)

      expect(available.length).toBe(2)
      expect(available.find((a) => a.id === 'always.available')).toBeDefined()
      expect(available.find((a) => a.id === 'no.when')).toBeDefined()
      expect(available.find((a) => a.id === 'never.available')).toBeUndefined()
    })

    it('should pass context to when() function', () => {
      const whenFn = vi.fn(() => true)
      registry.register(createMockAction({ id: 'test', when: whenFn }))

      const ctx = createMockContext({ isDirty: true })
      registry.getAvailable(ctx)

      expect(whenFn).toHaveBeenCalledWith(ctx)
    })

    it('should filter by context and when conditions', () => {
      registry.registerAll([
        createMockAction({
          id: 'widget.only',
          contexts: ['widget'],
          when: () => true,
        }),
        createMockAction({
          id: 'global.only',
          contexts: ['global'],
          when: () => true,
        }),
      ])

      const ctx = createMockContext()
      const available = registry.getAvailable(ctx, { context: 'widget' })

      expect(available.length).toBe(1)
      expect(available[0].id).toBe('widget.only')
    })
  })

  describe('execute()', () => {
    it('should execute action run() function', async () => {
      const run = vi.fn()
      registry.register(createMockAction({ id: 'test.execute', run }))

      const ctx = createMockContext()
      await registry.execute('test.execute', ctx)

      expect(run).toHaveBeenCalledWith(ctx)
    })

    it('should throw for non-existent action', async () => {
      const ctx = createMockContext()

      await expect(registry.execute('non.existent', ctx)).rejects.toThrow(
        '[ActionRegistry] Action "non.existent" not found'
      )
    })

    it('should not execute when when() returns false', async () => {
      const run = vi.fn()
      registry.register(
        createMockAction({
          id: 'test.unavailable',
          run,
          when: () => false,
        })
      )

      const ctx = createMockContext()
      await registry.execute('test.unavailable', ctx)

      expect(run).not.toHaveBeenCalled()
    })

    it('should execute when when() returns true', async () => {
      const run = vi.fn()
      registry.register(
        createMockAction({
          id: 'test.available',
          run,
          when: () => true,
        })
      )

      const ctx = createMockContext()
      await registry.execute('test.available', ctx)

      expect(run).toHaveBeenCalledWith(ctx)
    })

    it('should handle async run functions', async () => {
      const run = vi.fn().mockResolvedValue(undefined)
      registry.register(createMockAction({ id: 'test.async', run }))

      const ctx = createMockContext()
      await registry.execute('test.async', ctx)

      expect(run).toHaveBeenCalled()
    })
  })

  describe('search()', () => {
    beforeEach(() => {
      registry.registerAll([
        createMockAction({
          id: 'widget.duplicate',
          title: 'Duplicate Widget',
          subtitle: 'Create a copy',
          keywords: ['copy', 'clone'],
        }),
        createMockAction({
          id: 'widget.delete',
          title: 'Delete Widget',
          keywords: ['remove', 'trash'],
        }),
        createMockAction({
          id: 'view.reset',
          title: 'Reset View',
        }),
      ])
    })

    it('should return all actions for empty query', () => {
      const results = registry.search('')
      expect(results.length).toBe(3)
    })

    it('should match by title', () => {
      const results = registry.search('duplicate')
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('widget.duplicate')
    })

    it('should match by title prefix with higher score', () => {
      const results = registry.search('del')
      expect(results[0].id).toBe('widget.delete')
    })

    it('should match by subtitle', () => {
      const results = registry.search('copy')
      expect(results.some((a) => a.id === 'widget.duplicate')).toBe(true)
    })

    it('should match by keywords', () => {
      const results = registry.search('clone')
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('widget.duplicate')
    })

    it('should match by ID', () => {
      const results = registry.search('view.reset')
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('view.reset')
    })

    it('should be case-insensitive', () => {
      const results = registry.search('DUPLICATE')
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('widget.duplicate')
    })

    it('should sort by relevance score', () => {
      registry.register(
        createMockAction({
          id: 'test.widget',
          title: 'Widget Test',
          keywords: ['widget'],
        })
      )

      const results = registry.search('widget')
      // Exact title word match should score higher than keyword match
      expect(results[0].title).toContain('Widget')
    })

    it('should filter by context when provided', () => {
      const ctx = createMockContext()
      registry.register(
        createMockAction({
          id: 'hidden.action',
          title: 'Hidden Action',
          when: () => false,
        })
      )

      const results = registry.search('hidden', ctx)
      expect(results.length).toBe(0)
    })
  })

  describe('clear()', () => {
    it('should remove all actions', () => {
      registry.registerAll([
        createMockAction({ id: 'action1' }),
        createMockAction({ id: 'action2' }),
      ])

      expect(registry.size).toBe(2)

      registry.clear()

      expect(registry.size).toBe(0)
    })
  })

  describe('size', () => {
    it('should return count of registered actions', () => {
      expect(registry.size).toBe(0)

      registry.register(createMockAction({ id: 'action1' }))
      expect(registry.size).toBe(1)

      registry.register(createMockAction({ id: 'action2' }))
      expect(registry.size).toBe(2)
    })
  })
})
