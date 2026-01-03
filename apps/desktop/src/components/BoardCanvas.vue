<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import {
  useBoardStore,
  useToolStore,
  moduleRegistry,
  pluginManager,
  useKeyboardShortcuts,
  actionRegistry,
  FONT_FAMILY_CSS,
  DEFAULT_WIDGET_VISIBILITY,
  findNearestShapeAndAnchor,
  type ActionContext,
  type ActionContextType,
  type CanvasElement,
  type TextElement,
  type LineElement,
  type Widget,
  type ModuleContextMenuEvent,
  type AnchorPosition,
  isDrawingTool,
  isTextElement,
  isShapeElement,
} from '@boardkit/core'
import {
  WidgetFrame,
  BkContextMenu,
  BkDataSourcePicker,
  BkToolButton,
  AnchorPointsOverlay,
  useTheme,
  type ContextMenuItem,
  type ContextMenuItemOrSeparator,
  type MenuItem,
  type MenuContent,
  type MenuGroup,
} from '@boardkit/ui'
import WidgetRenderer from './WidgetRenderer.vue'
import CanvasElementsLayer from './CanvasElementsLayer.vue'
import ConnectionsLayer from './ConnectionsLayer.vue'
import ToolToolbar from './ToolToolbar.vue'
import { useDataSharingUI } from '../composables/useDataSharingUI'
import { useSettingsPanel } from '../composables/useSettingsPanel'

const emit = defineEmits<{
  openCommandPalette: []
}>()

const boardStore = useBoardStore()
const toolStore = useToolStore()
const dataSharingUI = useDataSharingUI()
const { openAppSettings } = useSettingsPanel()
const { theme } = useTheme()

// Grid color based on theme (white for dark, black for light)
const gridColor = computed(() => {
  // Get the effective theme (considering 'system' option)
  const effectiveTheme = theme.value === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme.value
  return effectiveTheme === 'light' ? '0, 0, 0' : '255, 255, 255'
})

// Helper to get widget visibility with defaults
const getWidgetVisibility = (widget: Widget) => ({
  restMode: widget.visibility?.restMode ?? DEFAULT_WIDGET_VISIBILITY.restMode,
  hoverMode: widget.visibility?.hoverMode ?? DEFAULT_WIDGET_VISIBILITY.hoverMode,
})

const canvasRef = ref<HTMLElement | null>(null)
const canvasContentRef = ref<HTMLElement | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const viewportStart = ref({ x: 0, y: 0 })

// CSS Transform-based drag state (for performance optimization)
// During drag, we use CSS transform instead of mutating element data
// Using shallowRef to avoid unnecessary reactivity overhead on frequent updates
const moveStart = shallowRef({ x: 0, y: 0 })
const dragOffset = shallowRef({ x: 0, y: 0 })
const isDraggingWithTransform = ref(false)
const draggingElementIds = ref<string[]>([])
const draggingWidgetIds = ref<string[]>([])

// Element resize state
const isResizingElement = ref(false)
const resizingElementId = ref<string | null>(null)
const resizeHandle = ref<string | null>(null)
const resizeStart = shallowRef({ x: 0, y: 0 })
const elementStartRect = shallowRef({ x: 0, y: 0, width: 0, height: 0 })

// Group resize state (for multi-selection proportional resize)
const isResizingGroup = ref(false)
const groupResizeHandle = ref<string | null>(null)
const groupResizeStart = shallowRef({ x: 0, y: 0 })
const groupStartBounds = shallowRef({ x: 0, y: 0, width: 0, height: 0 })
const groupStartElements = shallowRef<Array<{ id: string; rect: { x: number; y: number; width: number; height: number } }>>([])
const groupStartWidgets = shallowRef<Array<{ id: string; rect: { x: number; y: number; width: number; height: number } }>>([])

// Group rotation state (for multi-selection rotation)
const isRotatingGroup = ref(false)
const groupRotationBounds = shallowRef({ x: 0, y: 0, width: 0, height: 0 })
const groupRotationMouseStartAngle = ref(0)
// Current rotation angle delta (for CSS transform - performance optimization)
const groupRotationAngle = ref(0)
// Store initial state including points for lines/arrows
interface GroupRotationElement {
  id: string
  type: string
  rect: { x: number; y: number; width: number; height: number }
  angle: number
  points?: { start: { x: number; y: number }; end: { x: number; y: number } }
}
const groupRotationStartElements = shallowRef<GroupRotationElement[]>([])

// Element rotation state
const isRotatingElement = ref(false)
const rotatingElementId = ref<string | null>(null)
const rotationStartAngle = ref(0) // Initial element angle
const rotationMouseStartAngle = ref(0) // Initial mouse angle relative to element center

// Marquee selection state
const isMarqueeSelecting = ref(false)
const marqueeStart = ref({ x: 0, y: 0 })
const marqueeEnd = ref({ x: 0, y: 0 })
const justFinishedMarquee = ref(false) // Flag to prevent click from clearing selection

// Text editing state
const isEditingText = ref(false)
const editingElementId = ref<string | null>(null)
const editingType = ref<'text' | 'label'>('text')

// Arrow binding state (for line/arrow drawing)
// Tracks which shapes are candidates for binding (near endpoint)
const bindingCandidates = ref<string[]>([])
// Active binding target (when snapping to an anchor)
const activeBinding = ref<{
  elementId: string
  anchor: AnchorPosition
  point: { x: number; y: number }
} | null>(null)

// Connection mode state (for intentional connections via context menu)
const isConnecting = ref(false)
const connectionSource = ref<{
  id: string
  type: 'element' | 'widget'
} | null>(null)
const connectionPreviewEnd = ref<{ x: number; y: number } | null>(null)
const selectedConnectionId = ref<string | null>(null)
// Track hover target during connection mode (for reliable click detection)
const connectionHoverTarget = ref<{
  id: string
  type: 'element' | 'widget'
} | null>(null)

const editValue = ref('')
const textEditorRef = ref<HTMLTextAreaElement | null>(null)

// Context menu state
const contextMenu = ref({
  open: false,
  x: 0,
  y: 0,
  type: 'canvas' as ActionContextType | 'element' | 'connection',
  canvasPosition: { x: 0, y: 0 },
})

// Module-specific context menu data (combined with widget actions)
const moduleContextMenuData = ref<{
  groups: ModuleContextMenuEvent['groups']
  onSelect: ModuleContextMenuEvent['onSelect']
} | null>(null)

const widgets = computed(() => boardStore.widgets)
const elements = computed(() => boardStore.elements)
const viewport = computed(() => boardStore.viewport)
const background = computed(() => boardStore.background)
const grid = computed(() => boardStore.grid)
const canvasSettings = computed(() => boardStore.canvasSettings)

// Canvas size for grid overlay (updated via ResizeObserver)
const canvasWidth = ref(window.innerWidth)
const canvasHeight = ref(window.innerHeight)
const selectedWidgetId = computed(() => boardStore.selectedWidgetId)
const selectedElementId = computed(() => boardStore.selectedElementId)
const selectedElementIds = computed(() => boardStore.selectedElementIds)
const selectedWidgetIds = computed(() => boardStore.selectedWidgetIds)
const isMultiSelection = computed(() => boardStore.isMultiSelection)
const activeTool = computed(() => toolStore.activeTool)
const isDrawing = computed(() => toolStore.isDrawing)

// Marquee rect in canvas coordinates
const marqueeRect = computed(() => {
  if (!isMarqueeSelecting.value) return null

  const x = Math.min(marqueeStart.value.x, marqueeEnd.value.x)
  const y = Math.min(marqueeStart.value.y, marqueeEnd.value.y)
  const width = Math.abs(marqueeEnd.value.x - marqueeStart.value.x)
  const height = Math.abs(marqueeEnd.value.y - marqueeStart.value.y)

  return { x, y, width, height }
})

// Marquee style for rendering (in screen coordinates)
const marqueeStyle = computed(() => {
  if (!marqueeRect.value) return {}

  const zoom = viewport.value.zoom
  const left = viewport.value.x + marqueeRect.value.x * zoom
  const top = viewport.value.y + marqueeRect.value.y * zoom
  const width = marqueeRect.value.width * zoom
  const height = marqueeRect.value.height * zoom

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px dashed hsl(var(--primary))',
    backgroundColor: 'hsla(var(--primary), 0.1)',
    pointerEvents: 'none' as const,
    zIndex: 1000,
  }
})

const transformStyle = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.zoom})`,
  transformOrigin: '0 0',
}))

// Group rotation transform object for CSS-based rotation (performance optimization)
const groupRotation = computed(() => {
  if (!isRotatingGroup.value) return undefined
  return {
    angle: groupRotationAngle.value,
    centerX: groupRotationBounds.value.x + groupRotationBounds.value.width / 2,
    centerY: groupRotationBounds.value.y + groupRotationBounds.value.height / 2,
  }
})

// Background pattern style
const backgroundStyle = computed(() => {
  const bg = background.value
  const zoom = viewport.value.zoom

  // Grid size from canvas settings (default: 20px)
  // Visual size scales with zoom: gridSpacing canvas = gridSpacing*zoom screen pixels
  // This ensures perfect alignment between visual grid and snap-to-grid
  const gridSpacing = canvasSettings.value.gridSpacing
  const baseSize = gridSpacing * zoom

  // Reduce opacity when zoomed out to improve visibility
  // Full opacity at zoom >= 60%, fades progressively below
  // At 50%: ~70% opacity, at 40%: ~50%, at 30%: ~30%, at 20%: ~10% (minimum)
  const zoomOpacity = Math.min(1, Math.max(0.1, (zoom - 0.15) / 0.5))

  let backgroundImage = 'none'
  if (bg.pattern === 'dots') {
    const opacity = 0.1 * zoomOpacity
    backgroundImage = `radial-gradient(circle, rgba(${gridColor.value}, ${opacity}) 1px, transparent 1px)`
  } else if (bg.pattern === 'grid') {
    const opacity = 0.05 * zoomOpacity
    backgroundImage = `
      linear-gradient(rgba(${gridColor.value}, ${opacity}) 1px, transparent 1px),
      linear-gradient(90deg, rgba(${gridColor.value}, ${opacity}) 1px, transparent 1px)
    `
  }

  // Use theme background when color is 'auto' or matches old default dark color
  const isAutoColor = bg.color === 'auto' || bg.color === '#0a0a0a'
  const bgColor = isAutoColor ? 'hsl(var(--background))' : bg.color

  return {
    backgroundColor: bgColor,
    backgroundImage,
    backgroundPosition: `${viewport.value.x}px ${viewport.value.y}px`,
    backgroundSize: `${baseSize}px ${baseSize}px`,
  }
})

// Editing element data
const editingElement = computed(() => {
  if (!editingElementId.value) return null
  return elements.value.find((e) => e.id === editingElementId.value) ?? null
})

// Text editor overlay style
const textEditorStyle = computed(() => {
  if (!editingElement.value) return {}

  const el = editingElement.value
  const zoom = viewport.value.zoom

  // Calculate screen position
  const left = viewport.value.x + el.rect.x * zoom
  const top = viewport.value.y + el.rect.y * zoom
  const width = el.rect.width * zoom
  const height = el.rect.height * zoom

  // Get text element specific styles
  const isText = el.type === 'text'
  const textEl = isText ? (el as TextElement) : null
  const fontFamily = textEl?.fontFamily ?? 'system'
  const fontSize = textEl?.fontSize ?? 14
  const textAlign = textEl?.textAlign ?? (isText ? 'left' : 'center')
  const color = el.style.strokeColor

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    minHeight: `${height}px`,
    fontFamily: FONT_FAMILY_CSS[fontFamily],
    fontSize: `${fontSize * zoom}px`,
    textAlign,
    color,
    lineHeight: '1.4',
    padding: editingType.value === 'text' ? '4px' : '8px',
    display: editingType.value === 'label' ? 'flex' : 'block',
    alignItems: editingType.value === 'label' ? 'center' : undefined,
    justifyContent: editingType.value === 'label' ? 'center' : undefined,
  }
})

// Build action context
const buildActionContext = (
  pointerPositionOrShiftKey?: { x: number; y: number } | boolean,
  shiftKey?: boolean
): ActionContext => {
  // Handle both signatures:
  // buildActionContext(shiftKey?: boolean) - for keyboard shortcuts
  // buildActionContext(pointerPosition?: {x, y}) - for context menus
  const isShiftKey = typeof pointerPositionOrShiftKey === 'boolean'
  const pointerPosition = isShiftKey ? undefined : pointerPositionOrShiftKey
  const shift = isShiftKey ? pointerPositionOrShiftKey : shiftKey

  return {
    selectedWidget: boardStore.selectedWidget,
    selectedWidgetId: boardStore.selectedWidgetId,
    selectedWidgetIds: boardStore.selectedWidgetIds,
    selectedElement: boardStore.selectedElement,
    selectedElementId: boardStore.selectedElementId,
    selectedElementIds: boardStore.selectedElementIds,
    isMultiSelection: boardStore.isMultiSelection,
    selectionCount: boardStore.selectedWidgetIds.length + boardStore.selectedElementIds.length,
    activeTool: toolStore.activeTool,
    viewport: boardStore.viewport,
    widgets: boardStore.widgets,
    elements: boardStore.elements,
    platform: 'desktop',
    isDirty: boardStore.isDirty,
    pointerPosition,
    shiftKey: shift,
  }
}

// Convert screen coordinates to canvas coordinates
const screenToCanvas = (screenX: number, screenY: number) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }

  const relativeX = screenX - rect.left
  const relativeY = screenY - rect.top

  const canvasX = (relativeX - viewport.value.x) / viewport.value.zoom
  const canvasY = (relativeY - viewport.value.y) / viewport.value.zoom

  return { x: canvasX, y: canvasY }
}

// Check if the selected widget has a missing module (Not Found state)
const isWidgetModuleMissing = computed(() => {
  if (contextMenu.value.type !== 'widget') return false
  const widget = boardStore.selectedWidget
  if (!widget) return false
  return !moduleRegistry.has(widget.moduleId)
})

// Build context menu items from actions with submenus
const contextMenuGroups = computed<MenuContent>(() => {
  const ctx = buildActionContext(contextMenu.value.canvasPosition)
  // Elements use 'widget' context to get generic actions (duplicate, delete)
  // that work for both elements and widgets
  const contextType = contextMenu.value.type === 'element' ? 'widget' : contextMenu.value.type

  // Special case: widget with missing module (Not Found state)
  // Only show "Install plugin" and "Delete" options
  if (isWidgetModuleMissing.value) {
    return [
      {
        items: [
          {
            id: 'orphan.install-plugin',
            label: 'Install Plugin',
            icon: 'puzzle',
          },
        ],
      },
      {
        items: [
          {
            id: 'widget.delete',
            label: 'Delete',
            icon: 'trash-2',
            destructive: true,
          },
        ],
      },
    ]
  }

  const actions = actionRegistry.getAvailable(ctx, { context: contextType as ActionContextType })

  // Group actions by their group property
  const groupedActions: Record<string, typeof actions> = {}
  for (const action of actions) {
    if (!groupedActions[action.group]) {
      groupedActions[action.group] = []
    }
    groupedActions[action.group].push(action)
  }

  const groups: MenuContent = []

  // Add module-specific groups at the top if present
  if (moduleContextMenuData.value) {
    for (const moduleGroup of moduleContextMenuData.value.groups) {
      groups.push({
        label: moduleGroup.label,
        items: moduleGroup.items.map(item => ({
          id: `module:${item.id}`,
          label: item.label,
          icon: item.icon,
          disabled: item.disabled,
          destructive: item.destructive,
        })),
      })
    }
  }

  // For canvas context: create "Add Widget" submenu with core/plugins separation
  if (contextType === 'canvas' && groupedActions['module']) {
    const addWidgetActions = groupedActions['module'].filter(a => a.id.startsWith('board.add-'))

    // Separate core modules from plugins
    const coreItems: MenuItem[] = []
    const pluginItems: MenuItem[] = []

    for (const action of addWidgetActions) {
      const moduleId = action.id.replace('board.add-', '')
      const menuItem: MenuItem = {
        id: action.id,
        label: action.title.replace('Add ', ''),
        icon: moduleRegistry.get(moduleId)?.icon || 'plus',
        disabled: action.when ? !action.when(ctx) : false,
      }

      // Check if this module comes from an installed plugin
      if (pluginManager.isInstalled(moduleId)) {
        pluginItems.push(menuItem)
      } else {
        coreItems.push(menuItem)
      }
    }

    // Build submenu children with groups (separators between core and plugins)
    const submenuGroups: MenuGroup[] = []
    if (coreItems.length > 0) {
      submenuGroups.push({ items: coreItems })
    }
    if (pluginItems.length > 0) {
      submenuGroups.push({ label: 'Plugins', items: pluginItems })
    }

    if (submenuGroups.length > 0) {
      groups.push({
        items: [{
          id: 'submenu-modules',
          label: 'Add Module',
          icon: 'plus',
          children: submenuGroups,
        }],
      })
    }
  }

  // Add element actions (shapes, text) as a separate group
  if (groupedActions['element']) {
    const elementItems: MenuItem[] = groupedActions['element'].map(action => ({
      id: action.id,
      label: action.title,
      icon: action.icon,
      shortcut: action.shortcutHint,
      disabled: action.when ? !action.when(ctx) : false,
    }))

    if (elementItems.length > 0) {
      groups.push({
        label: contextType === 'canvas' ? 'Draw' : undefined,
        items: elementItems,
      })
    }
  }

  // Element-specific actions (when right-clicking on a shape/element)
  // We get element actions separately since they have contexts: ['canvas']
  if (contextMenu.value.type === 'element' && ctx.selectedElementId) {
    const elementActions = actionRegistry.getAvailable(ctx, { context: 'canvas', group: 'element' })

    // Edit actions (duplicate, bring to front, send to back)
    const editActions = elementActions.filter(a =>
      ['element.duplicate', 'element.bring-to-front', 'element.send-to-back'].includes(a.id)
    )
    if (editActions.length > 0) {
      groups.push({
        items: editActions.map(action => ({
          id: action.id,
          label: action.title,
          icon: action.icon,
          shortcut: action.shortcutHint,
          disabled: action.when ? !action.when(ctx) : false,
        })),
      })
    }

    // Connect action for shapes (rectangle, ellipse)
    const element = boardStore.elements.find(e => e.id === ctx.selectedElementId)
    if (element && (element.type === 'rectangle' || element.type === 'ellipse')) {
      groups.push({
        items: [{
          id: 'connection.start-element',
          label: 'Connect from here',
          icon: 'link',
        }],
      })
    }

    // Delete action (always last, destructive)
    const deleteAction = elementActions.find(a => a.id === 'element.delete')
    if (deleteAction) {
      groups.push({
        items: [{
          id: deleteAction.id,
          label: deleteAction.title,
          icon: deleteAction.icon,
          shortcut: deleteAction.shortcutHint,
          disabled: deleteAction.when ? !deleteAction.when(ctx) : false,
          destructive: true,
        }],
      })
    }
  }

  // Connection-specific actions (when right-clicking on a connection arrow)
  if (contextMenu.value.type === 'connection' && selectedConnectionId.value) {
    groups.push({
      items: [{
        id: 'connection.delete',
        label: 'Delete Connection',
        icon: 'trash-2',
        destructive: true,
      }],
    })
    return groups // Only show delete for connections
  }

  // Add tool actions as a group
  if (groupedActions['tool']) {
    const toolItems: MenuItem[] = groupedActions['tool'].map(action => ({
      id: action.id,
      label: action.title,
      icon: action.icon,
      shortcut: action.shortcutHint,
      disabled: action.when ? !action.when(ctx) : false,
    }))

    if (toolItems.length > 0) {
      groups.push({
        label: 'Tools',
        items: toolItems,
      })
    }
  }

  // Widget-specific actions - organized into logical groups
  // Only show for actual widgets (not elements that use 'widget' contextType)
  if (groupedActions['widget'] && contextMenu.value.type === 'widget') {
    const allWidgetActions = groupedActions['widget']

    // Helper to create menu item from action
    const toMenuItem = (action: typeof allWidgetActions[0]): MenuItem => ({
      id: action.id,
      label: action.title,
      icon: action.icon,
      shortcut: action.shortcutHint,
      disabled: action.when ? !action.when(ctx) : false,
      destructive: action.id.includes('delete'),
    })

    // Categorize actions
    const editActions = allWidgetActions.filter(a =>
      ['widget.duplicate', 'widget.bring-to-front'].includes(a.id)
    )
    const dataActions = allWidgetActions.filter(a =>
      a.id.includes('data') || a.id.includes('connect')
    )
    const settingsActions = allWidgetActions.filter(a =>
      a.id.includes('settings')
    )
    const deleteActions = allWidgetActions.filter(a =>
      a.id.includes('delete')
    )

    // Edit actions group
    if (editActions.length > 0) {
      groups.push({
        label: 'Edit',
        items: editActions.map(toMenuItem),
      })
    }

    // Connection action (for widgets only)
    groups.push({
      items: [{
        id: 'connection.start-widget',
        label: 'Connect from here',
        icon: 'link',
      }],
    })

    // Data actions group
    if (dataActions.length > 0) {
      groups.push({
        label: 'Data',
        items: dataActions.map(toMenuItem),
      })
    }

    // Settings group
    if (settingsActions.length > 0) {
      groups.push({
        items: settingsActions.map(toMenuItem),
      })
    }

    // Delete action (always last, destructive)
    if (deleteActions.length > 0) {
      groups.push({
        items: deleteActions.map(toMenuItem),
      })
    }
  }

  // View actions
  if (groupedActions['view']) {
    const viewItems: MenuItem[] = groupedActions['view'].map(action => ({
      id: action.id,
      label: action.title,
      icon: action.icon,
      shortcut: action.shortcutHint,
      disabled: action.when ? !action.when(ctx) : false,
    }))

    if (viewItems.length > 0) {
      groups.push({ items: viewItems })
    }
  }

  return groups
})

// Handle context menu item selection
const handleContextMenuSelect = async (item: MenuItem) => {
  // Check if this is a module-specific action
  if (item.id.startsWith('module:') && moduleContextMenuData.value) {
    const moduleItemId = item.id.replace('module:', '')
    await moduleContextMenuData.value.onSelect(moduleItemId)
    return
  }

  // Handle orphan widget actions (Not Found state)
  if (item.id === 'orphan.install-plugin') {
    openAppSettings('plugins')
    return
  }

  // Handle connection actions
  if (item.id === 'connection.start-widget') {
    const widgetId = boardStore.selectedWidgetId
    if (widgetId) {
      startConnection(widgetId, 'widget')
    }
    return
  }

  if (item.id === 'connection.start-element') {
    const elementId = boardStore.selectedElementId
    if (elementId) {
      startConnection(elementId, 'element')
    }
    return
  }

  if (item.id === 'connection.delete') {
    if (selectedConnectionId.value) {
      boardStore.removeConnection(selectedConnectionId.value)
      selectedConnectionId.value = null
    }
    return
  }

  // Otherwise, execute action from ActionRegistry
  const ctx = buildActionContext(contextMenu.value.canvasPosition)
  await actionRegistry.execute(item.id, ctx)
}

// Handle right-click on canvas
const handleCanvasContextMenu = (e: MouseEvent) => {
  e.preventDefault()

  const target = e.target as HTMLElement
  if (
    target === canvasRef.value ||
    target.classList.contains('canvas-background') ||
    target.classList.contains('canvas-transform')
  ) {
    boardStore.clearSelection()
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    contextMenu.value = {
      open: true,
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
      canvasPosition: canvasPos,
    }
  }
}

// Handle right-click on widget
const handleWidgetContextMenu = (widgetId: string, e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  boardStore.selectWidget(widgetId)
  contextMenu.value = {
    open: true,
    x: e.clientX,
    y: e.clientY,
    type: 'widget',
    canvasPosition: { x: 0, y: 0 },
  }
}

const closeContextMenu = () => {
  contextMenu.value.open = false
  moduleContextMenuData.value = null
}

// Handle module context menu event from WidgetRenderer
const handleModuleContextMenu = (widgetId: string, event: ModuleContextMenuEvent) => {
  // Select the widget if not already selected
  if (!boardStore.isSelected('widget', widgetId)) {
    boardStore.selectWidget(widgetId)
  }

  // Store module-specific menu data
  moduleContextMenuData.value = {
    groups: event.groups,
    onSelect: event.onSelect,
  }

  // Open context menu as widget type (to get widget actions)
  contextMenu.value = {
    open: true,
    x: event.x,
    y: event.y,
    type: 'widget',
    canvasPosition: { x: 0, y: 0 },
  }
}

// Keyboard shortcuts - routed through ActionRegistry
const { isSpacePressed } = useKeyboardShortcuts({
  actionRegistry,
  buildActionContext,
  onContextMenuClose: () => {
    if (contextMenu.value.open) {
      closeContextMenu()
      return true
    }
    // Cancel connection mode on Escape
    if (isConnecting.value) {
      cancelConnection()
      return true
    }
    return false
  },
  onDrawingCancel: () => {
    if (isDrawing.value) {
      toolStore.cancelDrawing()
      return true
    }
    // Cancel connection mode
    if (isConnecting.value) {
      cancelConnection()
      return true
    }
    return false
  },
  onCommandPalette: () => {
    emit('openCommandPalette')
  },
  onWidgetScaleChange: (delta: number) => {
    const selectedId = selectedWidgetIds.value[0]
    if (selectedId) {
      const currentScale = boardStore.getWidgetScale(selectedId)
      boardStore.updateWidgetScale(selectedId, currentScale + delta)
    }
  },
})

// Cursor style based on tool and state
const canvasCursor = computed(() => {
  if (isPanning.value) return 'cursor-grabbing'
  if (isSpacePressed.value || activeTool.value === 'hand') return 'cursor-grab'
  if (isConnecting.value) return 'cursor-crosshair'
  if (isDrawingTool(activeTool.value)) return 'cursor-crosshair'
  return ''
})

// Navigation mode: when active, widgets should not receive pointer events
// This allows canvas to handle all mouse interactions for panning
const isNavigationMode = computed(() => {
  return isPanning.value || isSpacePressed.value || activeTool.value === 'hand'
})

// Handle canvas click
const handleCanvasClick = (e: MouseEvent) => {
  // Connection mode clicks are handled by capturing listener
  if (isConnecting.value) {
    return
  }

  // Skip clearing selection if we just finished a marquee selection
  // (click event fires after mouseup, which would clear the selection we just made)
  if (justFinishedMarquee.value) {
    justFinishedMarquee.value = false
    return
  }

  const target = e.target as HTMLElement
  if (
    target === canvasRef.value ||
    target.classList.contains('canvas-background') ||
    target.classList.contains('canvas-transform')
  ) {
    // Clear connection selection
    selectedConnectionId.value = null

    // Exit group edit mode if we're inside one
    if (boardStore.isInsideGroup()) {
      boardStore.exitGroup()
    } else {
      boardStore.clearSelection()
    }
  }
}

// Handle canvas mousedown - start drawing, panning, or marquee selection
const handleCanvasMouseDown = (e: MouseEvent) => {
  // Middle mouse button OR Space + left click = pan
  if (e.button === 1 || (e.button === 0 && (isSpacePressed.value || activeTool.value === 'hand'))) {
    e.preventDefault()
    closeContextMenu()
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    viewportStart.value = { x: viewport.value.x, y: viewport.value.y }
    return
  }

  // Left click with drawing tool = start drawing
  if (e.button === 0 && isDrawingTool(activeTool.value)) {
    const target = e.target as HTMLElement
    // Only start drawing on empty canvas areas
    if (
      target === canvasRef.value ||
      target.classList.contains('canvas-background') ||
      target.classList.contains('canvas-transform') ||
      target.closest('.elements-layer')
    ) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY)
      toolStore.startDrawing(canvasPos)
    }
    return
  }

  // Left click with select tool on empty canvas = start marquee selection
  if (e.button === 0 && activeTool.value === 'select') {
    const target = e.target as HTMLElement
    const isValidTarget =
      target === canvasRef.value ||
      target.classList.contains('canvas-background') ||
      target.classList.contains('canvas-transform') ||
      target.classList.contains('elements-layer')

    if (isValidTarget) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY)

      // Clear selection unless shift is held (to add to selection)
      if (!e.shiftKey) {
        boardStore.clearSelection()
      }

      isMarqueeSelecting.value = true
      marqueeStart.value = canvasPos
      marqueeEnd.value = canvasPos
    }
  }
}

// Handle canvas mousemove - update drawing, panning, or marquee selection
const handleCanvasMouseMove = (e: MouseEvent) => {
  // Update connection preview endpoint and track hover target
  if (isConnecting.value) {
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    connectionPreviewEnd.value = canvasPos

    // Find element/widget under cursor by checking bounds
    // Check widgets first (they're on top)
    let foundTarget: { id: string; type: 'element' | 'widget' } | null = null

    // Hit padding matches ElementRenderer's HIT_PADDING (6px) + stroke width allowance
    // This ensures clicking on borders/strokes also detects the element
    const hitPadding = 10 / viewport.value.zoom

    for (const widget of boardStore.widgets) {
      // Skip the source widget
      if (connectionSource.value?.type === 'widget' && connectionSource.value.id === widget.id) continue
      const { x, y, width, height } = widget.rect
      if (canvasPos.x >= x - hitPadding && canvasPos.x <= x + width + hitPadding &&
          canvasPos.y >= y - hitPadding && canvasPos.y <= y + height + hitPadding) {
        foundTarget = { id: widget.id, type: 'widget' }
        break
      }
    }

    // If no widget found, check elements (shapes)
    if (!foundTarget) {
      for (const element of boardStore.elements) {
        // Skip the source element and non-shape elements
        if (connectionSource.value?.type === 'element' && connectionSource.value.id === element.id) continue
        if (element.type !== 'rectangle' && element.type !== 'ellipse') continue

        const { x, y, width, height } = element.rect
        if (canvasPos.x >= x - hitPadding && canvasPos.x <= x + width + hitPadding &&
            canvasPos.y >= y - hitPadding && canvasPos.y <= y + height + hitPadding) {
          foundTarget = { id: element.id, type: 'element' }
          break
        }
      }
    }

    connectionHoverTarget.value = foundTarget
  }

  if (isPanning.value) {
    const dx = e.clientX - panStart.value.x
    const dy = e.clientY - panStart.value.y
    boardStore.updateViewport({
      x: viewportStart.value.x + dx,
      y: viewportStart.value.y + dy,
    })
    return
  }

  if (isMarqueeSelecting.value) {
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    marqueeEnd.value = canvasPos
    return
  }

  if (isDrawing.value) {
    const canvasPos = screenToCanvas(e.clientX, e.clientY)

    // For line/arrow tools, detect potential binding targets
    if (activeTool.value === 'line' || activeTool.value === 'arrow') {
      // Find shapes near the current endpoint (end of line being drawn)
      const nearbyResult = findNearestShapeAndAnchor(
        canvasPos,
        elements.value,
        [], // No exclusions during creation
        30 / viewport.value.zoom // Threshold in canvas units (30px screen)
      )

      if (nearbyResult) {
        // Found a shape nearby - update binding state
        activeBinding.value = {
          elementId: nearbyResult.elementId,
          anchor: nearbyResult.anchor,
          point: nearbyResult.point,
        }
        // Track this shape as a binding candidate
        if (!bindingCandidates.value.includes(nearbyResult.elementId)) {
          bindingCandidates.value = [nearbyResult.elementId]
        }
        // Snap the endpoint to the anchor point
        toolStore.updateDrawing(nearbyResult.point, e.shiftKey)
      } else {
        // No shape nearby - clear binding state
        activeBinding.value = null
        bindingCandidates.value = []
        toolStore.updateDrawing(canvasPos, e.shiftKey)
      }
    } else {
      // Other tools - just update drawing
      toolStore.updateDrawing(canvasPos, e.shiftKey)
    }
    return
  }

  if (isResizingElement.value && resizingElementId.value && resizeHandle.value) {
    const dx = (e.clientX - resizeStart.value.x) / viewport.value.zoom
    const dy = (e.clientY - resizeStart.value.y) / viewport.value.zoom

    let newRect = calculateResizedRect(
      elementStartRect.value,
      resizeHandle.value,
      dx,
      dy,
      e.shiftKey
    )

    // Apply grid snapping to resize
    if (grid.value.enabled) {
      newRect = boardStore.snapRectToGrid(newRect)
    }

    // Skip dirty marking during live drag for performance
    boardStore.resizeElement(resizingElementId.value, newRect, true)
    return
  }

  if (isRotatingElement.value && rotatingElementId.value) {
    const element = elements.value.find((el) => el.id === rotatingElementId.value)
    if (!element) return

    // Calculate current mouse angle relative to element center
    const currentMouseAngle = calculateAngleFromCenter(
      e.clientX,
      e.clientY,
      element.rect
    )

    // Calculate angle delta from start position
    let angleDelta = currentMouseAngle - rotationMouseStartAngle.value

    // New angle = start angle + delta
    let newAngle = rotationStartAngle.value + angleDelta

    // Snap to 15deg increments when Shift is held
    if (e.shiftKey) {
      const snapAngle = Math.PI / 12 // 15 degrees in radians
      newAngle = Math.round(newAngle / snapAngle) * snapAngle
    }

    // Normalize angle to [-pi, pi] range
    while (newAngle > Math.PI) newAngle -= 2 * Math.PI
    while (newAngle < -Math.PI) newAngle += 2 * Math.PI

    // Update element angle (skip dirty marking during drag)
    boardStore.updateElement(rotatingElementId.value, { angle: newAngle })
    return
  }

  // Group proportional resize
  if (isResizingGroup.value && groupResizeHandle.value) {
    const dx = (e.clientX - groupResizeStart.value.x) / viewport.value.zoom
    const dy = (e.clientY - groupResizeStart.value.y) / viewport.value.zoom

    // Calculate new bounds based on handle
    const newBounds = calculateResizedRect(
      groupStartBounds.value,
      groupResizeHandle.value,
      dx,
      dy,
      e.shiftKey // maintain aspect ratio
    )

    // Apply proportional resize to all elements
    for (const { id, rect: startRect } of groupStartElements.value) {
      // Calculate relative position within the original bounds
      const relX = (startRect.x - groupStartBounds.value.x) / groupStartBounds.value.width
      const relY = (startRect.y - groupStartBounds.value.y) / groupStartBounds.value.height
      const relWidth = startRect.width / groupStartBounds.value.width
      const relHeight = startRect.height / groupStartBounds.value.height

      // Apply scale to get new rect
      const newRect = {
        x: newBounds.x + relX * newBounds.width,
        y: newBounds.y + relY * newBounds.height,
        width: Math.max(10, relWidth * newBounds.width),
        height: Math.max(10, relHeight * newBounds.height),
      }

      // Apply grid snapping
      const snappedRect = grid.value.enabled ? boardStore.snapRectToGrid(newRect) : newRect
      boardStore.resizeElement(id, snappedRect, true) // skipDirty during drag
    }

    // Apply proportional resize to all widgets
    for (const { id, rect: startRect } of groupStartWidgets.value) {
      const relX = (startRect.x - groupStartBounds.value.x) / groupStartBounds.value.width
      const relY = (startRect.y - groupStartBounds.value.y) / groupStartBounds.value.height
      const relWidth = startRect.width / groupStartBounds.value.width
      const relHeight = startRect.height / groupStartBounds.value.height

      const newX = newBounds.x + relX * newBounds.width
      const newY = newBounds.y + relY * newBounds.height
      const newWidth = Math.max(100, relWidth * newBounds.width)
      const newHeight = Math.max(100, relHeight * newBounds.height)

      // Apply grid snapping
      const snappedX = grid.value.enabled ? boardStore.snapToGrid(newX) : newX
      const snappedY = grid.value.enabled ? boardStore.snapToGrid(newY) : newY

      boardStore.moveWidget(id, snappedX, snappedY)
      boardStore.resizeWidget(id, newWidth, newHeight)
    }
    return
  }

  // Group rotation - CSS transform-based (performance optimization)
  // Instead of mutating element data on every frame, we just update the rotation angle
  // The actual element positions are committed on mouseup
  if (isRotatingGroup.value) {
    // Calculate current mouse angle relative to group center
    const currentMouseAngle = calculateAngleFromCenter(
      e.clientX,
      e.clientY,
      groupRotationBounds.value
    )

    // Calculate angle delta
    let angleDelta = currentMouseAngle - groupRotationMouseStartAngle.value

    // Snap to 15deg increments when Shift is held
    if (e.shiftKey) {
      const snapAngle = Math.PI / 12 // 15 degrees
      angleDelta = Math.round(angleDelta / snapAngle) * snapAngle
    }

    // Update the rotation angle (triggers CSS transform update via computed)
    groupRotationAngle.value = angleDelta
    return
  }

  // CSS Transform-based dragging (optimized path - no expensive recalculations)
  // Only update the drag offset, which triggers a CSS transform change
  if (isDraggingWithTransform.value) {
    const dx = (e.clientX - moveStart.value.x) / viewport.value.zoom
    const dy = (e.clientY - moveStart.value.y) / viewport.value.zoom
    dragOffset.value = { x: dx, y: dy }
    return
  }
}

// Handle canvas mouseup - finish drawing, marquee selection, or movement
const handleCanvasMouseUp = (e: MouseEvent) => {
  if (isPanning.value) {
    isPanning.value = false
    return
  }

  if (isMarqueeSelecting.value) {
    // IMPORTANT: Capture the rect BEFORE setting isMarqueeSelecting to false
    // because marqueeRect computed depends on isMarqueeSelecting being true
    const finalRect = marqueeRect.value
    isMarqueeSelecting.value = false

    // Only select if marquee has some size (not just a click)
    if (finalRect && (finalRect.width > 5 || finalRect.height > 5)) {
      boardStore.selectInRect(finalRect, e.shiftKey)
      // Set flag to prevent the click event from clearing selection
      justFinishedMarquee.value = true
    }
    return
  }

  if (isDrawing.value) {
    // Capture binding state before finishing
    const endBinding = activeBinding.value
    const isLineOrArrow = activeTool.value === 'line' || activeTool.value === 'arrow'

    const element = toolStore.finishDrawing()
    if (element) {
      // Add element to store (without id and zIndex, store will assign them)
      const { id, zIndex, ...elementData } = element
      // Apply grid snapping to the element rect (skip if bound - binding takes precedence)
      if (grid.value.enabled && !endBinding) {
        elementData.rect = boardStore.snapRectToGrid(elementData.rect)
      }
      const newElementId = boardStore.addElement(elementData as Omit<CanvasElement, 'id' | 'zIndex'>)

      // Create end binding if we snapped to a shape during drawing
      if (newElementId && isLineOrArrow && endBinding) {
        boardStore.bindArrowToShape(
          newElementId,
          'end',
          endBinding.elementId,
          endBinding.anchor
        )
      }
    }

    // Clear binding state
    activeBinding.value = null
    bindingCandidates.value = []
    return
  }

  if (isResizingElement.value) {
    isResizingElement.value = false
    resizingElementId.value = null
    resizeHandle.value = null
    // Mark dirty after resize is complete
    boardStore.markDirty('Resized element')
    return
  }

  if (isRotatingElement.value) {
    isRotatingElement.value = false
    rotatingElementId.value = null
    // Mark dirty after rotation is complete
    boardStore.markDirty('Rotated element')
    return
  }

  if (isResizingGroup.value) {
    isResizingGroup.value = false
    groupResizeHandle.value = null
    groupStartElements.value = []
    groupStartWidgets.value = []
    // Mark dirty after group resize is complete
    boardStore.markDirty('Resized selection')
    return
  }

  if (isRotatingGroup.value) {
    // Commit the final rotated positions
    if (groupRotationAngle.value !== 0) {
      const angleDelta = groupRotationAngle.value
      const groupCenterX = groupRotationBounds.value.x + groupRotationBounds.value.width / 2
      const groupCenterY = groupRotationBounds.value.y + groupRotationBounds.value.height / 2

      const cos = Math.cos(angleDelta)
      const sin = Math.sin(angleDelta)

      // Helper to rotate a point around group center
      const rotatePoint = (px: number, py: number) => {
        const dx = px - groupCenterX
        const dy = py - groupCenterY
        return {
          x: groupCenterX + dx * cos - dy * sin,
          y: groupCenterY + dx * sin + dy * cos,
        }
      }

      // Apply final rotation to all elements
      for (const startEl of groupRotationStartElements.value) {
        const element = elements.value.find(el => el.id === startEl.id)
        if (!element) continue

        // Handle line/arrow elements - rotate actual points
        if ((startEl.type === 'line' || startEl.type === 'arrow') && startEl.points) {
          const newStart = rotatePoint(startEl.points.start.x, startEl.points.start.y)
          const newEnd = rotatePoint(startEl.points.end.x, startEl.points.end.y)

          // Calculate new bounding rect from rotated points
          const minX = Math.min(newStart.x, newEnd.x)
          const minY = Math.min(newStart.y, newEnd.y)
          const maxX = Math.max(newStart.x, newEnd.x)
          const maxY = Math.max(newStart.y, newEnd.y)

          // Update element (lines/arrows don't use angle, rotation is in points)
          boardStore.updateElement(startEl.id, {
            rect: {
              x: minX,
              y: minY,
              width: Math.max(1, maxX - minX),
              height: Math.max(1, maxY - minY),
            },
            points: {
              start: newStart,
              end: newEnd,
            },
          })
        } else {
          // For shapes: rotate center, keep size
          const elementCenterX = startEl.rect.x + startEl.rect.width / 2
          const elementCenterY = startEl.rect.y + startEl.rect.height / 2
          const newCenter = rotatePoint(elementCenterX, elementCenterY)

          // Calculate new angle (normalized to [-pi, pi])
          let newAngle = startEl.angle + angleDelta
          while (newAngle > Math.PI) newAngle -= 2 * Math.PI
          while (newAngle < -Math.PI) newAngle += 2 * Math.PI

          boardStore.updateElement(startEl.id, {
            rect: {
              ...startEl.rect,
              x: newCenter.x - startEl.rect.width / 2,
              y: newCenter.y - startEl.rect.height / 2,
            },
            angle: newAngle,
          })
        }
      }

      // Mark dirty after all updates
      boardStore.markDirty('Rotated selection')
    }

    // Reset state
    isRotatingGroup.value = false
    groupRotationStartElements.value = []
    groupRotationAngle.value = 0
    return
  }

  // CSS Transform-based drag completion - commit the final position
  if (isDraggingWithTransform.value) {
    isDraggingWithTransform.value = false

    // Only commit if there was actual movement
    if (dragOffset.value.x !== 0 || dragOffset.value.y !== 0) {
      // Commit element movements (with grid snapping)
      for (const id of draggingElementIds.value) {
        const element = elements.value.find((e) => e.id === id)
        if (element) {
          const newX = element.rect.x + dragOffset.value.x
          const newY = element.rect.y + dragOffset.value.y
          boardStore.moveElement(
            id,
            boardStore.snapToGrid(newX),
            boardStore.snapToGrid(newY),
            true // skipDirty during batch
          )
        }
      }

      // Commit widget movements (with grid snapping)
      for (const id of draggingWidgetIds.value) {
        const widget = widgets.value.find((w) => w.id === id)
        if (widget) {
          const newX = widget.rect.x + dragOffset.value.x
          const newY = widget.rect.y + dragOffset.value.y
          boardStore.moveWidget(
            id,
            boardStore.snapToGrid(newX),
            boardStore.snapToGrid(newY)
          )
        }
      }

      boardStore.markDirty('Moved selection')
    }

    draggingElementIds.value = []
    draggingWidgetIds.value = []
    dragOffset.value = { x: 0, y: 0 }
    return
  }
}

// Zoom constants
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3

// Cache for scrollable container checks to avoid repeated getComputedStyle calls
const scrollableCache = new WeakMap<HTMLElement, boolean>()

const isInsideScrollableContainer = (element: HTMLElement): boolean => {
  // Check cache first
  if (scrollableCache.has(element)) {
    return scrollableCache.get(element)!
  }

  let current: HTMLElement | null = element
  let result = false

  while (current && current !== canvasRef.value) {
    // Quick check without getComputedStyle first
    const hasScrollableContent =
      current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth

    if (hasScrollableContent) {
      // Only call getComputedStyle when we have scrollable content
      const style = getComputedStyle(current)
      const overflowY = style.overflowY
      const overflowX = style.overflowX

      const isVerticallyScrollable =
        (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight
      const isHorizontallyScrollable =
        (overflowX === 'auto' || overflowX === 'scroll') && current.scrollWidth > current.clientWidth

      if (isVerticallyScrollable || isHorizontallyScrollable) {
        result = true
        break
      }
    }

    current = current.parentElement
  }

  // Cache the result
  scrollableCache.set(element, result)
  return result
}

const handleWheel = (e: WheelEvent) => {
  const target = e.target as HTMLElement

  // Pan mode is MODAL: when active, ignore scrollable containers
  // This includes: Space key held, Hand tool selected, or middle-click panning
  const isInPanMode = isSpacePressed.value || activeTool.value === 'hand' || isPanning.value

  if (!e.ctrlKey && !e.metaKey && !isInPanMode && isInsideScrollableContainer(target)) {
    return // Allow widget scroll only when NOT in pan mode
  }

  e.preventDefault()
  closeContextMenu()

  if (e.ctrlKey || e.metaKey) {
    const delta = -e.deltaY * canvasSettings.value.zoomSensitivity
    const zoomFactor = Math.exp(delta)
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.value.zoom * zoomFactor))

    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect) {
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const scale = newZoom / viewport.value.zoom
      const newX = cursorX - (cursorX - viewport.value.x) * scale
      const newY = cursorY - (cursorY - viewport.value.y) * scale

      boardStore.updateViewport({ x: newX, y: newY, zoom: newZoom })
    }
  } else {
    boardStore.updateViewport({
      x: viewport.value.x - e.deltaX,
      y: viewport.value.y - e.deltaY,
    })
  }
}

// Zoom button handlers (zoom centered on screen center)
function handleZoomIn() {
  const newZoom = Math.min(MAX_ZOOM, viewport.value.zoom * 1.25)
  const centerX = canvasWidth.value / 2
  const centerY = canvasHeight.value / 2
  const scale = newZoom / viewport.value.zoom
  const newX = centerX - (centerX - viewport.value.x) * scale
  const newY = centerY - (centerY - viewport.value.y) * scale
  boardStore.updateViewport({ x: newX, y: newY, zoom: newZoom })
}

function handleZoomOut() {
  const newZoom = Math.max(MIN_ZOOM, viewport.value.zoom * 0.8)
  const centerX = canvasWidth.value / 2
  const centerY = canvasHeight.value / 2
  const scale = newZoom / viewport.value.zoom
  const newX = centerX - (centerX - viewport.value.x) * scale
  const newY = centerY - (centerY - viewport.value.y) * scale
  boardStore.updateViewport({ x: newX, y: newY, zoom: newZoom })
}

// Element event handlers
const handleElementSelect = (id: string, event?: MouseEvent) => {
  if (activeTool.value === 'select') {
    const addToSelection = event?.shiftKey || event?.metaKey || event?.ctrlKey

    // Check if this element is in a group
    const group = boardStore.getGroupForElement(id)

    // If element is in a group and we're not inside that group (edit mode),
    // select all group members
    if (group && boardStore.enteredGroupId !== group.id) {
      // If clicking on an already-selected group without modifier keys, don't change selection
      const groupMembers = boardStore.getGroupMembers(group.id)
      const allMembersSelected = groupMembers.every(el => boardStore.isSelected('element', el.id))
      if (!addToSelection && allMembersSelected) {
        return
      }

      // Select all group members
      const memberIds = groupMembers.map(el => el.id)
      boardStore.selectMultiple(memberIds.map(mid => ({ type: 'element' as const, id: mid })), !addToSelection)
      return
    }

    // If clicking on an already-selected element without modifier keys,
    // don't change the selection (preserve multi-selection for dragging)
    if (!addToSelection && boardStore.isSelected('element', id)) {
      return
    }

    boardStore.selectElement(id, addToSelection)
  }
}

// Handle double-click on element to enter group edit mode
const handleElementDoubleClick = (id: string, _event: MouseEvent) => {
  if (activeTool.value !== 'select') return

  const group = boardStore.getGroupForElement(id)
  if (group) {
    // Enter the group to edit individual elements
    boardStore.enterGroup(group.id)
    // Select only the clicked element
    boardStore.selectElement(id)
  }
}

// Handle group bounding box move start
const handleGroupMoveStart = (event: MouseEvent) => {
  if (activeTool.value !== 'select') return

  // Capture history snapshot BEFORE starting the move
  boardStore.captureHistorySnapshot('Moving selection')

  // Start moving all selected elements using CSS transform
  isDraggingWithTransform.value = true
  draggingElementIds.value = [...boardStore.selectedElementIds]
  draggingWidgetIds.value = [...boardStore.selectedWidgetIds]
  moveStart.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = { x: 0, y: 0 }
}

// Handle group bounding box resize start (proportional resize for multi-selection)
const handleGroupResizeStart = (
  handle: string,
  bounds: { x: number; y: number; width: number; height: number },
  event: MouseEvent
) => {
  if (activeTool.value !== 'select') return
  event.stopPropagation()

  // Capture history snapshot BEFORE starting the resize
  boardStore.captureHistorySnapshot('Resizing selection')

  isResizingGroup.value = true
  groupResizeHandle.value = handle
  groupResizeStart.value = { x: event.clientX, y: event.clientY }
  groupStartBounds.value = { ...bounds }

  // Store initial rects for all selected elements
  groupStartElements.value = boardStore.selectedElementIds.map(id => {
    const element = elements.value.find(e => e.id === id)
    return element ? { id, rect: { ...element.rect } } : null
  }).filter((e): e is { id: string; rect: { x: number; y: number; width: number; height: number } } => e !== null)

  // Store initial rects for all selected widgets
  groupStartWidgets.value = boardStore.selectedWidgetIds.map(id => {
    const widget = widgets.value.find(w => w.id === id)
    return widget ? { id, rect: { ...widget.rect } } : null
  }).filter((w): w is { id: string; rect: { x: number; y: number; width: number; height: number } } => w !== null)
}

// Handle group rotation start (rotate all selected elements around the group center)
const handleGroupRotateStart = (
  bounds: { x: number; y: number; width: number; height: number },
  event: MouseEvent
) => {
  if (activeTool.value !== 'select') return
  event.stopPropagation()

  // Capture history snapshot BEFORE starting the rotation
  boardStore.captureHistorySnapshot('Rotating selection')

  isRotatingGroup.value = true
  groupRotationBounds.value = { ...bounds }
  groupRotationAngle.value = 0  // Reset rotation angle for CSS transform

  // Store initial rects, angles, and points for all selected elements
  groupRotationStartElements.value = boardStore.selectedElementIds.map(id => {
    const element = elements.value.find(e => e.id === id)
    if (!element) return null

    const result: GroupRotationElement = {
      id,
      type: element.type,
      rect: { ...element.rect },
      angle: element.angle ?? 0,
    }

    // Store points for line/arrow elements
    if ((element.type === 'line' || element.type === 'arrow') && 'points' in element) {
      const lineElement = element as { points: { start: { x: number; y: number }; end: { x: number; y: number } } }
      result.points = {
        start: { ...lineElement.points.start },
        end: { ...lineElement.points.end },
      }
    }

    return result
  }).filter((e): e is GroupRotationElement => e !== null)

  // Calculate initial mouse angle relative to group center
  groupRotationMouseStartAngle.value = calculateAngleFromCenter(
    event.clientX,
    event.clientY,
    bounds
  )
}

const handleElementMoveStart = (id: string, event: MouseEvent) => {
  if (activeTool.value !== 'select') return

  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  // If modifier key is held, this is a selection toggle operation, not a drag
  // Don't start dragging - the selection was already handled by handleElementSelect
  const isSelectionToggle = event.shiftKey || event.metaKey || event.ctrlKey
  if (isSelectionToggle) {
    return
  }

  // Check if this element is in a group
  const group = boardStore.getGroupForElement(id)

  // Check if this element is already selected
  const isAlreadySelected = boardStore.isSelected('element', id)

  // Capture history snapshot BEFORE starting the move
  boardStore.captureHistorySnapshot('Moving element(s)')

  // Case 1: Element is part of a multi-selection -> move all selected items
  if (isAlreadySelected && isMultiSelection.value) {
    isDraggingWithTransform.value = true
    draggingElementIds.value = [...boardStore.selectedElementIds]
    draggingWidgetIds.value = [...boardStore.selectedWidgetIds]
    moveStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { x: 0, y: 0 }
    return
  }

  // Case 2: Element is already selected (single selection) -> just start dragging
  if (isAlreadySelected) {
    isDraggingWithTransform.value = true
    draggingElementIds.value = [id]
    moveStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { x: 0, y: 0 }
    return
  }

  // Case 3: Element is in a group and we're not in group edit mode -> move entire group
  if (group && boardStore.enteredGroupId !== group.id) {
    const groupMembers = boardStore.getGroupMembers(group.id)
    const memberIds = groupMembers.map(el => el.id)
    boardStore.selectMultiple(memberIds.map(mid => ({ type: 'element' as const, id: mid })), true)
    isDraggingWithTransform.value = true
    draggingElementIds.value = memberIds
    moveStart.value = { x: event.clientX, y: event.clientY }
    dragOffset.value = { x: 0, y: 0 }
    return
  }

  // Case 4: New selection - select and start dragging
  // Note: selectElement was already called by handleElementSelect, but we call it again
  // here in case of timing issues. This is safe since selecting an already-selected
  // element is a no-op in the store.
  isDraggingWithTransform.value = true
  draggingElementIds.value = [id]
  moveStart.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = { x: 0, y: 0 }
}

// Calculate new rect based on resize handle and delta
const calculateResizedRect = (
  startRect: { x: number; y: number; width: number; height: number },
  handle: string,
  dx: number,
  dy: number,
  maintainRatio: boolean
) => {
  let { x, y, width, height } = startRect
  const MIN_SIZE = 10
  const ratio = startRect.width / startRect.height

  switch (handle) {
    case 'se': // South-East
      width = Math.max(MIN_SIZE, startRect.width + dx)
      height = Math.max(MIN_SIZE, startRect.height + dy)
      break
    case 'sw': // South-West
      x = startRect.x + dx
      width = Math.max(MIN_SIZE, startRect.width - dx)
      height = Math.max(MIN_SIZE, startRect.height + dy)
      if (width === MIN_SIZE) x = startRect.x + startRect.width - MIN_SIZE
      break
    case 'ne': // North-East
      y = startRect.y + dy
      width = Math.max(MIN_SIZE, startRect.width + dx)
      height = Math.max(MIN_SIZE, startRect.height - dy)
      if (height === MIN_SIZE) y = startRect.y + startRect.height - MIN_SIZE
      break
    case 'nw': // North-West
      x = startRect.x + dx
      y = startRect.y + dy
      width = Math.max(MIN_SIZE, startRect.width - dx)
      height = Math.max(MIN_SIZE, startRect.height - dy)
      if (width === MIN_SIZE) x = startRect.x + startRect.width - MIN_SIZE
      if (height === MIN_SIZE) y = startRect.y + startRect.height - MIN_SIZE
      break
    case 'n': // North
      y = startRect.y + dy
      height = Math.max(MIN_SIZE, startRect.height - dy)
      if (height === MIN_SIZE) y = startRect.y + startRect.height - MIN_SIZE
      break
    case 's': // South
      height = Math.max(MIN_SIZE, startRect.height + dy)
      break
    case 'e': // East
      width = Math.max(MIN_SIZE, startRect.width + dx)
      break
    case 'w': // West
      x = startRect.x + dx
      width = Math.max(MIN_SIZE, startRect.width - dx)
      if (width === MIN_SIZE) x = startRect.x + startRect.width - MIN_SIZE
      break
  }

  // Maintain aspect ratio if shift is held (corner handles only)
  if (maintainRatio && ['nw', 'ne', 'se', 'sw'].includes(handle)) {
    if (Math.abs(dx) > Math.abs(dy)) {
      const newHeight = width / ratio
      if (handle.includes('n')) {
        y = startRect.y + startRect.height - newHeight
      }
      height = newHeight
    } else {
      const newWidth = height * ratio
      if (handle.includes('w')) {
        x = startRect.x + startRect.width - newWidth
      }
      width = newWidth
    }
  }

  return { x, y, width, height }
}

const handleElementResizeStart = (id: string, handle: string, event: MouseEvent) => {
  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  event.stopPropagation()

  // Capture history snapshot BEFORE starting the resize
  boardStore.captureHistorySnapshot('Resizing element')

  isResizingElement.value = true
  resizingElementId.value = id
  resizeHandle.value = handle
  resizeStart.value = { x: event.clientX, y: event.clientY }
  elementStartRect.value = { ...element.rect }
}

/**
 * Calculate angle (in radians) from a point to the center of a rect.
 */
const calculateAngleFromCenter = (
  clientX: number,
  clientY: number,
  rect: { x: number; y: number; width: number; height: number }
): number => {
  // Get element center in screen coordinates
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return 0

  const centerX = canvasRect.left + viewport.value.x + (rect.x + rect.width / 2) * viewport.value.zoom
  const centerY = canvasRect.top + viewport.value.y + (rect.y + rect.height / 2) * viewport.value.zoom

  // Calculate angle from center to mouse position
  return Math.atan2(clientY - centerY, clientX - centerX)
}

const handleElementRotateStart = (id: string, event: MouseEvent) => {
  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  event.stopPropagation()

  // Capture history snapshot BEFORE starting the rotation
  boardStore.captureHistorySnapshot('Rotating element')

  isRotatingElement.value = true
  rotatingElementId.value = id
  rotationStartAngle.value = element.angle ?? 0

  // Calculate initial mouse angle relative to element center
  rotationMouseStartAngle.value = calculateAngleFromCenter(
    event.clientX,
    event.clientY,
    element.rect
  )
}

// Text editing handlers
const handleElementEditStart = (id: string, type: 'text' | 'label') => {
  const element = elements.value.find((e) => e.id === id)
  if (!element) return

  // Get current content
  let content = ''
  if (type === 'text' && isTextElement(element)) {
    content = element.content ?? ''
  } else if (type === 'label' && isShapeElement(element)) {
    content = element.label ?? ''
  }

  isEditingText.value = true
  editingElementId.value = id
  editingType.value = type
  editValue.value = content

  // Focus the textarea after it renders and auto-resize
  setTimeout(() => {
    textEditorRef.value?.focus()
    textEditorRef.value?.select()
    autoResizeTextarea()
  }, 0)
}

// Handle right-click on canvas element
const handleElementContextMenu = (id: string, e: MouseEvent) => {
  boardStore.selectElement(id)
  contextMenu.value = {
    open: true,
    x: e.clientX,
    y: e.clientY,
    type: 'element',
    canvasPosition: { x: 0, y: 0 },
  }
}

const saveTextEdit = () => {
  if (!editingElementId.value) return

  const element = elements.value.find((e) => e.id === editingElementId.value)
  if (!element) {
    cancelTextEdit()
    return
  }

  if (editingType.value === 'text' && element.type === 'text') {
    // Calculate new height based on textarea content
    const newHeight = calculateTextHeight()
    boardStore.updateElement(editingElementId.value, {
      content: editValue.value,
      rect: { ...element.rect, height: newHeight },
    })
  } else if (editingType.value === 'label' && (element.type === 'rectangle' || element.type === 'ellipse')) {
    boardStore.updateElement(editingElementId.value, { label: editValue.value || undefined })
  }

  cancelTextEdit()
}

/**
 * Calculate the required height for the text content.
 * Uses the textarea's scrollHeight to measure actual content height.
 */
const calculateTextHeight = (): number => {
  const textarea = textEditorRef.value
  if (!textarea || !editingElement.value) return 30

  const zoom = viewport.value.zoom
  // Get the unscaled height from scrollHeight
  const scrollHeight = textarea.scrollHeight / zoom
  // Minimum height of 30px, with some padding
  return Math.max(30, scrollHeight)
}

/**
 * Auto-resize textarea height as user types.
 * Also updates the element's rect.height in real-time.
 */
const handleTextInput = () => {
  autoResizeTextarea()

  // Update element height in real-time during editing
  if (editingElementId.value && editingType.value === 'text') {
    const element = elements.value.find((e) => e.id === editingElementId.value)
    if (element?.type === 'text') {
      const newHeight = calculateTextHeight()
      if (Math.abs(element.rect.height - newHeight) > 1) {
        boardStore.updateElement(editingElementId.value, {
          rect: { ...element.rect, height: newHeight },
        })
      }
    }
  }
}

/**
 * Auto-resize the textarea to fit content.
 */
const autoResizeTextarea = () => {
  const textarea = textEditorRef.value
  if (!textarea) return

  // Reset height to auto to get accurate scrollHeight
  textarea.style.height = 'auto'
  // Set height to scrollHeight
  textarea.style.height = `${textarea.scrollHeight}px`
}

const cancelTextEdit = () => {
  isEditingText.value = false
  editingElementId.value = null
  editValue.value = ''
}

const handleTextEditorKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    saveTextEdit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelTextEdit()
  }
}

const handleTextEditorBlur = () => {
  // Small delay to allow click events on other elements
  setTimeout(() => {
    if (isEditingText.value) {
      saveTextEdit()
    }
  }, 100)
}

// ============================================================================
// Connection mode handlers
// ============================================================================

/**
 * Start connection mode from an element or widget.
 * Called from context menu "Connect from here" action.
 */
const startConnection = (id: string, type: 'element' | 'widget') => {
  isConnecting.value = true
  connectionSource.value = { id, type }
  connectionPreviewEnd.value = null
  boardStore.clearSelection()
  closeContextMenu()
}

/**
 * Cancel connection mode.
 */
const cancelConnection = () => {
  isConnecting.value = false
  connectionSource.value = null
  connectionPreviewEnd.value = null
  connectionHoverTarget.value = null
}

/**
 * Complete connection to a target element or widget.
 */
const completeConnection = (targetId: string, targetType: 'element' | 'widget') => {
  if (!connectionSource.value) return

  // Don't connect to self
  if (connectionSource.value.id === targetId) {
    cancelConnection()
    return
  }

  // Add the connection
  boardStore.addConnection(
    connectionSource.value.id,
    connectionSource.value.type,
    targetId,
    targetType
  )

  cancelConnection()
}

/**
 * Handle click during connection mode.
 * Uses hover target tracking for reliable detection (instead of event.target).
 */
const handleConnectionClickCapture = (e: MouseEvent) => {
  // Only handle in connection mode
  if (!isConnecting.value) return

  e.stopPropagation()
  e.preventDefault()

  // Use the tracked hover target (more reliable than event.target)
  if (connectionHoverTarget.value) {
    completeConnection(connectionHoverTarget.value.id, connectionHoverTarget.value.type)
  } else {
    // No target under cursor - cancel connection
    cancelConnection()
  }
}

/**
 * Handle connection selection (click on existing connection).
 */
const handleConnectionSelect = (connectionId: string) => {
  selectedConnectionId.value = connectionId
  boardStore.clearSelection()
}

/**
 * Handle connection context menu (right-click on connection).
 */
const handleConnectionContextMenu = (connectionId: string, event: MouseEvent) => {
  event.preventDefault()
  // Select the connection first
  selectedConnectionId.value = connectionId
  boardStore.clearSelection()

  // Show context menu at mouse position
  contextMenu.value = {
    open: true,
    x: event.clientX,
    y: event.clientY,
    type: 'connection' as ActionContextType | 'element' | 'connection',
    canvasPosition: screenToCanvas(event.clientX, event.clientY),
  }
}

// Widget event handlers
const handleWidgetSelect = (id: string, event?: MouseEvent) => {
  const addToSelection = event?.shiftKey || event?.metaKey || event?.ctrlKey

  // If clicking on an already-selected widget without modifier keys,
  // don't change the selection (preserve multi-selection for dragging)
  if (!addToSelection && boardStore.isSelected('widget', id)) {
    return
  }

  boardStore.selectWidget(id, addToSelection)
}

const handleWidgetMove = (id: string, x: number, y: number) => {
  boardStore.moveWidget(id, x, y)
}

const handleWidgetResize = (id: string, width: number, height: number) => {
  boardStore.resizeWidget(id, width, height)
}

const handleWidgetDelete = (id: string) => {
  boardStore.removeWidget(id)
}

const handleWidgetScaleChange = (id: string, delta: number) => {
  const currentScale = boardStore.getWidgetScale(id)
  boardStore.updateWidgetScale(id, currentScale + delta)
}

const handleWidgetDragStart = () => {
  closeContextMenu()
}

// Handle widget move start for multi-selection group drag
const handleWidgetMoveStart = (id: string, event: MouseEvent) => {
  if (!isMultiSelection.value) return

  // Start group drag with CSS transform
  isDraggingWithTransform.value = true
  draggingWidgetIds.value = [...selectedWidgetIds.value]
  draggingElementIds.value = [...selectedElementIds.value]
  moveStart.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = { x: 0, y: 0 }
}

// Handle widget menu button click (opens context menu)
const handleWidgetOpenMenu = (id: string, event: MouseEvent) => {
  // Select the widget if not already selected
  if (!boardStore.isSelected('widget', id)) {
    boardStore.selectWidget(id)
  }

  contextMenu.value = {
    open: true,
    x: event.clientX,
    y: event.clientY,
    type: 'widget',
    canvasPosition: { x: 0, y: 0 },
  }
}

const getModuleDisplayName = (moduleId: string) => {
  const module = moduleRegistry.get(moduleId)
  return module?.displayName ?? moduleId
}

// Prevent default browser behavior for space key
const preventSpaceScroll = (e: KeyboardEvent) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault()
  }
}

// Background panel
const handleBackgroundClick = () => {
  // TODO: Open background settings panel
  // For now, cycle through patterns
  const patterns = ['dots', 'grid', 'none'] as const
  const currentIndex = patterns.indexOf(background.value.pattern)
  const nextPattern = patterns[(currentIndex + 1) % patterns.length]
  boardStore.setBackground({ pattern: nextPattern })
}

// ResizeObserver for canvas size tracking
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  document.addEventListener('mousemove', handleCanvasMouseMove)
  document.addEventListener('mouseup', handleCanvasMouseUp)
  document.addEventListener('keydown', preventSpaceScroll)

  // Add capturing listener for connection mode clicks
  // This intercepts clicks BEFORE elements can stop propagation
  if (canvasRef.value) {
    canvasRef.value.addEventListener('click', handleConnectionClickCapture, true)
  }

  // Track canvas size for grid overlay
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvasWidth.value = entry.contentRect.width
        canvasHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(canvasRef.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleCanvasMouseMove)
  document.removeEventListener('mouseup', handleCanvasMouseUp)
  document.removeEventListener('keydown', preventSpaceScroll)

  // Remove capturing listener for connection mode
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('click', handleConnectionClickCapture, true)
  }

  // Cleanup ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// Expose canvas refs for export functionality
defineExpose({
  canvasRef,
  canvasContentRef,
})
</script>

<template>
  <div
    ref="canvasRef"
    class="board-canvas flex-1 overflow-hidden relative select-none canvas-background"
    :class="canvasCursor"
    :style="backgroundStyle"
    @click="handleCanvasClick"
    @wheel="handleWheel"
    @mousedown="handleCanvasMouseDown"
    @contextmenu="handleCanvasContextMenu"
  >
    <!-- Canvas content with transform -->
    <div ref="canvasContentRef" class="canvas-transform absolute inset-0" :style="transformStyle">
      <!-- Elements SVG layer (below widgets by default, z-index controls final order) -->
      <CanvasElementsLayer
        :zoom="viewport.zoom"
        :viewport="viewport"
        :drag-offset="dragOffset"
        :dragging-element-ids="draggingElementIds"
        :is-rotating-group="isRotatingGroup"
        :group-rotation="groupRotation"
        :binding-candidates="bindingCandidates"
        :active-binding="activeBinding"
        @element-select="(id, event) => handleElementSelect(id, event)"
        @element-move-start="handleElementMoveStart"
        @element-resize-start="handleElementResizeStart"
        @element-rotate-start="handleElementRotateStart"
        @element-edit-start="handleElementEditStart"
        @element-context-menu="handleElementContextMenu"
        @element-double-click="handleElementDoubleClick"
        @group-move-start="handleGroupMoveStart"
        @group-resize-start="handleGroupResizeStart"
        @group-rotate-start="handleGroupRotateStart"
      />

      <!-- Connections SVG layer (between elements and widgets) -->
      <ConnectionsLayer
        :zoom="viewport.zoom"
        :is-connecting="isConnecting"
        :connection-source="connectionSource"
        :preview-end="connectionPreviewEnd"
        :selected-connection-id="selectedConnectionId"
        :drag-offset="dragOffset"
        :dragging-element-ids="draggingElementIds"
        :dragging-widget-ids="draggingWidgetIds"
        @select-connection="handleConnectionSelect"
        @connection-contextmenu="handleConnectionContextMenu"
      />

      <!-- Widgets layer - pointer-events disabled during navigation mode -->
      <div
        class="widgets-layer"
        :class="{ 'navigation-mode': isNavigationMode }"
      >
        <WidgetFrame
          v-for="widget in widgets"
          :key="widget.id"
          :id="widget.id"
          :title="getModuleDisplayName(widget.moduleId)"
          :x="widget.rect.x"
          :y="widget.rect.y"
          :width="widget.rect.width"
          :height="widget.rect.height"
          :z-index="widget.zIndex"
          :zoom="viewport.zoom"
          :scale="widget.scale ?? 1"
          :selected="selectedWidgetIds.includes(widget.id)"
          :is-multi-selected="isMultiSelection && selectedWidgetIds.includes(widget.id)"
          :is-dragging="draggingWidgetIds.includes(widget.id)"
          :drag-offset="draggingWidgetIds.includes(widget.id) ? dragOffset : { x: 0, y: 0 }"
          :rest-mode="getWidgetVisibility(widget).restMode"
          :hover-mode="getWidgetVisibility(widget).hoverMode"
          @select="(id, event) => handleWidgetSelect(id, event)"
          @move="handleWidgetMove"
          @resize="handleWidgetResize"
          @delete="handleWidgetDelete"
          @dragstart="handleWidgetDragStart"
          @move-start="handleWidgetMoveStart"
          @open-menu="handleWidgetOpenMenu"
          @scale-change="handleWidgetScaleChange"
          @contextmenu.native="(e: MouseEvent) => handleWidgetContextMenu(widget.id, e)"
        >
          <WidgetRenderer
            :widget-id="widget.id"
            :module-id="widget.moduleId"
            @module-context-menu="(event) => handleModuleContextMenu(widget.id, event)"
          />
        </WidgetFrame>
      </div>
    </div>

    <!-- Tool Toolbar -->
    <ToolToolbar @background-click="handleBackgroundClick" />

    <!-- Text Editor Overlay -->
    <textarea
      v-if="isEditingText"
      ref="textEditorRef"
      v-model="editValue"
      class="text-editor-overlay"
      :style="textEditorStyle"
      @input="handleTextInput"
      @keydown="handleTextEditorKeydown"
      @blur="handleTextEditorBlur"
    />

    <!-- Marquee Selection Box -->
    <div
      v-if="isMarqueeSelecting && marqueeRect"
      class="marquee-box"
      :style="marqueeStyle"
    />

    <!-- Zoom controls -->
    <div class="absolute bottom-4 right-4 flex items-center gap-0.5 bg-background/80 border rounded-lg px-1 py-0.5">
      <BkToolButton
        icon="zoom-out"
        tooltip="Zoom Out"
        shortcut="⌘−"
        size="sm"
        @click="handleZoomOut"
      />
      <BkToolButton
        icon="zoom-in"
        tooltip="Zoom In"
        shortcut="⌘+"
        size="sm"
        @click="handleZoomIn"
      />
      <div class="px-2 text-xs text-muted-foreground tabular-nums min-w-[40px] text-center">
        {{ Math.round(viewport.zoom * 100) }}%
      </div>
    </div>

    <!-- Context Menu -->
    <BkContextMenu
      :open="contextMenu.open"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :groups="contextMenuGroups"
      @close="closeContextMenu"
      @select="handleContextMenuSelect"
    />

    <!-- Data Source Picker Modal -->
    <BkDataSourcePicker
      :open="dataSharingUI.pickerOpen.value"
      :providers="dataSharingUI.availableProviders.value"
      :current-connections="dataSharingUI.currentConnections.value"
      :multi-select="dataSharingUI.pickerConfig.value?.multiSelect ?? false"
      title="Connect Data Source"
      description="Select a data source to connect:"
      empty-text="No data sources available"
      empty-hint="Add a Todo widget first, then you can connect to it"
      @close="dataSharingUI.closePicker"
      @update:connections="dataSharingUI.handleConnectionsUpdate"
    />
  </div>
</template>

<style scoped>
.board-canvas {
  background-color: hsl(var(--background));
}

.canvas-background {
  /* Background pattern applied via inline style */
}

/* Widgets layer - allows disabling pointer events during navigation */
.widgets-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.widgets-layer > * {
  pointer-events: auto;
}

/* Navigation mode: disable all widget interactions for seamless panning */
.widgets-layer.navigation-mode > * {
  pointer-events: none;
}

.cursor-crosshair {
  cursor: crosshair;
}

.text-editor-overlay {
  background: transparent;
  border: 2px solid hsl(var(--primary));
  border-radius: 4px;
  outline: none;
  resize: none;
  overflow: hidden;
  z-index: 1000;
  font-family: inherit;
  box-sizing: border-box;
}
</style>
