import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { BoardkitDocument, Widget, Viewport } from '../types/document'
import { createEmptyDocument } from '../types/document'
import { moduleRegistry } from '../modules/ModuleRegistry'

export const useBoardStore = defineStore('board', () => {
  // State
  const document = ref<BoardkitDocument | null>(null)
  const selectedWidgetId = ref<string | null>(null)
  const isDirty = ref(false)

  // Getters
  const widgets = computed(() => document.value?.board.widgets ?? [])
  const viewport = computed(() => document.value?.board.viewport ?? { x: 0, y: 0, zoom: 1 })
  const moduleStates = computed(() => document.value?.modules ?? {})
  const title = computed(() => document.value?.meta.title ?? '')

  const selectedWidget = computed(() => {
    if (!selectedWidgetId.value) return null
    return widgets.value.find((w) => w.id === selectedWidgetId.value) ?? null
  })

  const maxZIndex = computed(() => {
    if (widgets.value.length === 0) return 0
    return Math.max(...widgets.value.map((w) => w.zIndex))
  })

  // Actions
  function createNewBoard(title: string) {
    document.value = createEmptyDocument(title)
    selectedWidgetId.value = null
    isDirty.value = false
  }

  function loadDocument(doc: BoardkitDocument) {
    document.value = doc
    selectedWidgetId.value = null
    isDirty.value = false
  }

  function setTitle(newTitle: string) {
    if (!document.value) return
    document.value.meta.title = newTitle
    markDirty()
  }

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
    selectedWidgetId.value = id
    markDirty()

    return id
  }

  function removeWidget(widgetId: string) {
    if (!document.value) return

    const index = document.value.board.widgets.findIndex((w) => w.id === widgetId)
    if (index === -1) return

    document.value.board.widgets.splice(index, 1)
    delete document.value.modules[widgetId]

    if (selectedWidgetId.value === widgetId) {
      selectedWidgetId.value = null
    }
    markDirty()
  }

  function moveWidget(widgetId: string, x: number, y: number) {
    if (!document.value) return

    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return

    widget.rect.x = x
    widget.rect.y = y
    markDirty()
  }

  function resizeWidget(widgetId: string, width: number, height: number) {
    if (!document.value) return

    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    const minWidth = moduleDef?.minWidth ?? 100
    const minHeight = moduleDef?.minHeight ?? 100

    widget.rect.width = Math.max(minWidth, width)
    widget.rect.height = Math.max(minHeight, height)
    markDirty()
  }

  function duplicateWidget(widgetId: string): string | null {
    if (!document.value) return null

    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return null

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
    }

    // Deep clone the module state
    const moduleState = document.value.modules[widgetId]
    document.value.modules[newId] = JSON.parse(JSON.stringify(moduleState))
    document.value.board.widgets.push(newWidget)
    selectedWidgetId.value = newId
    markDirty()

    return newId
  }

  function nudgeWidget(widgetId: string, dx: number, dy: number) {
    if (!document.value) return

    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return

    widget.rect.x += dx
    widget.rect.y += dy
    markDirty()
  }

  function selectWidget(widgetId: string | null) {
    selectedWidgetId.value = widgetId

    // Bring to front if selecting
    if (widgetId && document.value) {
      const widget = document.value.board.widgets.find((w) => w.id === widgetId)
      if (widget && widget.zIndex < maxZIndex.value) {
        widget.zIndex = maxZIndex.value + 1
      }
    }
  }

  function clearSelection() {
    selectedWidgetId.value = null
  }

  function updateViewport(newViewport: Partial<Viewport>) {
    if (!document.value) return
    Object.assign(document.value.board.viewport, newViewport)
  }

  function getModuleState<T = unknown>(widgetId: string): T | null {
    if (!document.value) return null
    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return null

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return null

    const serialized = document.value.modules[widgetId]
    if (serialized === undefined) return null

    return moduleDef.deserialize(serialized) as T
  }

  function updateModuleState<T>(widgetId: string, partial: Partial<T>) {
    if (!document.value) return

    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return

    const current = moduleDef.deserialize(document.value.modules[widgetId])
    const updated = { ...current, ...partial }
    document.value.modules[widgetId] = moduleDef.serialize(updated)
    markDirty()
  }

  function setModuleState<T>(widgetId: string, state: T) {
    if (!document.value) return

    const widget = document.value.board.widgets.find((w) => w.id === widgetId)
    if (!widget) return

    const moduleDef = moduleRegistry.get(widget.moduleId)
    if (!moduleDef) return

    document.value.modules[widgetId] = moduleDef.serialize(state)
    markDirty()
  }

  function markDirty() {
    isDirty.value = true
    if (document.value) {
      document.value.meta.updatedAt = Date.now()
    }
  }

  function markClean() {
    isDirty.value = false
  }

  function getDocument(): BoardkitDocument | null {
    return document.value
  }

  return {
    // State
    document,
    selectedWidgetId,
    isDirty,

    // Getters
    widgets,
    viewport,
    moduleStates,
    title,
    selectedWidget,
    maxZIndex,

    // Actions
    createNewBoard,
    loadDocument,
    setTitle,
    addWidget,
    removeWidget,
    moveWidget,
    resizeWidget,
    duplicateWidget,
    nudgeWidget,
    selectWidget,
    clearSelection,
    updateViewport,
    getModuleState,
    updateModuleState,
    setModuleState,
    markDirty,
    markClean,
    getDocument,
  }
})
