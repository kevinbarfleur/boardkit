import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { BoardkitDocument, Widget, Viewport, WidgetVisibilitySettings } from '../types/document'
import { DEFAULT_WIDGET_VISIBILITY } from '../types/document'
import type { CanvasElement, BoardBackground, LineElement, DrawElement } from '../types/element'
import type { DataSharingState, DataPermission, DataLink } from '../types/dataContract'
import { createEmptyDocument } from '../types/document'
import { createEmptyDataSharingState } from '../types/dataContract'
import { DEFAULT_BACKGROUND, isLineElement, isDrawElement } from '../types/element'
import { moduleRegistry } from '../modules/ModuleRegistry'
import { migrateDocument } from '../migrations'
import { dataBus } from '../data/DataBus'
import { dataAccessController } from '../data/DataAccessController'

// ============================================================================
// Selection Types
// ============================================================================

/**
 * Selection item (widget or element).
 */
export interface SelectionItem {
  type: 'widget' | 'element'
  id: string
}

/**
 * Unified selection target (widget or element) - single selection backward compat.
 */
export type SelectionTarget = SelectionItem | null

/**
 * Multi-selection array.
 */
export type MultiSelection = SelectionItem[]

// ============================================================================
// Store Definition
// ============================================================================

export const useBoardStore = defineStore('board', () => {
  // ============================================================================
  // State
  // ============================================================================

  const document = ref<BoardkitDocument | null>(null)
  const selection = ref<MultiSelection>([])
  const isDirty = ref(false)
  const lastAction = ref<string>('Initial state')

  // ============================================================================
  // Getters - Document
  // ============================================================================

  const widgets = computed(() => document.value?.board.widgets ?? [])
  const elements = computed(() => document.value?.board.elements ?? [])
  const viewport = computed(() => document.value?.board.viewport ?? { x: 0, y: 0, zoom: 1 })
  const background = computed(() => document.value?.board.background ?? { ...DEFAULT_BACKGROUND })
  const moduleStates = computed(() => document.value?.modules ?? {})
  const title = computed(() => document.value?.meta.title ?? '')

  // Data Sharing Getters
  const dataSharing = computed(
    (): DataSharingState => document.value?.dataSharing ?? createEmptyDataSharingState()
  )
  const permissions = computed(() => dataSharing.value.permissions)
  const dataLinks = computed(() => dataSharing.value.links)

  // ============================================================================
  // Internal Maps for O(1) Lookups
  // ============================================================================

  /** Internal Map for O(1) widget lookups by ID */
  const widgetMap = computed(() => {
    const map = new Map<string, Widget>()
    for (const w of widgets.value) map.set(w.id, w)
    return map
  })

  /** Internal Map for O(1) element lookups by ID */
  const elementMap = computed(() => {
    const map = new Map<string, CanvasElement>()
    for (const e of elements.value) map.set(e.id, e)
    return map
  })

  // ============================================================================
  // Getters - Selection
  // ============================================================================

  /** All selected items */
  const selectedItems = computed(() => selection.value)

  /** Number of selected items */
  const selectionCount = computed(() => selection.value.length)

  /** Whether multiple items are selected */
  const isMultiSelection = computed(() => selection.value.length > 1)

  /** Selected widget IDs */
  const selectedWidgetIds = computed(() =>
    selection.value.filter((s) => s.type === 'widget').map((s) => s.id)
  )

  /** Selected element IDs */
  const selectedElementIds = computed(() =>
    selection.value.filter((s) => s.type === 'element').map((s) => s.id)
  )

  /** Selected widget ID (for backward compatibility - first selected widget) */
  const selectedWidgetId = computed(() =>
    selectedWidgetIds.value.length > 0 ? selectedWidgetIds.value[0] : null
  )

  /** Selected element ID (for backward compatibility - first selected element) */
  const selectedElementId = computed(() =>
    selectedElementIds.value.length > 0 ? selectedElementIds.value[0] : null
  )

  /** Selected widget object (first selected) */
  const selectedWidget = computed(() => {
    if (!selectedWidgetId.value) return null
    return widgetMap.value.get(selectedWidgetId.value) ?? null
  })

  /** Selected element object (first selected) */
  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null
    return elementMap.value.get(selectedElementId.value) ?? null
  })

  /** Set for O(1) widget selection checks */
  const selectedWidgetIdSet = computed(() => new Set(selectedWidgetIds.value))

  /** Set for O(1) element selection checks */
  const selectedElementIdSet = computed(() => new Set(selectedElementIds.value))

  /** All selected widgets */
  const selectedWidgets = computed(() =>
    widgets.value.filter((w) => selectedWidgetIdSet.value.has(w.id))
  )

  /** All selected elements */
  const selectedElements = computed(() =>
    elements.value.filter((e) => selectedElementIdSet.value.has(e.id))
  )

  /** Whether anything is selected */
  const hasSelection = computed(() => selection.value.length > 0)

  /** Selection type ('widget' | 'element' | 'mixed' | null) */
  const selectionType = computed(() => {
    if (selection.value.length === 0) return null
    const types = new Set(selection.value.map((s) => s.type))
    if (types.size > 1) return 'mixed'
    return selection.value[0].type
  })

  /** Check if a specific item is selected */
  function isSelected(type: 'widget' | 'element', id: string): boolean {
    return selection.value.some((s) => s.type === type && s.id === id)
  }

  // ============================================================================
  // Getters - Z-Index
  // ============================================================================

  /** Maximum z-index across all widgets and elements */
  const maxZIndex = computed(() => {
    const widgetZIndexes = widgets.value.map((w) => w.zIndex)
    const elementZIndexes = elements.value.map((e) => e.zIndex)
    const allZIndexes = [...widgetZIndexes, ...elementZIndexes]
    if (allZIndexes.length === 0) return 0
    return Math.max(...allZIndexes)
  })

  /** Minimum z-index across all widgets and elements */
  const minZIndex = computed(() => {
    const widgetZIndexes = widgets.value.map((w) => w.zIndex)
    const elementZIndexes = elements.value.map((e) => e.zIndex)
    const allZIndexes = [...widgetZIndexes, ...elementZIndexes]
    if (allZIndexes.length === 0) return 0
    return Math.min(...allZIndexes)
  })

  // ============================================================================
  // Helpers - Element Point Translation
  // ============================================================================

  /**
   * Translate (move) an element's points by the given delta.
   * Handles line/arrow and draw elements with proper type safety.
   */
  function translateElementPoints(element: CanvasElement, dx: number, dy: number): void {
    if (isLineElement(element)) {
      element.points.start.x += dx
      element.points.start.y += dy
      element.points.end.x += dx
      element.points.end.y += dy
    } else if (isDrawElement(element)) {
      for (const point of element.points) {
        point.x += dx
        point.y += dy
      }
    }
  }

  /**
   * Scale an element's points proportionally when resizing.
   * Handles line/arrow and draw elements with proper type safety.
   */
  function scaleElementPoints(
    element: CanvasElement,
    oldRect: { x: number; y: number; width: number; height: number },
    newRect: { x: number; y: number; width: number; height: number }
  ): void {
    const scaleX = oldRect.width > 0 ? newRect.width / oldRect.width : 1
    const scaleY = oldRect.height > 0 ? newRect.height / oldRect.height : 1

    if (isLineElement(element)) {
      element.points.start.x = newRect.x + (element.points.start.x - oldRect.x) * scaleX
      element.points.start.y = newRect.y + (element.points.start.y - oldRect.y) * scaleY
      element.points.end.x = newRect.x + (element.points.end.x - oldRect.x) * scaleX
      element.points.end.y = newRect.y + (element.points.end.y - oldRect.y) * scaleY
    } else if (isDrawElement(element)) {
      for (const point of element.points) {
        point.x = newRect.x + (point.x - oldRect.x) * scaleX
        point.y = newRect.y + (point.y - oldRect.y) * scaleY
      }
    }
  }

  // ============================================================================
  // Actions - Document Management
  // ============================================================================

  function createNewBoard(titleStr: string) {
    document.value = createEmptyDocument(titleStr)
    selection.value = []
    isDirty.value = false
  }

  function loadDocument(doc: BoardkitDocument) {
    // Apply migrations if needed
    const migratedDoc = migrateDocument(doc)
    document.value = migratedDoc
    selection.value = []
    isDirty.value = false
  }

  function setTitle(newTitle: string) {
    if (!document.value) return
    document.value.meta.title = newTitle
    markDirty(`Renamed board to "${newTitle}"`)
  }

  function getDocument(): BoardkitDocument | null {
    return document.value
  }

  // ============================================================================
  // Actions - Widget Management
  // ============================================================================

  function addWidget(moduleId: string, x?: number, y?: number): string | null {
    if (!document.value) return null

    const moduleDef = moduleRegistry.get(moduleId)
    if (!moduleDef) {
      console.error(`Module "${moduleId}" not found in registry`)
      return null
    }

    const id = nanoid()
    const widget: Widget = {
      id,
      moduleId,
      rect: {
        x: x ?? 100 + Math.random() * 200,
        y: y ?? 100 + Math.random() * 200,
        width: moduleDef.defaultWidth ?? 300,
        height: moduleDef.defaultHeight ?? 200,
      },
      zIndex: maxZIndex.value + 1,
    }

    document.value.board.widgets.push(widget)
    document.value.modules[id] = moduleDef.serialize(moduleDef.defaultState())
    selectWidget(id)
    markDirty(`Added ${moduleDef.displayName} widget`)

    return id
  }

  function removeWidget(widgetId: string) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    const index = document.value.board.widgets.findIndex((w) => w.id === widgetId)
    if (index === -1) return

    const moduleDef = widget ? moduleRegistry.get(widget.moduleId) : null
    const moduleName = moduleDef?.displayName ?? 'widget'

    // Clean up data sharing BEFORE removing widget
    cleanupWidgetDataSharing(widgetId)

    document.value.board.widgets.splice(index, 1)
    delete document.value.modules[widgetId]

    if (selectedWidgetId.value === widgetId) {
      clearSelection()
    }
    markDirty(`Deleted ${moduleName}`)
  }

  function moveWidget(widgetId: string, x: number, y: number) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    widget.rect.x = x
    widget.rect.y = y
    markDirty('Moved widget')
  }

  function resizeWidget(widgetId: string, width: number, height: number) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    const minWidth = moduleDef?.minWidth ?? 100
    const minHeight = moduleDef?.minHeight ?? 100

    widget.rect.width = Math.max(minWidth, width)
    widget.rect.height = Math.max(minHeight, height)
    markDirty('Resized widget')
  }

  function duplicateWidget(widgetId: string): string | null {
    if (!document.value) return null

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return null

    const moduleDef = moduleRegistry.get(widget.moduleId)
    const moduleName = moduleDef?.displayName ?? 'widget'

    const newId = nanoid()
    const offset = 20

    const newWidget: Widget = {
      id: newId,
      moduleId: widget.moduleId,
      rect: {
        x: widget.rect.x + offset,
        y: widget.rect.y + offset,
        width: widget.rect.width,
        height: widget.rect.height,
      },
      zIndex: maxZIndex.value + 1,
      // Copy visibility settings if they exist
      visibility: widget.visibility ? { ...widget.visibility } : undefined,
    }

    // Deep clone the module state
    const moduleState = document.value.modules[widgetId]
    document.value.modules[newId] = JSON.parse(JSON.stringify(moduleState))
    document.value.board.widgets.push(newWidget)
    selectWidget(newId)
    markDirty(`Duplicated ${moduleName}`)

    return newId
  }

  function nudgeWidget(widgetId: string, dx: number, dy: number) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    widget.rect.x += dx
    widget.rect.y += dy
    markDirty('Moved widget')
  }

  function updateWidgetVisibility(
    widgetId: string,
    updates: Partial<WidgetVisibilitySettings>
  ) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    // Initialize visibility if it doesn't exist
    if (!widget.visibility) {
      widget.visibility = { ...DEFAULT_WIDGET_VISIBILITY }
    }

    Object.assign(widget.visibility, updates)
    markDirty('Updated widget visibility')
  }

  function getWidgetVisibility(widgetId: string): WidgetVisibilitySettings {
    const widget = widgetMap.value.get(widgetId)
    return widget?.visibility ?? { ...DEFAULT_WIDGET_VISIBILITY }
  }

  // ============================================================================
  // Actions - Element Management
  // ============================================================================

  function addElement(element: Omit<CanvasElement, 'id' | 'zIndex'>): string {
    if (!document.value) return ''

    const id = nanoid()
    const newElement = {
      ...element,
      id,
      zIndex: maxZIndex.value + 1,
    } as CanvasElement

    document.value.board.elements.push(newElement)
    selectElement(id)
    markDirty(`Added ${element.type}`)

    return id
  }

  function removeElement(elementId: string) {
    if (!document.value) return

    const index = document.value.board.elements.findIndex((e) => e.id === elementId)
    if (index === -1) return

    const element = document.value.board.elements[index]
    document.value.board.elements.splice(index, 1)

    if (selectedElementId.value === elementId) {
      clearSelection()
    }
    markDirty(`Deleted ${element.type}`)
  }

  function updateElement(elementId: string, updates: Partial<CanvasElement>) {
    if (!document.value) return

    const element = elementMap.value.get(elementId)
    if (!element) return

    Object.assign(element, updates)
    markDirty(`Updated ${element.type}`)
  }

  function moveElement(elementId: string, x: number, y: number, skipDirty = false) {
    if (!document.value) return

    const element = elementMap.value.get(elementId)
    if (!element) return

    // Calculate delta for point-based elements
    const dx = x - element.rect.x
    const dy = y - element.rect.y

    // Update bounding box
    element.rect.x = x
    element.rect.y = y

    // Update points for line/arrow/draw elements
    translateElementPoints(element, dx, dy)

    if (!skipDirty) {
      markDirty('Moved element')
    }
  }

  function resizeElement(
    elementId: string,
    newRect: { x: number; y: number; width: number; height: number },
    skipDirty = false
  ) {
    if (!document.value) return

    const element = elementMap.value.get(elementId)
    if (!element) return

    const oldRect = { ...element.rect }

    // Update the bounding box
    element.rect.x = newRect.x
    element.rect.y = newRect.y
    element.rect.width = Math.max(10, newRect.width)
    element.rect.height = Math.max(10, newRect.height)

    // Scale points proportionally for line/arrow/draw elements
    scaleElementPoints(element, oldRect, newRect)

    if (!skipDirty) {
      markDirty('Resized element')
    }
  }

  function duplicateElement(elementId: string): string | null {
    if (!document.value) return null

    const element = elementMap.value.get(elementId)
    if (!element) return null

    const newId = nanoid()
    const offset = 20

    const newElement = JSON.parse(JSON.stringify(element)) as CanvasElement
    newElement.id = newId
    newElement.rect.x += offset
    newElement.rect.y += offset
    newElement.zIndex = maxZIndex.value + 1

    document.value.board.elements.push(newElement)
    selectElement(newId)
    markDirty(`Duplicated ${element.type}`)

    return newId
  }

  function nudgeElement(elementId: string, dx: number, dy: number) {
    if (!document.value) return

    const element = elementMap.value.get(elementId)
    if (!element) return

    element.rect.x += dx
    element.rect.y += dy
    markDirty('Moved element')
  }

  function bringElementToFront(elementId: string) {
    if (!document.value) return

    const element = elementMap.value.get(elementId)
    if (!element) return

    element.zIndex = maxZIndex.value + 1
    markDirty('Brought element to front')
  }

  function sendElementToBack(elementId: string) {
    if (!document.value) return

    const element = elementMap.value.get(elementId)
    if (!element) return

    element.zIndex = minZIndex.value - 1
    markDirty('Sent element to back')
  }

  // ============================================================================
  // Actions - Selection
  // ============================================================================

  /**
   * Select a single widget (replaces current selection).
   */
  function selectWidget(widgetId: string | null, addToSelection = false) {
    if (widgetId === null) {
      if (!addToSelection) {
        selection.value = []
      }
      return
    }

    const item: SelectionItem = { type: 'widget', id: widgetId }

    if (addToSelection) {
      // Toggle selection if already selected
      const existingIndex = selection.value.findIndex(
        (s) => s.type === 'widget' && s.id === widgetId
      )
      if (existingIndex >= 0) {
        selection.value.splice(existingIndex, 1)
      } else {
        selection.value.push(item)
      }
    } else {
      selection.value = [item]
    }

    // Bring to front if selecting
    if (document.value && !addToSelection) {
      const widget = widgetMap.value.get(widgetId)
      if (widget && widget.zIndex < maxZIndex.value) {
        widget.zIndex = maxZIndex.value + 1
      }
    }
  }

  /**
   * Select a single element (replaces current selection).
   */
  function selectElement(elementId: string | null, addToSelection = false) {
    if (elementId === null) {
      if (!addToSelection) {
        selection.value = []
      }
      return
    }

    const item: SelectionItem = { type: 'element', id: elementId }

    if (addToSelection) {
      // Toggle selection if already selected
      const existingIndex = selection.value.findIndex(
        (s) => s.type === 'element' && s.id === elementId
      )
      if (existingIndex >= 0) {
        selection.value.splice(existingIndex, 1)
      } else {
        selection.value.push(item)
      }
    } else {
      selection.value = [item]
    }

    // Bring to front if selecting
    if (document.value && !addToSelection) {
      const element = elementMap.value.get(elementId)
      if (element && element.zIndex < maxZIndex.value) {
        element.zIndex = maxZIndex.value + 1
      }
    }
  }

  /**
   * Select multiple items at once (for marquee selection).
   */
  function selectMultiple(items: SelectionItem[], addToSelection = false) {
    if (addToSelection) {
      // Add items that aren't already selected
      for (const item of items) {
        const exists = selection.value.some(
          (s) => s.type === item.type && s.id === item.id
        )
        if (!exists) {
          selection.value.push(item)
        }
      }
    } else {
      selection.value = [...items]
    }
  }

  /**
   * Select all items within a bounding box (marquee selection).
   */
  function selectInRect(rect: { x: number; y: number; width: number; height: number }, addToSelection = false) {
    if (!document.value) return

    const items: SelectionItem[] = []

    // Normalize rect (handle negative dimensions)
    const normalizedRect = {
      x: rect.width >= 0 ? rect.x : rect.x + rect.width,
      y: rect.height >= 0 ? rect.y : rect.y + rect.height,
      width: Math.abs(rect.width),
      height: Math.abs(rect.height),
    }

    // Check widgets
    for (const widget of document.value.board.widgets) {
      if (rectsIntersect(normalizedRect, widget.rect)) {
        items.push({ type: 'widget', id: widget.id })
      }
    }

    // Check elements
    for (const element of document.value.board.elements) {
      if (rectsIntersect(normalizedRect, element.rect)) {
        items.push({ type: 'element', id: element.id })
      }
    }

    selectMultiple(items, addToSelection)
  }

  /**
   * Clear all selections.
   */
  function clearSelection() {
    selection.value = []
  }

  /**
   * Move all selected items by delta.
   */
  function moveSelection(dx: number, dy: number, skipDirty = false) {
    if (!document.value || selection.value.length === 0) return

    for (const item of selection.value) {
      if (item.type === 'widget') {
        const widget = widgetMap.value.get(item.id)
        if (widget) {
          widget.rect.x += dx
          widget.rect.y += dy
        }
      } else {
        const element = elementMap.value.get(item.id)
        if (element) {
          element.rect.x += dx
          element.rect.y += dy
          // Also move line/arrow/draw points
          translateElementPoints(element, dx, dy)
        }
      }
    }

    if (!skipDirty) {
      markDirty('Moved selection')
    }
  }

  /**
   * Delete all selected items.
   */
  function deleteSelection() {
    if (!document.value || selection.value.length === 0) return

    const itemsToDelete = [...selection.value]
    clearSelection()

    for (const item of itemsToDelete) {
      if (item.type === 'widget') {
        const index = document.value.board.widgets.findIndex((w) => w.id === item.id)
        if (index >= 0) {
          document.value.board.widgets.splice(index, 1)
          delete document.value.modules[item.id]
        }
      } else {
        const index = document.value.board.elements.findIndex((e) => e.id === item.id)
        if (index >= 0) {
          document.value.board.elements.splice(index, 1)
        }
      }
    }

    markDirty('Deleted selection')
  }

  /**
   * Duplicate all selected items.
   */
  function duplicateSelection(): string[] {
    if (!document.value || selection.value.length === 0) return []

    const newIds: string[] = []
    const newItems: SelectionItem[] = []
    const offset = 20

    for (const item of selection.value) {
      if (item.type === 'widget') {
        const widget = widgetMap.value.get(item.id)
        if (widget) {
          const newId = nanoid()
          const newWidget: Widget = {
            id: newId,
            moduleId: widget.moduleId,
            rect: {
              x: widget.rect.x + offset,
              y: widget.rect.y + offset,
              width: widget.rect.width,
              height: widget.rect.height,
            },
            zIndex: maxZIndex.value + 1,
            // Copy visibility settings if they exist
            visibility: widget.visibility ? { ...widget.visibility } : undefined,
          }
          document.value.board.widgets.push(newWidget)
          document.value.modules[newId] = JSON.parse(JSON.stringify(document.value.modules[item.id]))
          newIds.push(newId)
          newItems.push({ type: 'widget', id: newId })
        }
      } else {
        const element = elementMap.value.get(item.id)
        if (element) {
          const newId = nanoid()
          const newElement = JSON.parse(JSON.stringify(element)) as CanvasElement
          newElement.id = newId
          newElement.rect.x += offset
          newElement.rect.y += offset
          newElement.zIndex = maxZIndex.value + 1
          // Move line/arrow/draw points too
          translateElementPoints(newElement, offset, offset)
          document.value.board.elements.push(newElement)
          newIds.push(newId)
          newItems.push({ type: 'element', id: newId })
        }
      }
    }

    // Select the new items
    selection.value = newItems
    markDirty('Duplicated selection')
    return newIds
  }

  // Helper function to check if two rectangles intersect
  // Uses EPSILON tolerance to handle floating-point precision issues
  function rectsIntersect(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    const EPSILON = 0.5
    return !(
      a.x + a.width < b.x - EPSILON ||
      b.x + b.width < a.x - EPSILON ||
      a.y + a.height < b.y - EPSILON ||
      b.y + b.height < a.y - EPSILON
    )
  }

  // ============================================================================
  // Actions - Viewport
  // ============================================================================

  function updateViewport(newViewport: Partial<Viewport>) {
    if (!document.value) return
    Object.assign(document.value.board.viewport, newViewport)
  }

  // ============================================================================
  // Actions - Background
  // ============================================================================

  function setBackground(updates: Partial<BoardBackground>) {
    if (!document.value) return
    Object.assign(document.value.board.background, updates)
    markDirty('Changed background')
  }

  // ============================================================================
  // Actions - Module State
  // ============================================================================

  function getModuleState<T = unknown>(widgetId: string): T | null {
    if (!document.value) return null
    const widget = widgetMap.value.get(widgetId)
    if (!widget) return null

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return null

    const serialized = document.value.modules[widgetId]
    if (serialized === undefined) return null

    return moduleDef.deserialize(serialized) as T
  }

  function updateModuleState<T extends object>(widgetId: string, partial: Partial<T>) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return

    const current = moduleDef.deserialize(document.value.modules[widgetId]) as T
    const updated = { ...current, ...partial }
    document.value.modules[widgetId] = moduleDef.serialize(updated)
    markDirty(`Updated ${moduleDef.displayName}`)
  }

  function setModuleState<T>(widgetId: string, state: T) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return

    document.value.modules[widgetId] = moduleDef.serialize(state)
    markDirty(`Updated ${moduleDef.displayName}`)
  }

  // ============================================================================
  // Actions - Dirty State
  // ============================================================================

  function markDirty(action?: string) {
    isDirty.value = true
    if (action) {
      lastAction.value = action
    }
    if (document.value) {
      document.value.meta.updatedAt = Date.now()
    }
  }

  function markClean() {
    isDirty.value = false
  }

  // ============================================================================
  // Actions - Data Sharing
  // ============================================================================

  /**
   * Grant permission for a consumer to read from a provider.
   */
  function grantDataPermission(
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): DataPermission | null {
    if (!document.value) return null

    // Check if permission already exists
    const existing = dataAccessController.checkAccess(
      permissions.value,
      consumerWidgetId,
      providerWidgetId,
      contractId
    )
    if (existing) return null

    // Ensure dataSharing exists
    if (!document.value.dataSharing) {
      document.value.dataSharing = createEmptyDataSharingState()
    }

    const permission = dataAccessController.createPermission(
      consumerWidgetId,
      providerWidgetId,
      contractId
    )
    const link = dataAccessController.createLink(permission)

    document.value.dataSharing.permissions.push(permission)
    document.value.dataSharing.links.push(link)

    markDirty('Connected data source')
    return permission
  }

  /**
   * Revoke a data permission by ID.
   */
  function revokeDataPermission(permissionId: string): boolean {
    if (!document.value?.dataSharing) return false

    const index = document.value.dataSharing.permissions.findIndex((p) => p.id === permissionId)
    if (index === -1) return false

    const permission = document.value.dataSharing.permissions[index]

    // Remove permission
    document.value.dataSharing.permissions.splice(index, 1)

    // Remove corresponding link
    const linkIndex = document.value.dataSharing.links.findIndex(
      (l) =>
        l.consumerWidgetId === permission.consumerWidgetId &&
        l.providerWidgetId === permission.providerWidgetId &&
        l.contractId === permission.contractId
    )
    if (linkIndex >= 0) {
      document.value.dataSharing.links.splice(linkIndex, 1)
    }

    markDirty('Disconnected data source')
    return true
  }

  /**
   * Revoke permission by consumer, provider, and contract IDs.
   */
  function revokeDataPermissionByLink(
    consumerWidgetId: string,
    providerWidgetId: string,
    contractId: string
  ): boolean {
    if (!document.value?.dataSharing) return false

    const permission = dataAccessController.findPermission(
      permissions.value,
      consumerWidgetId,
      providerWidgetId,
      contractId
    )

    if (!permission) return false
    return revokeDataPermission(permission.id)
  }

  /**
   * Clean up data sharing state when a widget is deleted.
   */
  function cleanupWidgetDataSharing(widgetId: string): void {
    if (!document.value?.dataSharing) return

    // Remove all permissions where widget is consumer or provider
    document.value.dataSharing.permissions = document.value.dataSharing.permissions.filter(
      (p) => p.consumerWidgetId !== widgetId && p.providerWidgetId !== widgetId
    )

    // Remove all links
    document.value.dataSharing.links = document.value.dataSharing.links.filter(
      (l) => l.consumerWidgetId !== widgetId && l.providerWidgetId !== widgetId
    )

    // Clean up DataBus subscriptions
    dataBus.removeWidget(widgetId)
  }

  /**
   * Get all permissions for a consumer widget.
   */
  function getConsumerPermissions(consumerWidgetId: string): DataPermission[] {
    return dataAccessController.getConsumerPermissions(permissions.value, consumerWidgetId)
  }

  /**
   * Get all permissions for a provider widget.
   */
  function getProviderPermissions(providerWidgetId: string): DataPermission[] {
    return dataAccessController.getProviderPermissions(permissions.value, providerWidgetId)
  }

  /**
   * Get all widgets that can provide a specific contract.
   */
  function getAvailableProviders(contractId: string): Array<{ id: string; moduleId: string }> {
    return dataAccessController.getAvailableProviders(widgets.value, contractId)
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    document,
    selection,
    isDirty,
    lastAction,

    // Getters - Document
    widgets,
    elements,
    viewport,
    background,
    moduleStates,
    title,

    // Getters - Selection
    selectedItems,
    selectionCount,
    isMultiSelection,
    selectedWidgetIds,
    selectedElementIds,
    selectedWidgetId,
    selectedElementId,
    selectedWidget,
    selectedElement,
    selectedWidgets,
    selectedElements,
    hasSelection,
    selectionType,
    isSelected,

    // Getters - Z-Index
    maxZIndex,
    minZIndex,

    // Actions - Document
    createNewBoard,
    loadDocument,
    setTitle,
    getDocument,

    // Actions - Widget
    addWidget,
    removeWidget,
    moveWidget,
    resizeWidget,
    duplicateWidget,
    nudgeWidget,
    updateWidgetVisibility,
    getWidgetVisibility,

    // Actions - Element
    addElement,
    removeElement,
    updateElement,
    moveElement,
    resizeElement,
    duplicateElement,
    nudgeElement,
    bringElementToFront,
    sendElementToBack,

    // Actions - Selection
    selectWidget,
    selectElement,
    selectMultiple,
    selectInRect,
    clearSelection,
    moveSelection,
    deleteSelection,
    duplicateSelection,

    // Actions - Viewport
    updateViewport,

    // Actions - Background
    setBackground,

    // Actions - Module State
    getModuleState,
    updateModuleState,
    setModuleState,

    // Actions - Dirty State
    markDirty,
    markClean,

    // Data Sharing - Getters
    dataSharing,
    permissions,
    dataLinks,

    // Data Sharing - Actions
    grantDataPermission,
    revokeDataPermission,
    revokeDataPermissionByLink,
    getConsumerPermissions,
    getProviderPermissions,
    getAvailableProviders,
  }
})
