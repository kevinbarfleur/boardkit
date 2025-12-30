import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBoardStore } from '../src/stores/boardStore'
import { moduleRegistry } from '../src/modules/ModuleRegistry'
import type { ModuleDefinition } from '../src/types/module'
import type { BoardkitDocument, Widget } from '../src/types/document'
import type { CanvasElement, ShapeElement, TextElement } from '../src/types/element'

// =============================================================================
// Mock Module Definition
// =============================================================================

interface MockModuleState {
  value: string
  count: number
}

const mockModuleDefinition: ModuleDefinition<MockModuleState> = {
  moduleId: 'mock-module',
  displayName: 'Mock Module',
  description: 'A mock module for testing',
  icon: 'test',
  defaultWidth: 200,
  defaultHeight: 150,
  minWidth: 100,
  minHeight: 100,
  defaultState: () => ({ value: 'default', count: 0 }),
  serialize: (state) => state,
  deserialize: (data) => data as MockModuleState,
  Widget: {} as ModuleDefinition['Widget'],
}

// =============================================================================
// Test Helpers
// =============================================================================

function createTestDocument(overrides: Partial<BoardkitDocument> = {}): BoardkitDocument {
  const now = Date.now()
  return {
    version: 2,
    meta: {
      title: 'Test Board',
      createdAt: now,
      updatedAt: now,
    },
    board: {
      viewport: { x: 0, y: 0, zoom: 1 },
      widgets: [],
      elements: [],
      background: { type: 'solid', color: '#ffffff' },
    },
    modules: {},
    dataSharing: {
      permissions: [],
      links: [],
    },
    ...overrides,
  }
}

function createTestWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'widget-1',
    moduleId: 'mock-module',
    rect: { x: 100, y: 100, width: 200, height: 150 },
    zIndex: 1,
    ...overrides,
  }
}

function createTestShapeElement(overrides: Partial<ShapeElement> = {}): ShapeElement {
  return {
    id: 'element-1',
    type: 'shape',
    shape: 'rectangle',
    rect: { x: 50, y: 50, width: 100, height: 80 },
    zIndex: 1,
    style: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 1,
      roughness: 1,
    },
    ...overrides,
  } as ShapeElement
}

function createTestTextElement(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: 'text-element-1',
    type: 'text',
    rect: { x: 200, y: 200, width: 150, height: 50 },
    zIndex: 2,
    content: 'Test text',
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    textAlign: 'left',
    ...overrides,
  } as TextElement
}

// =============================================================================
// Tests
// =============================================================================

describe('boardStore', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())

    // Clear and register mock module
    moduleRegistry.clear()
    moduleRegistry.register(mockModuleDefinition)
  })

  afterEach(() => {
    moduleRegistry.clear()
  })

  // ===========================================================================
  // Document Management
  // ===========================================================================

  describe('Document Management', () => {
    describe('createNewBoard()', () => {
      it('should create a new board with the given title', () => {
        const store = useBoardStore()
        store.createNewBoard('My Board')

        expect(store.document).not.toBeNull()
        expect(store.title).toBe('My Board')
        expect(store.widgets.length).toBe(0)
        expect(store.elements.length).toBe(0)
        expect(store.isDirty).toBe(false)
      })

      it('should clear existing selection', () => {
        const store = useBoardStore()
        store.createNewBoard('First Board')
        store.addWidget('mock-module', 100, 100)

        store.createNewBoard('Second Board')

        expect(store.selectedWidgetId).toBeNull()
        expect(store.hasSelection).toBe(false)
      })
    })

    describe('loadDocument()', () => {
      it('should load a document', () => {
        const store = useBoardStore()
        const doc = createTestDocument({
          meta: { title: 'Loaded Board', createdAt: 1000, updatedAt: 2000 }
        })

        store.loadDocument(doc)

        expect(store.document).not.toBeNull()
        expect(store.title).toBe('Loaded Board')
        expect(store.isDirty).toBe(false)
      })

      it('should load document with existing widgets', () => {
        const store = useBoardStore()
        const widget = createTestWidget({ id: 'existing-widget' })
        const doc = createTestDocument({
          board: {
            viewport: { x: 0, y: 0, zoom: 1 },
            widgets: [widget],
            elements: [],
            background: { type: 'solid', color: '#ffffff' },
          },
          modules: { 'existing-widget': { value: 'test', count: 5 } },
        })

        store.loadDocument(doc)

        expect(store.widgets.length).toBe(1)
        expect(store.widgets[0].id).toBe('existing-widget')
      })

      it('should clear selection when loading', () => {
        const store = useBoardStore()
        store.createNewBoard('Board')
        store.addWidget('mock-module')

        store.loadDocument(createTestDocument())

        expect(store.hasSelection).toBe(false)
      })
    })

    describe('setTitle()', () => {
      it('should update the document title', () => {
        const store = useBoardStore()
        store.createNewBoard('Original')

        store.setTitle('New Title')

        expect(store.title).toBe('New Title')
        expect(store.isDirty).toBe(true)
      })

      it('should do nothing if no document loaded', () => {
        const store = useBoardStore()
        store.setTitle('Title')

        expect(store.document).toBeNull()
      })
    })

    describe('getDocument()', () => {
      it('should return the document reference', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const doc = store.getDocument()

        expect(doc).toBe(store.document)
      })

      it('should return null when no document loaded', () => {
        const store = useBoardStore()

        expect(store.getDocument()).toBeNull()
      })
    })
  })

  // ===========================================================================
  // Widget Management
  // ===========================================================================

  describe('Widget Management', () => {
    describe('addWidget()', () => {
      it('should add a widget with the given module', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const id = store.addWidget('mock-module', 100, 200)

        expect(id).toBeTruthy()
        expect(store.widgets.length).toBe(1)
        expect(store.widgets[0].moduleId).toBe('mock-module')
        expect(store.widgets[0].rect.x).toBe(100)
        expect(store.widgets[0].rect.y).toBe(200)
      })

      it('should use module default dimensions', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.addWidget('mock-module')

        expect(store.widgets[0].rect.width).toBe(200)
        expect(store.widgets[0].rect.height).toBe(150)
      })

      it('should auto-select the new widget', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const id = store.addWidget('mock-module')

        expect(store.selectedWidgetId).toBe(id)
      })

      it('should initialize module state', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const id = store.addWidget('mock-module')!
        const state = store.getModuleState<MockModuleState>(id)

        expect(state).toEqual({ value: 'default', count: 0 })
      })

      it('should mark document dirty', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.addWidget('mock-module')

        expect(store.isDirty).toBe(true)
      })

      it('should return null for unknown module', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const id = store.addWidget('unknown-module')

        expect(id).toBeNull()
        expect(store.widgets.length).toBe(0)
      })

      it('should return null when no document loaded', () => {
        const store = useBoardStore()

        const id = store.addWidget('mock-module')

        expect(id).toBeNull()
      })

      it('should assign incrementing z-index', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.addWidget('mock-module')
        store.addWidget('mock-module')
        store.addWidget('mock-module')

        expect(store.widgets[0].zIndex).toBe(1)
        expect(store.widgets[1].zIndex).toBe(2)
        expect(store.widgets[2].zIndex).toBe(3)
      })
    })

    describe('removeWidget()', () => {
      it('should remove a widget', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.removeWidget(id)

        expect(store.widgets.length).toBe(0)
      })

      it('should remove module state', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.removeWidget(id)

        expect(store.document!.modules[id]).toBeUndefined()
      })

      it('should clear selection if widget was selected', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        expect(store.selectedWidgetId).toBe(id)

        store.removeWidget(id)

        expect(store.selectedWidgetId).toBeNull()
      })

      it('should mark document dirty', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.markClean()

        store.removeWidget(id)

        expect(store.isDirty).toBe(true)
      })

      it('should handle non-existent widget gracefully', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        expect(() => store.removeWidget('non-existent')).not.toThrow()
      })
    })

    describe('moveWidget()', () => {
      it('should update widget position', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module', 0, 0)!

        store.moveWidget(id, 300, 400)

        expect(store.widgets[0].rect.x).toBe(300)
        expect(store.widgets[0].rect.y).toBe(400)
      })

      it('should mark document dirty', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.markClean()

        store.moveWidget(id, 100, 100)

        expect(store.isDirty).toBe(true)
      })

      it('should handle non-existent widget gracefully', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        expect(() => store.moveWidget('non-existent', 100, 100)).not.toThrow()
      })
    })

    describe('resizeWidget()', () => {
      it('should update widget dimensions', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.resizeWidget(id, 400, 300)

        expect(store.widgets[0].rect.width).toBe(400)
        expect(store.widgets[0].rect.height).toBe(300)
      })

      it('should respect minimum dimensions from module', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.resizeWidget(id, 50, 50) // Below minWidth/minHeight (100)

        expect(store.widgets[0].rect.width).toBe(100)
        expect(store.widgets[0].rect.height).toBe(100)
      })

      it('should mark document dirty', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.markClean()

        store.resizeWidget(id, 300, 300)

        expect(store.isDirty).toBe(true)
      })
    })

    describe('duplicateWidget()', () => {
      it('should create a copy of the widget', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module', 100, 100)!

        const newId = store.duplicateWidget(id)

        expect(newId).toBeTruthy()
        expect(newId).not.toBe(id)
        expect(store.widgets.length).toBe(2)
      })

      it('should offset the duplicate position', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module', 100, 100)!

        store.duplicateWidget(id)

        expect(store.widgets[1].rect.x).toBe(120) // 100 + 20 offset
        expect(store.widgets[1].rect.y).toBe(120)
      })

      it('should deep clone module state', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.updateModuleState<MockModuleState>(id, { value: 'modified', count: 10 })

        const newId = store.duplicateWidget(id)!
        const newState = store.getModuleState<MockModuleState>(newId)

        expect(newState).toEqual({ value: 'modified', count: 10 })
      })

      it('should select the duplicate', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        const newId = store.duplicateWidget(id)

        expect(store.selectedWidgetId).toBe(newId)
      })

      it('should return null for non-existent widget', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const result = store.duplicateWidget('non-existent')

        expect(result).toBeNull()
      })
    })

    describe('nudgeWidget()', () => {
      it('should move widget by delta', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module', 100, 100)!

        store.nudgeWidget(id, 10, -5)

        expect(store.widgets[0].rect.x).toBe(110)
        expect(store.widgets[0].rect.y).toBe(95)
      })
    })
  })

  // ===========================================================================
  // Element Management
  // ===========================================================================

  describe('Element Management', () => {
    describe('addElement()', () => {
      it('should add an element', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        expect(id).toBeTruthy()
        expect(store.elements.length).toBe(1)
        expect(store.elements[0].type).toBe('shape')
      })

      it('should auto-select the new element', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        expect(store.selectedElementId).toBe(id)
      })

      it('should assign z-index', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        expect(store.elements[0].zIndex).toBe(1)
      })
    })

    describe('removeElement()', () => {
      it('should remove an element', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        store.removeElement(id)

        expect(store.elements.length).toBe(0)
      })

      it('should clear selection if element was selected', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        store.removeElement(id)

        expect(store.selectedElementId).toBeNull()
      })
    })

    describe('updateElement()', () => {
      it('should update element properties', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        store.updateElement(id, { rect: { x: 200, y: 200, width: 150, height: 120 } })

        expect(store.elements[0].rect.x).toBe(200)
        expect(store.elements[0].rect.width).toBe(150)
      })
    })

    describe('moveElement()', () => {
      it('should update element position', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        store.moveElement(id, 300, 400)

        expect(store.elements[0].rect.x).toBe(300)
        expect(store.elements[0].rect.y).toBe(400)
      })

      it('should support skipDirty flag', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)
        store.markClean()

        store.moveElement(id, 300, 400, true)

        expect(store.isDirty).toBe(false)
      })
    })

    describe('duplicateElement()', () => {
      it('should create a copy with offset', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...elementWithoutIdAndZIndex } = element
        const id = store.addElement(elementWithoutIdAndZIndex as Omit<CanvasElement, 'id' | 'zIndex'>)

        const newId = store.duplicateElement(id)

        expect(newId).toBeTruthy()
        expect(store.elements.length).toBe(2)
        expect(store.elements[1].rect.x).toBe(store.elements[0].rect.x + 20)
      })
    })

    describe('bringElementToFront() / sendElementToBack()', () => {
      it('should bring element to front', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element1 = createTestShapeElement()
        const element2 = createTestShapeElement()
        const { id: _1, zIndex: __1, ...el1 } = element1
        const { id: _2, zIndex: __2, ...el2 } = element2
        const id1 = store.addElement(el1 as Omit<CanvasElement, 'id' | 'zIndex'>)
        store.addElement(el2 as Omit<CanvasElement, 'id' | 'zIndex'>)

        store.bringElementToFront(id1)

        expect(store.elements[0].zIndex).toBe(3) // maxZIndex was 2, now 3
      })

      it('should send element to back', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element1 = createTestShapeElement()
        const element2 = createTestShapeElement()
        const { id: _1, zIndex: __1, ...el1 } = element1
        const { id: _2, zIndex: __2, ...el2 } = element2
        store.addElement(el1 as Omit<CanvasElement, 'id' | 'zIndex'>)
        const id2 = store.addElement(el2 as Omit<CanvasElement, 'id' | 'zIndex'>)

        store.sendElementToBack(id2)

        expect(store.elements[1].zIndex).toBe(0) // minZIndex was 1, now 0
      })
    })
  })

  // ===========================================================================
  // Selection
  // ===========================================================================

  describe('Selection', () => {
    describe('selectWidget()', () => {
      it('should select a widget', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.clearSelection()

        store.selectWidget(id)

        expect(store.selectedWidgetId).toBe(id)
        expect(store.isSelected('widget', id)).toBe(true)
      })

      it('should replace existing selection by default', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module')!
        const id2 = store.addWidget('mock-module')!
        store.selectWidget(id1)

        store.selectWidget(id2)

        expect(store.selectedWidgetId).toBe(id2)
        expect(store.selectionCount).toBe(1)
      })

      it('should add to selection when addToSelection=true', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module')!
        const id2 = store.addWidget('mock-module')!
        store.selectWidget(id1)

        store.selectWidget(id2, true)

        expect(store.selectionCount).toBe(2)
        expect(store.isMultiSelection).toBe(true)
      })

      it('should toggle off if already selected and addToSelection=true', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.selectWidget(id)

        store.selectWidget(id, true)

        expect(store.selectionCount).toBe(0)
        expect(store.isSelected('widget', id)).toBe(false)
      })

      it('should bring widget to front when selecting', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module')!
        const id2 = store.addWidget('mock-module')!
        store.clearSelection()

        store.selectWidget(id1)

        const widget1 = store.widgets.find(w => w.id === id1)!
        const widget2 = store.widgets.find(w => w.id === id2)!
        expect(widget1.zIndex).toBeGreaterThan(widget2.zIndex)
      })

      it('should clear selection when selecting null', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module')

        store.selectWidget(null)

        expect(store.hasSelection).toBe(false)
      })
    })

    describe('selectElement()', () => {
      it('should select an element', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const element = createTestShapeElement()
        const { id: _, zIndex: __, ...el } = element
        const id = store.addElement(el as Omit<CanvasElement, 'id' | 'zIndex'>)
        store.clearSelection()

        store.selectElement(id)

        expect(store.selectedElementId).toBe(id)
        expect(store.isSelected('element', id)).toBe(true)
      })

      it('should support multi-select with addToSelection', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const { id: _, zIndex: __, ...el1 } = createTestShapeElement()
        const { id: _2, zIndex: __2, ...el2 } = createTestShapeElement()
        const id1 = store.addElement(el1 as Omit<CanvasElement, 'id' | 'zIndex'>)
        const id2 = store.addElement(el2 as Omit<CanvasElement, 'id' | 'zIndex'>)
        store.clearSelection()

        store.selectElement(id1)
        store.selectElement(id2, true)

        expect(store.selectionCount).toBe(2)
        expect(store.selectionType).toBe('element')
      })
    })

    describe('selectMultiple()', () => {
      it('should select multiple items at once', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const widgetId = store.addWidget('mock-module')!
        const { id: _, zIndex: __, ...el } = createTestShapeElement()
        const elementId = store.addElement(el as Omit<CanvasElement, 'id' | 'zIndex'>)
        store.clearSelection()

        store.selectMultiple([
          { type: 'widget', id: widgetId },
          { type: 'element', id: elementId },
        ])

        expect(store.selectionCount).toBe(2)
        expect(store.selectionType).toBe('mixed')
      })

      it('should add to existing selection when addToSelection=true', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module')!
        const id2 = store.addWidget('mock-module')!
        store.selectWidget(id1)

        store.selectMultiple([{ type: 'widget', id: id2 }], true)

        expect(store.selectionCount).toBe(2)
      })
    })

    describe('selectInRect()', () => {
      it('should select items within bounding box', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module', 100, 100) // Widget at (100,100) with size 200x150
        store.clearSelection()

        // Select rectangle that covers the widget
        store.selectInRect({ x: 50, y: 50, width: 200, height: 200 })

        expect(store.selectionCount).toBe(1)
      })

      it('should handle negative dimensions (drag from right to left)', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module', 100, 100)
        store.clearSelection()

        // Selection from bottom-right to top-left
        store.selectInRect({ x: 250, y: 250, width: -200, height: -200 })

        expect(store.selectionCount).toBe(1)
      })
    })

    describe('clearSelection()', () => {
      it('should clear all selections', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module')
        store.addWidget('mock-module')

        store.clearSelection()

        expect(store.hasSelection).toBe(false)
        expect(store.selectionCount).toBe(0)
      })
    })

    describe('Selection Getters', () => {
      it('selectedWidget should return the first selected widget object', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module', 100, 200)!

        expect(store.selectedWidget).not.toBeNull()
        expect(store.selectedWidget!.id).toBe(id)
        expect(store.selectedWidget!.rect.x).toBe(100)
      })

      it('selectedWidgets should return all selected widgets', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module')!
        const id2 = store.addWidget('mock-module')!
        store.selectWidget(id1)
        store.selectWidget(id2, true)

        expect(store.selectedWidgets.length).toBe(2)
      })

      it('selectedElement should return the first selected element object', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const { id: _, zIndex: __, ...el } = createTestShapeElement()
        const id = store.addElement(el as Omit<CanvasElement, 'id' | 'zIndex'>)

        expect(store.selectedElement).not.toBeNull()
        expect(store.selectedElement!.id).toBe(id)
      })
    })

    describe('isSelected()', () => {
      it('should return true for selected items', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        expect(store.isSelected('widget', id)).toBe(true)
      })

      it('should return false for non-selected items', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module')

        expect(store.isSelected('widget', 'other-id')).toBe(false)
      })
    })
  })

  // ===========================================================================
  // Selection Operations
  // ===========================================================================

  describe('Selection Operations', () => {
    describe('moveSelection()', () => {
      it('should move all selected widgets', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module', 100, 100)!
        const id2 = store.addWidget('mock-module', 200, 200)!
        store.selectWidget(id1)
        store.selectWidget(id2, true)

        store.moveSelection(50, 30)

        expect(store.widgets[0].rect.x).toBe(150)
        expect(store.widgets[0].rect.y).toBe(130)
        expect(store.widgets[1].rect.x).toBe(250)
        expect(store.widgets[1].rect.y).toBe(230)
      })

      it('should support skipDirty flag', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module')
        store.markClean()

        store.moveSelection(10, 10, true)

        expect(store.isDirty).toBe(false)
      })
    })

    describe('deleteSelection()', () => {
      it('should delete all selected items', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module')!
        const id2 = store.addWidget('mock-module')!
        store.selectWidget(id1)
        store.selectWidget(id2, true)

        store.deleteSelection()

        expect(store.widgets.length).toBe(0)
        expect(store.hasSelection).toBe(false)
      })

      it('should delete mixed selection (widgets and elements)', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const widgetId = store.addWidget('mock-module')!
        const { id: _, zIndex: __, ...el } = createTestShapeElement()
        const elementId = store.addElement(el as Omit<CanvasElement, 'id' | 'zIndex'>)
        store.selectMultiple([
          { type: 'widget', id: widgetId },
          { type: 'element', id: elementId },
        ])

        store.deleteSelection()

        expect(store.widgets.length).toBe(0)
        expect(store.elements.length).toBe(0)
      })
    })

    describe('duplicateSelection()', () => {
      it('should duplicate all selected widgets', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id1 = store.addWidget('mock-module', 100, 100)!
        const id2 = store.addWidget('mock-module', 200, 200)!
        store.selectWidget(id1)
        store.selectWidget(id2, true)

        const newIds = store.duplicateSelection()

        expect(newIds.length).toBe(2)
        expect(store.widgets.length).toBe(4)
      })

      it('should select the duplicated items', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.addWidget('mock-module')

        const newIds = store.duplicateSelection()

        expect(store.selectedWidgetIds).toContain(newIds[0])
      })
    })
  })

  // ===========================================================================
  // Z-Index
  // ===========================================================================

  describe('Z-Index', () => {
    it('maxZIndex should return highest z-index', () => {
      const store = useBoardStore()
      store.createNewBoard('Test')
      store.addWidget('mock-module') // zIndex 1
      store.addWidget('mock-module') // zIndex 2
      store.addWidget('mock-module') // zIndex 3

      expect(store.maxZIndex).toBe(3)
    })

    it('minZIndex should return lowest z-index', () => {
      const store = useBoardStore()
      store.createNewBoard('Test')
      store.addWidget('mock-module')
      store.addWidget('mock-module')

      expect(store.minZIndex).toBe(1)
    })

    it('should return 0 for empty board', () => {
      const store = useBoardStore()
      store.createNewBoard('Test')

      expect(store.maxZIndex).toBe(0)
      expect(store.minZIndex).toBe(0)
    })
  })

  // ===========================================================================
  // Dirty State
  // ===========================================================================

  describe('Dirty State', () => {
    describe('markDirty()', () => {
      it('should set isDirty to true', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.markDirty()

        expect(store.isDirty).toBe(true)
      })

      it('should update lastAction', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.markDirty('Test action')

        expect(store.lastAction).toBe('Test action')
      })

      it('should update document updatedAt', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const beforeUpdate = store.document!.meta.updatedAt

        store.markDirty()

        // updatedAt should be updated (>= because Date.now() might return same value)
        expect(store.document!.meta.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
      })
    })

    describe('markClean()', () => {
      it('should set isDirty to false', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.markDirty()

        store.markClean()

        expect(store.isDirty).toBe(false)
      })
    })
  })

  // ===========================================================================
  // Module State
  // ===========================================================================

  describe('Module State', () => {
    describe('getModuleState()', () => {
      it('should return deserialized module state', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        const state = store.getModuleState<MockModuleState>(id)

        expect(state).toEqual({ value: 'default', count: 0 })
      })

      it('should return null for non-existent widget', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        const state = store.getModuleState('non-existent')

        expect(state).toBeNull()
      })

      it('should return null when no document loaded', () => {
        const store = useBoardStore()

        const state = store.getModuleState('any-id')

        expect(state).toBeNull()
      })
    })

    describe('updateModuleState()', () => {
      it('should partially update module state', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.updateModuleState<MockModuleState>(id, { count: 42 })

        const state = store.getModuleState<MockModuleState>(id)
        expect(state).toEqual({ value: 'default', count: 42 })
      })

      it('should mark document dirty', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!
        store.markClean()

        store.updateModuleState<MockModuleState>(id, { count: 1 })

        expect(store.isDirty).toBe(true)
      })
    })

    describe('setModuleState()', () => {
      it('should replace entire module state', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.setModuleState<MockModuleState>(id, { value: 'new', count: 100 })

        const state = store.getModuleState<MockModuleState>(id)
        expect(state).toEqual({ value: 'new', count: 100 })
      })
    })
  })

  // ===========================================================================
  // Viewport
  // ===========================================================================

  describe('Viewport', () => {
    describe('updateViewport()', () => {
      it('should update viewport properties', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.updateViewport({ x: 100, y: 200, zoom: 1.5 })

        expect(store.viewport.x).toBe(100)
        expect(store.viewport.y).toBe(200)
        expect(store.viewport.zoom).toBe(1.5)
      })

      it('should partially update viewport', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.updateViewport({ zoom: 2 })

        expect(store.viewport.x).toBe(0)
        expect(store.viewport.zoom).toBe(2)
      })
    })
  })

  // ===========================================================================
  // Background
  // ===========================================================================

  describe('Background', () => {
    describe('setBackground()', () => {
      it('should update background properties', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')

        store.setBackground({ type: 'grid', color: '#f0f0f0' })

        expect(store.background.type).toBe('grid')
        expect(store.background.color).toBe('#f0f0f0')
      })

      it('should mark document dirty', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        store.markClean()

        store.setBackground({ color: '#000000' })

        expect(store.isDirty).toBe(true)
      })
    })
  })

  // ===========================================================================
  // Widget Visibility
  // ===========================================================================

  describe('Widget Visibility', () => {
    describe('updateWidgetVisibility()', () => {
      it('should update visibility settings', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.updateWidgetVisibility(id, { restMode: 'visible' })

        const visibility = store.getWidgetVisibility(id)
        expect(visibility.restMode).toBe('visible')
      })

      it('should initialize visibility if not set', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        store.updateWidgetVisibility(id, { hoverMode: 'visible' })

        const visibility = store.getWidgetVisibility(id)
        expect(visibility.restMode).toBe('transparent') // default
        expect(visibility.hoverMode).toBe('visible')
      })
    })

    describe('getWidgetVisibility()', () => {
      it('should return default visibility for widget without settings', () => {
        const store = useBoardStore()
        store.createNewBoard('Test')
        const id = store.addWidget('mock-module')!

        const visibility = store.getWidgetVisibility(id)

        expect(visibility).toEqual({
          restMode: 'transparent',
          hoverMode: 'subtle',
        })
      })
    })
  })
})
