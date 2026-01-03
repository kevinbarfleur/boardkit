import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { nanoid } from 'nanoid'
import type { BoardkitDocument, Widget, Viewport, WidgetVisibilitySettings, CanvasSettings } from '../types/document'
import type { HistoryOptions } from '../types/module'
import {
  DEFAULT_WIDGET_VISIBILITY,
  MIN_WIDGET_SCALE,
  MAX_WIDGET_SCALE,
  DEFAULT_WIDGET_SCALE,
  DEFAULT_CANVAS_SETTINGS,
} from '../types/document'
import type { CanvasElement, BoardBackground, LineElement, DrawElement, GridSettings, Point, ElementGroup, AnchorPosition, ArrowBinding, Connection, ConnectionTargetType } from '../types/element'
import type { DataSharingState, DataPermission, DataLink } from '../types/dataContract'
import { createEmptyDocument } from '../types/document'
import { createEmptyDataSharingState } from '../types/dataContract'
import { DEFAULT_BACKGROUND, DEFAULT_GRID_SETTINGS, GRID_SIZE, isLineElement, isDrawElement } from '../types/element'
import { moduleRegistry } from '../modules/ModuleRegistry'
import { migrateDocument } from '../migrations'
import { dataBus } from '../data/DataBus'
import { dataAccessController } from '../data/DataAccessController'
import { useHistory, type HistoryEntry } from '../composables/useHistory'

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Deep clone an object, handling Vue reactive proxies.
 * Uses structuredClone (2-3x faster than JSON.parse/stringify).
 */
function deepClone<T>(obj: T): T {
  return structuredClone(toRaw(obj))
}

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

  // Clipboard for cut/copy/paste operations
  const clipboard = ref<{
    type: 'widget' | 'element'
    data: Widget | CanvasElement
    isCut: boolean
  } | null>(null)

  // Flag to prevent history captures during document restoration (undo/redo/goToEntry)
  const isRestoring = ref(false)

  // ============================================================================
  // History (Undo/Redo)
  // ============================================================================

  const history = useHistory({ maxSize: 50 })

  // Debounce timers for module state history captures (per widget)
  const historyDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * Clear all pending history debounce timers.
   * Called before document restoration to prevent stale timers from creating history entries.
   */
  function clearHistoryDebounceTimers(): void {
    for (const timer of historyDebounceTimers.values()) {
      clearTimeout(timer)
    }
    historyDebounceTimers.clear()
  }

  // ============================================================================
  // Getters - Document
  // ============================================================================

  const widgets = computed(() => document.value?.board.widgets ?? [])
  const elements = computed(() => document.value?.board.elements ?? [])
  const viewport = computed(() => document.value?.board.viewport ?? { x: 0, y: 0, zoom: 1 })
  const background = computed(() => document.value?.board.background ?? { ...DEFAULT_BACKGROUND })
  const grid = computed((): GridSettings => document.value?.board.grid ?? { ...DEFAULT_GRID_SETTINGS })
  const canvasSettings = computed((): CanvasSettings => document.value?.board.canvasSettings ?? { ...DEFAULT_CANVAS_SETTINGS })
  const groups = computed((): ElementGroup[] => document.value?.board.groups ?? [])
  const connections = computed((): Connection[] => document.value?.board.connections ?? [])
  const moduleStates = computed(() => document.value?.modules ?? {})
  const title = computed(() => document.value?.meta.title ?? '')

  /**
   * Orphan widgets - widgets whose module is not registered.
   * This can happen when a document contains widgets from plugins that aren't installed.
   */
  const orphanWidgets = computed(() => {
    return widgets.value.filter((w) => !moduleRegistry.get(w.moduleId))
  })

  /** Whether there are any orphan widgets */
  const hasOrphanWidgets = computed(() => orphanWidgets.value.length > 0)

  /** Unique module IDs of orphan widgets */
  const orphanModuleIds = computed(() => {
    const ids = new Set(orphanWidgets.value.map((w) => w.moduleId))
    return Array.from(ids)
  })

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

  /** Internal Map for O(1) group lookups by ID */
  const groupMap = computed(() => {
    const map = new Map<string, ElementGroup>()
    for (const g of groups.value) map.set(g.id, g)
    return map
  })

  /** Map from element ID to its group ID */
  const elementToGroupMap = computed(() => {
    const map = new Map<string, string>()
    for (const group of groups.value) {
      for (const memberId of group.memberIds) {
        map.set(memberId, group.id)
      }
    }
    return map
  })

  /** Internal Map for O(1) connection lookups by ID */
  const connectionMap = computed(() => {
    const map = new Map<string, Connection>()
    for (const c of connections.value) map.set(c.id, c)
    return map
  })

  /** ID of the currently entered group (for editing elements inside) */
  const enteredGroupId = ref<string | null>(null)

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

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Added ${moduleDef.displayName}`)

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
    markDirty(`Added ${moduleDef.displayName}`)

    return id
  }

  function removeWidget(widgetId: string) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    const index = document.value.board.widgets.findIndex((w) => w.id === widgetId)
    if (index === -1) return

    const moduleDef = widget ? moduleRegistry.get(widget.moduleId) : null
    const moduleName = moduleDef?.displayName ?? 'widget'

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Deleted ${moduleName}`)

    // Clean up data sharing BEFORE removing widget
    cleanupWidgetDataSharing(widgetId)

    document.value.board.widgets.splice(index, 1)
    delete document.value.modules[widgetId]

    if (selectedWidgetId.value === widgetId) {
      clearSelection()
    }
    markDirty(`Deleted ${moduleName}`)
  }

  /**
   * Remove all orphan widgets (widgets whose module is not registered).
   * This is typically used when loading a document that contains widgets
   * from plugins that aren't installed.
   */
  function removeOrphanWidgets() {
    if (!document.value) return

    const orphans = orphanWidgets.value
    if (orphans.length === 0) return

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Removed ${orphans.length} orphan widget${orphans.length > 1 ? 's' : ''}`)

    // Remove widgets in reverse order to avoid index shifting issues
    for (const widget of orphans) {
      // Clean up data sharing
      cleanupWidgetDataSharing(widget.id)

      // Remove from selection if selected
      if (selection.value.some((s) => s.type === 'widget' && s.id === widget.id)) {
        selection.value = selection.value.filter((s) => !(s.type === 'widget' && s.id === widget.id))
      }

      // Remove widget and its state
      const index = document.value!.board.widgets.findIndex((w) => w.id === widget.id)
      if (index !== -1) {
        document.value!.board.widgets.splice(index, 1)
        delete document.value!.modules[widget.id]
      }
    }

    markDirty(`Removed ${orphans.length} orphan widget${orphans.length > 1 ? 's' : ''}`)
  }

  /**
   * Remove all selected widgets and elements.
   * Used for multi-selection delete.
   */
  function removeSelection() {
    if (!document.value) return

    const widgetCount = selectedWidgetIds.value.length
    const elementCount = selectedElementIds.value.length
    const totalCount = widgetCount + elementCount

    if (totalCount === 0) return

    // Build message first for history label
    const parts: string[] = []
    if (widgetCount > 0) parts.push(`${widgetCount} module${widgetCount > 1 ? 's' : ''}`)
    if (elementCount > 0) parts.push(`${elementCount} element${elementCount > 1 ? 's' : ''}`)
    const label = `Deleted ${parts.join(' and ')}`

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(label)

    // Remove widgets
    for (const widgetId of selectedWidgetIds.value) {
      const index = document.value.board.widgets.findIndex((w) => w.id === widgetId)
      if (index !== -1) {
        cleanupWidgetDataSharing(widgetId)
        document.value.board.widgets.splice(index, 1)
        delete document.value.modules[widgetId]
      }
    }

    // Remove elements
    for (const elementId of selectedElementIds.value) {
      const index = document.value.board.elements.findIndex((e) => e.id === elementId)
      if (index !== -1) {
        document.value.board.elements.splice(index, 1)
      }
    }

    clearSelection()
    markDirty(label)
  }

  function moveWidget(widgetId: string, x: number, y: number, captureHistory = false) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    // Only capture history at the START of a drag, not during
    if (captureHistory) {
      captureHistorySnapshot('Moved widget')
    }

    widget.rect.x = x
    widget.rect.y = y
    markDirty('Moved widget')
  }

  function resizeWidget(widgetId: string, width: number, height: number, captureHistory = false) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    // Only capture history at the START of a resize, not during
    if (captureHistory) {
      captureHistorySnapshot('Resized widget')
    }

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

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Duplicated ${moduleName}`)

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
      // Copy scale if set
      scale: widget.scale,
    }

    // Deep clone the module state
    const moduleState = document.value.modules[widgetId]
    document.value.modules[newId] = deepClone(moduleState)
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

  function updateWidgetScale(widgetId: string, scale: number) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    // Clamp scale to valid range
    const clampedScale = Math.max(MIN_WIDGET_SCALE, Math.min(MAX_WIDGET_SCALE, scale))

    widget.scale = clampedScale
    markDirty('Updated widget scale')
  }

  function getWidgetScale(widgetId: string): number {
    const widget = widgetMap.value.get(widgetId)
    return widget?.scale ?? DEFAULT_WIDGET_SCALE
  }

  // ============================================================================
  // Actions - Element Management
  // ============================================================================

  function addElement(element: Omit<CanvasElement, 'id' | 'zIndex'>): string {
    if (!document.value) return ''

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Added ${element.type}`)

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

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Deleted ${element.type}`)

    // Clean up connections involving this element
    cleanupConnectionsForElement(elementId)

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

    // Update any arrows bound to this shape
    if (element.type === 'rectangle' || element.type === 'ellipse') {
      updateBoundArrowsForElement(elementId)
    }

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

    // Update any arrows bound to this shape
    if (element.type === 'rectangle' || element.type === 'ellipse') {
      updateBoundArrowsForElement(elementId)
    }

    if (!skipDirty) {
      markDirty('Resized element')
    }
  }

  function duplicateElement(elementId: string): string | null {
    if (!document.value) return null

    const element = elementMap.value.get(elementId)
    if (!element) return null

    // Capture snapshot BEFORE mutation for undo
    captureHistorySnapshot(`Duplicated ${element.type}`)

    const newId = nanoid()
    const offset = 20

    const newElement = deepClone(element) as CanvasElement
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

    // Track moved element IDs to update bound arrows
    const movedElementIds: string[] = []

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
          movedElementIds.push(item.id)
        }
      }
    }

    // Update arrows bound to moved shapes
    for (const elementId of movedElementIds) {
      updateBoundArrowsForElement(elementId)
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

    // Collect deleted element IDs for orphan cleanup
    const deletedElementIds = new Set<string>()
    const deletedWidgetIds = new Set<string>()

    for (const item of itemsToDelete) {
      if (item.type === 'widget') {
        deletedWidgetIds.add(item.id)
        const index = document.value.board.widgets.findIndex((w) => w.id === item.id)
        if (index >= 0) {
          cleanupWidgetDataSharing(item.id)
          document.value.board.widgets.splice(index, 1)
          delete document.value.modules[item.id]
        }
      } else {
        deletedElementIds.add(item.id)
        // Clean up connections for this element
        cleanupConnectionsForElement(item.id)
        const index = document.value.board.elements.findIndex((e) => e.id === item.id)
        if (index >= 0) {
          document.value.board.elements.splice(index, 1)
        }
      }
    }

    // Clean up orphan bindings - arrows that were bound to deleted shapes
    if (deletedElementIds.size > 0) {
      for (const element of document.value.board.elements) {
        if (isLineElement(element)) {
          if (element.startBinding && deletedElementIds.has(element.startBinding.elementId)) {
            element.startBinding = undefined
          }
          if (element.endBinding && deletedElementIds.has(element.endBinding.elementId)) {
            element.endBinding = undefined
          }
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
            // Copy scale if set
            scale: widget.scale,
          }
          document.value.board.widgets.push(newWidget)
          document.value.modules[newId] = deepClone(document.value.modules[item.id])
          newIds.push(newId)
          newItems.push({ type: 'widget', id: newId })
        }
      } else {
        const element = elementMap.value.get(item.id)
        if (element) {
          const newId = nanoid()
          const newElement = deepClone(element) as CanvasElement
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
  // Actions - Canvas Settings
  // ============================================================================

  /**
   * Update canvas settings.
   */
  function updateCanvasSettings(updates: Partial<CanvasSettings>): void {
    if (!document.value) return
    if (!document.value.board.canvasSettings) {
      document.value.board.canvasSettings = { ...DEFAULT_CANVAS_SETTINGS }
    }
    Object.assign(document.value.board.canvasSettings, updates)
    markDirty('Updated canvas settings')
  }

  // ============================================================================
  // Actions - Grid (Snap to Grid)
  // ============================================================================

  /**
   * Toggle grid snapping on/off.
   */
  function toggleGrid(): void {
    if (!document.value) return
    updateCanvasSettings({ snapToGrid: !canvasSettings.value.snapToGrid })
  }

  /**
   * Set grid enabled state.
   * @deprecated Use updateCanvasSettings({ snapToGrid: enabled }) instead.
   */
  function setGridEnabled(enabled: boolean): void {
    if (!document.value) return
    updateCanvasSettings({ snapToGrid: enabled })
  }

  /**
   * @deprecated Grid size is now fixed at GRID_SIZE (20px). This function is kept for backwards compatibility.
   */
  function setGridSize(_size: number): void {
    // No-op: Grid size is now fixed at GRID_SIZE (20px)
    // Kept for backwards compatibility with existing code
  }

  /**
   * @deprecated Grid overlay removed. Background pattern serves as visual guide.
   */
  function setGridVisible(_visible: boolean): void {
    // No-op: Grid overlay removed, background pattern is always visible
    // Kept for backwards compatibility with existing code
  }

  /**
   * Snap a value to the grid.
   * Uses gridSpacing from canvasSettings (defaults to 20px).
   * Returns the original value if snap is disabled.
   */
  function snapToGrid(value: number): number {
    if (!canvasSettings.value.snapToGrid) return value
    const spacing = canvasSettings.value.gridSpacing
    return Math.round(value / spacing) * spacing
  }

  /**
   * Snap a point to the grid.
   * Returns the original point if snap is disabled.
   */
  function snapPointToGrid(point: Point): Point {
    if (!canvasSettings.value.snapToGrid) return point
    return {
      x: snapToGrid(point.x),
      y: snapToGrid(point.y),
    }
  }

  /**
   * Snap a rect's position and size to the grid.
   * Returns the original rect if snap is disabled.
   */
  function snapRectToGrid(rect: { x: number; y: number; width: number; height: number }): {
    x: number
    y: number
    width: number
    height: number
  } {
    if (!canvasSettings.value.snapToGrid) return rect
    return {
      x: snapToGrid(rect.x),
      y: snapToGrid(rect.y),
      width: snapToGrid(rect.width),
      height: snapToGrid(rect.height),
    }
  }

  // ============================================================================
  // Actions - Clipboard (Cut/Copy/Paste)
  // ============================================================================

  /**
   * Copy the current selection to the clipboard.
   */
  function copySelection(): boolean {
    if (selection.value.length === 0) return false

    // For now, only support single selection
    const item = selection.value[0]

    if (item.type === 'widget') {
      const widget = widgetMap.value.get(item.id)
      if (!widget || !document.value) return false

      const moduleState = document.value.modules[item.id]
      clipboard.value = {
        type: 'widget',
        data: deepClone({ ...widget, moduleState }),
        isCut: false,
      }
      return true
    } else {
      const element = elementMap.value.get(item.id)
      if (!element) return false

      clipboard.value = {
        type: 'element',
        data: deepClone(element),
        isCut: false,
      }
      return true
    }
  }

  /**
   * Cut the current selection (copy + delete).
   */
  function cutSelection(): boolean {
    if (!copySelection()) return false

    clipboard.value!.isCut = true

    // Delete the original
    const item = selection.value[0]
    if (item.type === 'widget') {
      removeWidget(item.id)
    } else {
      removeElement(item.id)
    }

    return true
  }

  /**
   * Paste from the clipboard.
   */
  function pasteFromClipboard(): string | null {
    if (!clipboard.value || !document.value) return null

    const offset = 20

    if (clipboard.value.type === 'widget') {
      const widgetData = clipboard.value.data as Widget & { moduleState?: unknown }
      const newId = nanoid()

      // Capture history before mutation
      const moduleDef = moduleRegistry.get(widgetData.moduleId)
      const moduleName = moduleDef?.displayName ?? 'widget'
      captureHistorySnapshot(`Pasted ${moduleName}`)

      const newWidget: Widget = {
        id: newId,
        moduleId: widgetData.moduleId,
        rect: {
          x: widgetData.rect.x + offset,
          y: widgetData.rect.y + offset,
          width: widgetData.rect.width,
          height: widgetData.rect.height,
        },
        zIndex: maxZIndex.value + 1,
        visibility: widgetData.visibility ? { ...widgetData.visibility } : undefined,
        scale: widgetData.scale,
      }

      document.value.board.widgets.push(newWidget)

      // Clone the module state
      if (widgetData.moduleState !== undefined) {
        document.value.modules[newId] = deepClone(widgetData.moduleState)
      } else if (moduleDef) {
        document.value.modules[newId] = moduleDef.serialize(moduleDef.defaultState())
      }

      selectWidget(newId)
      markDirty(`Pasted ${moduleName}`)

      // Clear clipboard if it was a cut
      if (clipboard.value.isCut) {
        clipboard.value = null
      }

      return newId
    } else {
      const elementData = clipboard.value.data as CanvasElement
      const newId = nanoid()

      captureHistorySnapshot(`Pasted ${elementData.type}`)

      const newElement = deepClone(elementData) as CanvasElement
      newElement.id = newId
      newElement.rect.x += offset
      newElement.rect.y += offset
      newElement.zIndex = maxZIndex.value + 1

      // Move line/arrow/draw points too
      translateElementPoints(newElement, offset, offset)

      document.value.board.elements.push(newElement)
      selectElement(newId)
      markDirty(`Pasted ${elementData.type}`)

      // Clear clipboard if it was a cut
      if (clipboard.value.isCut) {
        clipboard.value = null
      }

      return newId
    }
  }

  /**
   * Check if clipboard has content.
   */
  function hasClipboardContent(): boolean {
    return clipboard.value !== null
  }

  // ============================================================================
  // Actions - Grouping
  // ============================================================================

  /**
   * Get the group for an element (if any).
   */
  function getGroupForElement(elementId: string): ElementGroup | null {
    const groupId = elementToGroupMap.value.get(elementId)
    if (!groupId) return null
    return groupMap.value.get(groupId) ?? null
  }

  /**
   * Get all elements in a group.
   */
  function getGroupMembers(groupId: string): CanvasElement[] {
    const group = groupMap.value.get(groupId)
    if (!group) return []
    return group.memberIds
      .map(id => elementMap.value.get(id))
      .filter((el): el is CanvasElement => el !== undefined)
  }

  /**
   * Get the bounding box of a group.
   */
  function getGroupBoundingBox(groupId: string): { x: number; y: number; width: number; height: number } | null {
    const members = getGroupMembers(groupId)
    if (members.length === 0) return null

    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    for (const el of members) {
      minX = Math.min(minX, el.rect.x)
      minY = Math.min(minY, el.rect.y)
      maxX = Math.max(maxX, el.rect.x + el.rect.width)
      maxY = Math.max(maxY, el.rect.y + el.rect.height)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * Create a new group from selected elements.
   * Requires at least 2 elements to be selected.
   */
  function createGroup(elementIds: string[]): string | null {
    if (!document.value || elementIds.length < 2) return null

    // Filter out elements that are already in groups
    const ungroupedIds = elementIds.filter(id => !elementToGroupMap.value.has(id))
    if (ungroupedIds.length < 2) return null

    captureHistorySnapshot('Created group')

    const groupId = nanoid()
    const newGroup: ElementGroup = {
      id: groupId,
      memberIds: [...ungroupedIds],
    }

    if (!document.value.board.groups) {
      document.value.board.groups = []
    }
    document.value.board.groups.push(newGroup)

    markDirty('Created group')
    return groupId
  }

  /**
   * Ungroup elements in a group.
   */
  function ungroup(groupId: string): boolean {
    if (!document.value?.board.groups) return false

    const index = document.value.board.groups.findIndex(g => g.id === groupId)
    if (index === -1) return false

    captureHistorySnapshot('Ungrouped elements')
    document.value.board.groups.splice(index, 1)

    // Exit the group if we were inside it
    if (enteredGroupId.value === groupId) {
      enteredGroupId.value = null
    }

    markDirty('Ungrouped elements')
    return true
  }

  /**
   * Enter a group for editing individual elements.
   */
  function enterGroup(groupId: string): void {
    if (groupMap.value.has(groupId)) {
      enteredGroupId.value = groupId
    }
  }

  /**
   * Exit the currently entered group.
   */
  function exitGroup(): void {
    enteredGroupId.value = null
    clearSelection()
  }

  /**
   * Check if we're currently inside a group.
   */
  function isInsideGroup(): boolean {
    return enteredGroupId.value !== null
  }

  /**
   * Move all elements in a group by delta.
   */
  function moveGroup(groupId: string, dx: number, dy: number, skipDirty = false): void {
    const members = getGroupMembers(groupId)
    for (const element of members) {
      element.rect.x += dx
      element.rect.y += dy
      translateElementPoints(element, dx, dy)
    }
    if (!skipDirty) {
      markDirty('Moved group')
    }
  }

  // ============================================================================
  // Actions - Arrow Binding
  // ============================================================================

  /**
   * Bind an arrow endpoint to a shape.
   * @param arrowId - The arrow element ID
   * @param endpoint - Which endpoint to bind ('start' or 'end')
   * @param targetId - The target shape element ID
   * @param anchor - The anchor position on the target
   */
  function bindArrowToShape(
    arrowId: string,
    endpoint: 'start' | 'end',
    targetId: string,
    anchor: AnchorPosition
  ): boolean {
    const arrow = elementMap.value.get(arrowId) as LineElement | undefined
    if (!arrow) return false
    if (arrow.type !== 'arrow' && arrow.type !== 'line') return false

    const target = elementMap.value.get(targetId)
    if (!target) return false
    if (target.type !== 'rectangle' && target.type !== 'ellipse') return false

    const binding: ArrowBinding = {
      elementId: targetId,
      anchor,
    }

    if (endpoint === 'start') {
      arrow.startBinding = binding
    } else {
      arrow.endBinding = binding
    }

    // Update arrow endpoint to match anchor position
    updateArrowEndpointFromBinding(arrow, endpoint)

    markDirty('Bound arrow')
    return true
  }

  /**
   * Unbind an arrow endpoint from its shape.
   */
  function unbindArrow(arrowId: string, endpoint: 'start' | 'end'): boolean {
    const arrow = elementMap.value.get(arrowId) as LineElement | undefined
    if (!arrow || arrow.type !== 'arrow') return false

    if (endpoint === 'start') {
      arrow.startBinding = undefined
    } else {
      arrow.endBinding = undefined
    }

    markDirty('Unbound arrow')
    return true
  }

  /**
   * Update an arrow endpoint position based on its binding.
   */
  function updateArrowEndpointFromBinding(arrow: LineElement, endpoint: 'start' | 'end'): void {
    const binding = endpoint === 'start' ? arrow.startBinding : arrow.endBinding
    if (!binding) return

    const target = elementMap.value.get(binding.elementId)
    if (!target) {
      // Target no longer exists, unbind
      if (endpoint === 'start') {
        arrow.startBinding = undefined
      } else {
        arrow.endBinding = undefined
      }
      return
    }

    // Calculate anchor point position
    const anchorPoint = getAnchorPointForElement(target, binding.anchor)

    // Update the arrow endpoint using { start, end } structure
    if (endpoint === 'start') {
      arrow.points.start = { ...anchorPoint }
      updateArrowRectFromPoints(arrow)
    } else {
      arrow.points.end = { ...anchorPoint }
      updateArrowRectFromPoints(arrow)
    }
  }

  /**
   * Update arrow rect from its start/end points.
   */
  function updateArrowRectFromPoints(arrow: LineElement): void {
    const { start, end } = arrow.points
    arrow.rect.x = Math.min(start.x, end.x)
    arrow.rect.y = Math.min(start.y, end.y)
    arrow.rect.width = Math.abs(end.x - start.x)
    arrow.rect.height = Math.abs(end.y - start.y)
  }

  /**
   * Get the anchor point position for an element.
   */
  function getAnchorPointForElement(element: CanvasElement, anchor: AnchorPosition): Point {
    const { x, y, width, height } = element.rect
    const centerX = x + width / 2
    const centerY = y + height / 2

    switch (anchor) {
      case 'top':
        return { x: centerX, y }
      case 'bottom':
        return { x: centerX, y: y + height }
      case 'left':
        return { x, y: centerY }
      case 'right':
        return { x: x + width, y: centerY }
      case 'center':
      default:
        return { x: centerX, y: centerY }
    }
  }

  /**
   * Update all arrows bound to a shape after it moves.
   * Call this after moving or resizing a shape.
   */
  function updateBoundArrowsForElement(elementId: string): void {
    if (!document.value) return

    // Find all lines/arrows with bindings to this element
    for (const element of elements.value) {
      if (element.type !== 'arrow' && element.type !== 'line') continue

      const lineOrArrow = element as LineElement
      if (lineOrArrow.startBinding?.elementId === elementId) {
        updateArrowEndpointFromBinding(lineOrArrow, 'start')
      }
      if (lineOrArrow.endBinding?.elementId === elementId) {
        updateArrowEndpointFromBinding(lineOrArrow, 'end')
      }
    }
  }

  /**
   * Check if an arrow endpoint is bound.
   */
  function isArrowBound(arrowId: string, endpoint: 'start' | 'end'): boolean {
    const arrow = elementMap.value.get(arrowId) as LineElement | undefined
    if (!arrow || arrow.type !== 'arrow') return false

    const binding = endpoint === 'start' ? arrow.startBinding : arrow.endBinding
    return binding !== undefined
  }

  /**
   * Get the binding info for an arrow endpoint.
   */
  function getArrowBinding(arrowId: string, endpoint: 'start' | 'end'): ArrowBinding | undefined {
    const arrow = elementMap.value.get(arrowId) as LineElement | undefined
    if (!arrow || arrow.type !== 'arrow') return undefined

    return endpoint === 'start' ? arrow.startBinding : arrow.endBinding
  }

  // ============================================================================
  // Actions - Connections (Intentional Links)
  // ============================================================================

  /**
   * Add a new connection between two elements/widgets.
   * @param sourceId - ID of the source element or widget
   * @param sourceType - Type of the source ('element' or 'widget')
   * @param targetId - ID of the target element or widget
   * @param targetType - Type of the target ('element' or 'widget')
   * @returns The new connection ID, or null if creation failed
   */
  function addConnection(
    sourceId: string,
    sourceType: ConnectionTargetType,
    targetId: string,
    targetType: ConnectionTargetType
  ): string | null {
    if (!document.value) return null

    // Validate source exists
    if (sourceType === 'element') {
      if (!elementMap.value.has(sourceId)) return null
    } else {
      if (!widgetMap.value.has(sourceId)) return null
    }

    // Validate target exists
    if (targetType === 'element') {
      if (!elementMap.value.has(targetId)) return null
    } else {
      if (!widgetMap.value.has(targetId)) return null
    }

    // Don't allow self-connections
    if (sourceId === targetId) return null

    // Check for duplicate connection
    const existingConnection = connections.value.find(
      (c) =>
        (c.sourceId === sourceId && c.targetId === targetId) ||
        (c.sourceId === targetId && c.targetId === sourceId)
    )
    if (existingConnection) return null

    // Capture history
    captureHistorySnapshot('Created connection')

    // Ensure connections array exists
    if (!document.value.board.connections) {
      document.value.board.connections = []
    }

    const connection: Connection = {
      id: nanoid(),
      sourceId,
      sourceType,
      targetId,
      targetType,
    }

    document.value.board.connections.push(connection)
    markDirty('Created connection')

    return connection.id
  }

  /**
   * Remove a connection by ID.
   */
  function removeConnection(connectionId: string): boolean {
    if (!document.value?.board.connections) return false

    const index = document.value.board.connections.findIndex((c) => c.id === connectionId)
    if (index === -1) return false

    captureHistorySnapshot('Deleted connection')
    document.value.board.connections.splice(index, 1)
    markDirty('Deleted connection')

    return true
  }

  /**
   * Get all connections involving an element or widget.
   * @param id - ID of the element or widget
   * @param type - Type of the item ('element' or 'widget')
   * @returns Array of connections where this item is source or target
   */
  function getConnectionsForItem(id: string, type: ConnectionTargetType): Connection[] {
    return connections.value.filter(
      (c) =>
        (c.sourceId === id && c.sourceType === type) ||
        (c.targetId === id && c.targetType === type)
    )
  }

  /**
   * Get all connections for an element (for use in moveElement/resizeElement).
   */
  function getConnectionsForElement(elementId: string): Connection[] {
    return getConnectionsForItem(elementId, 'element')
  }

  /**
   * Get all connections for a widget.
   */
  function getConnectionsForWidget(widgetId: string): Connection[] {
    return getConnectionsForItem(widgetId, 'widget')
  }

  /**
   * Clean up connections when an element is deleted.
   * Removes all connections involving the deleted element.
   */
  function cleanupConnectionsForElement(elementId: string): void {
    if (!document.value?.board.connections) return

    document.value.board.connections = document.value.board.connections.filter(
      (c) =>
        !(
          (c.sourceId === elementId && c.sourceType === 'element') ||
          (c.targetId === elementId && c.targetType === 'element')
        )
    )
  }

  /**
   * Clean up connections when a widget is deleted.
   * Removes all connections involving the deleted widget.
   */
  function cleanupConnectionsForWidget(widgetId: string): void {
    if (!document.value?.board.connections) return

    document.value.board.connections = document.value.board.connections.filter(
      (c) =>
        !(
          (c.sourceId === widgetId && c.sourceType === 'widget') ||
          (c.targetId === widgetId && c.targetType === 'widget')
        )
    )
  }

  /**
   * Update connection style.
   */
  function updateConnectionStyle(
    connectionId: string,
    style: { strokeColor?: string; strokeWidth?: number }
  ): boolean {
    const connection = connectionMap.value.get(connectionId)
    if (!connection) return false

    connection.style = { ...connection.style, ...style }
    markDirty('Updated connection style')
    return true
  }

  /**
   * Update connection label.
   */
  function updateConnectionLabel(connectionId: string, label: string | undefined): boolean {
    const connection = connectionMap.value.get(connectionId)
    if (!connection) return false

    connection.label = label
    markDirty('Updated connection label')
    return true
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

  function updateModuleState<T extends object>(
    widgetId: string,
    partial: Partial<T>,
    options?: HistoryOptions
  ) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return

    // Handle history capture if requested (skip during restoration)
    if (options?.captureHistory && options?.historyLabel && !isRestoring.value) {
      const label = options.historyLabel

      if (options.debounceMs && options.debounceMs > 0) {
        // Debounced capture: cancel previous timer and set a new one
        const existingTimer = historyDebounceTimers.get(widgetId)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        historyDebounceTimers.set(
          widgetId,
          setTimeout(() => {
            captureHistorySnapshot(label)
            historyDebounceTimers.delete(widgetId)
          }, options.debounceMs)
        )
      } else {
        // Immediate capture
        captureHistorySnapshot(label)
      }
    }

    // Perform the mutation
    const current = moduleDef.deserialize(document.value.modules[widgetId]) as T
    const updated = { ...current, ...partial }
    document.value.modules[widgetId] = moduleDef.serialize(updated)
    markDirty(options?.historyLabel ?? `Updated ${moduleDef.displayName}`)
  }

  function setModuleState<T>(widgetId: string, state: T, options?: HistoryOptions) {
    if (!document.value) return

    const widget = widgetMap.value.get(widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return

    // Handle history capture if requested (skip during restoration)
    if (options?.captureHistory && options?.historyLabel && !isRestoring.value) {
      const label = options.historyLabel

      if (options.debounceMs && options.debounceMs > 0) {
        // Debounced capture: cancel previous timer and set a new one
        const existingTimer = historyDebounceTimers.get(widgetId)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        historyDebounceTimers.set(
          widgetId,
          setTimeout(() => {
            captureHistorySnapshot(label)
            historyDebounceTimers.delete(widgetId)
          }, options.debounceMs)
        )
      } else {
        // Immediate capture
        captureHistorySnapshot(label)
      }
    }

    document.value.modules[widgetId] = moduleDef.serialize(state)
    markDirty(options?.historyLabel ?? `Updated ${moduleDef.displayName}`)
  }

  // ============================================================================
  // Actions - Dirty State
  // ============================================================================

  /**
   * Capture the current document state BEFORE making a change.
   * This should be called at the start of any mutating action.
   * Skipped during document restoration (undo/redo/goToEntry) to prevent
   * module watchers from accidentally creating new history entries.
   */
  function captureHistorySnapshot(label: string): void {
    if (isRestoring.value) {
      return
    }
    if (document.value) {
      history.pushState(label, document.value)
    }
  }

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
  // Actions - Undo/Redo
  // ============================================================================

  /**
   * Undo the last action by restoring the previous document state.
   */
  function undo(): boolean {
    if (!document.value) return false

    // Clear any pending debounce timers before restoration
    clearHistoryDebounceTimers()

    // Pass current document to save as liveSnapshot on first undo
    const entry = history.undo(document.value)
    if (entry) {
      // Set restoring flag to prevent module watchers from creating history entries
      isRestoring.value = true
      document.value = deepClone(entry.snapshot)
      // Use nextTick equivalent: clear flag after Vue's reactivity system settles
      setTimeout(() => {
        isRestoring.value = false
      }, 0)
      isDirty.value = true
      lastAction.value = `Undid: ${entry.label}`
      return true
    }
    return false
  }

  /**
   * Redo a previously undone action.
   */
  function redo(): boolean {
    // Clear any pending debounce timers before restoration
    clearHistoryDebounceTimers()

    const entry = history.redo()
    if (entry) {
      // Set restoring flag to prevent module watchers from creating history entries
      isRestoring.value = true
      document.value = deepClone(entry.snapshot)
      setTimeout(() => {
        isRestoring.value = false
      }, 0)
      isDirty.value = true
      lastAction.value = entry.id === 'live' ? 'Returned to current state' : `Redid: ${entry.label}`
      return true
    }
    return false
  }

  /**
   * Jump to a specific history entry by ID.
   * Useful for clicking on entries in a history dropdown.
   */
  function goToHistoryEntry(entryId: string): boolean {
    if (!document.value) return false

    // Clear any pending debounce timers before restoration
    clearHistoryDebounceTimers()

    const entry = history.goToEntry(entryId, document.value)
    if (entry) {
      // Set restoring flag to prevent module watchers from creating history entries
      isRestoring.value = true
      document.value = deepClone(entry.snapshot)
      setTimeout(() => {
        isRestoring.value = false
      }, 0)
      isDirty.value = true
      lastAction.value = `Jumped to: ${entry.label}`
      return true
    }
    return false
  }

  /**
   * Return to the live (most recent) state.
   */
  function goToLiveState(): boolean {
    // Clear any pending debounce timers before restoration
    clearHistoryDebounceTimers()

    const entry = history.goToLive()
    if (entry) {
      // Set restoring flag to prevent module watchers from creating history entries
      isRestoring.value = true
      document.value = deepClone(entry.snapshot)
      setTimeout(() => {
        isRestoring.value = false
      }, 0)
      isDirty.value = true
      lastAction.value = 'Returned to current state'
      return true
    }
    return false
  }

  /** Whether undo is available */
  const canUndo = computed(() => history.canUndo.value)

  /** Whether redo is available */
  const canRedo = computed(() => history.canRedo.value)

  /** Label of the action that would be undone */
  const undoLabel = computed(() => history.undoLabel.value)

  /** Label of the action that would be redone */
  const redoLabel = computed(() => history.redoLabel.value)

  /** Full history stack for debugging/UI */
  const historyStack = computed(() => history.stack.value)

  /** Whether we're at the live state (not in undo mode) */
  const isAtLive = computed(() => history.isAtLive.value)

  /** Current history index (-1 = live, 0+ = historical) */
  const historyIndex = computed(() => history.currentIndex.value)

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
    // Clean up connections involving this widget
    cleanupConnectionsForWidget(widgetId)

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
    grid,
    moduleStates,
    title,
    orphanWidgets,
    hasOrphanWidgets,
    orphanModuleIds,

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
    removeOrphanWidgets,
    removeSelection,
    moveWidget,
    resizeWidget,
    duplicateWidget,
    nudgeWidget,
    updateWidgetVisibility,
    getWidgetVisibility,
    updateWidgetScale,
    getWidgetScale,

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

    // Getters - Canvas Settings
    canvasSettings,

    // Actions - Canvas Settings
    updateCanvasSettings,

    // Actions - Grid (Snap to Grid)
    toggleGrid,
    setGridEnabled,
    setGridSize,
    setGridVisible,
    snapToGrid,
    snapPointToGrid,
    snapRectToGrid,

    // Getters - Grouping
    groups,
    groupMap,
    elementToGroupMap,
    enteredGroupId,

    // Actions - Grouping
    getGroupForElement,
    getGroupMembers,
    getGroupBoundingBox,
    createGroup,
    ungroup,
    enterGroup,
    exitGroup,
    isInsideGroup,
    moveGroup,

    // Actions - Arrow Binding
    bindArrowToShape,
    unbindArrow,
    updateBoundArrowsForElement,
    isArrowBound,
    getArrowBinding,

    // Getters - Connections
    connections,
    connectionMap,

    // Actions - Connections
    addConnection,
    removeConnection,
    getConnectionsForElement,
    getConnectionsForWidget,
    getConnectionsForItem,
    updateConnectionStyle,
    updateConnectionLabel,

    // Actions - Module State
    getModuleState,
    updateModuleState,
    setModuleState,

    // Actions - Dirty State
    markDirty,
    markClean,
    captureHistorySnapshot,

    // Actions - Clipboard
    clipboard,
    copySelection,
    cutSelection,
    pasteFromClipboard,
    hasClipboardContent,

    // Actions - Undo/Redo
    undo,
    redo,
    goToHistoryEntry,
    goToLiveState,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    historyStack,
    historyIndex,
    isAtLive,

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
