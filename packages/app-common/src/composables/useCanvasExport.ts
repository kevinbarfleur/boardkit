import { computed } from 'vue'
import { toPng, toSvg } from 'html-to-image'
import { useBoardStore } from '@boardkit/core'

/**
 * Export options for canvas export
 */
export interface ExportOptions {
  /** Background color (default: transparent for PNG, white for others) */
  backgroundColor?: string
  /** Padding around content in pixels (default: 20) */
  padding?: number
  /** Pixel ratio for PNG export (default: 2 for retina) */
  pixelRatio?: number
  /** Whether to include only selected elements (default: false) */
  selectionOnly?: boolean
  /** Custom filename without extension */
  filename?: string
}

/**
 * Bounding box result
 */
interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/**
 * useCanvasExport - Composable for exporting the canvas to PNG or SVG
 *
 * Usage:
 * ```ts
 * const { exportToPng, exportToSvg, calculateBoundingBox } = useCanvasExport()
 * await exportToPng(canvasElement, { padding: 40 })
 * ```
 */
export function useCanvasExport() {
  const boardStore = useBoardStore()

  const elements = computed(() => boardStore.elements)
  const widgets = computed(() => boardStore.widgets)
  const selectedElementIds = computed(() => boardStore.selectedElementIds)
  const selectedWidgetIds = computed(() => boardStore.selectedWidgetIds)

  /**
   * Calculate the bounding box of all content (elements + widgets)
   */
  function calculateBoundingBox(selectionOnly = false): BoundingBox | null {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    // Filter elements based on selection
    const targetElements = selectionOnly
      ? elements.value.filter(el => selectedElementIds.value.includes(el.id))
      : elements.value

    // Filter widgets based on selection
    const targetWidgets = selectionOnly
      ? widgets.value.filter(w => selectedWidgetIds.value.includes(w.id))
      : widgets.value

    // No content to export
    if (targetElements.length === 0 && targetWidgets.length === 0) {
      return null
    }

    // Calculate bounding box from elements
    for (const el of targetElements) {
      const rect = el.rect
      // Consider rotation - for simplicity, we use the axis-aligned bounding box
      // TODO: Calculate proper rotated bounding box
      const angle = el.angle ?? 0
      if (angle !== 0) {
        // For rotated elements, calculate the bounding box of the rotated rectangle
        const cx = rect.x + rect.width / 2
        const cy = rect.y + rect.height / 2
        const corners = [
          { x: rect.x, y: rect.y },
          { x: rect.x + rect.width, y: rect.y },
          { x: rect.x + rect.width, y: rect.y + rect.height },
          { x: rect.x, y: rect.y + rect.height },
        ]
        for (const corner of corners) {
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          const rx = cos * (corner.x - cx) - sin * (corner.y - cy) + cx
          const ry = sin * (corner.x - cx) + cos * (corner.y - cy) + cy
          minX = Math.min(minX, rx)
          minY = Math.min(minY, ry)
          maxX = Math.max(maxX, rx)
          maxY = Math.max(maxY, ry)
        }
      } else {
        minX = Math.min(minX, rect.x)
        minY = Math.min(minY, rect.y)
        maxX = Math.max(maxX, rect.x + rect.width)
        maxY = Math.max(maxY, rect.y + rect.height)
      }
    }

    // Calculate bounding box from widgets
    for (const widget of targetWidgets) {
      const scale = widget.scale ?? 1
      const width = widget.rect.width * scale
      const height = widget.rect.height * scale
      minX = Math.min(minX, widget.rect.x)
      minY = Math.min(minY, widget.rect.y)
      maxX = Math.max(maxX, widget.rect.x + width)
      maxY = Math.max(maxY, widget.rect.y + height)
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * Download a blob as a file
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Download a data URL as a file
   */
  function downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Export the canvas to PNG
   *
   * @param canvasElement - The DOM element containing the canvas (usually .canvas-container)
   * @param options - Export options
   */
  async function exportToPng(
    canvasElement: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      backgroundColor = 'transparent',
      padding = 20,
      pixelRatio = 2,
      selectionOnly = false,
      filename = boardStore.title || 'boardkit-export',
    } = options

    const bbox = calculateBoundingBox(selectionOnly)
    if (!bbox) {
      console.warn('[useCanvasExport] No content to export')
      return
    }

    // Get the current viewport
    const viewport = boardStore.viewport

    // Calculate the visible area in canvas coordinates
    const exportWidth = (bbox.width + padding * 2) * pixelRatio
    const exportHeight = (bbox.height + padding * 2) * pixelRatio

    try {
      // Clone the canvas element for export
      const dataUrl = await toPng(canvasElement, {
        backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
        pixelRatio,
        width: canvasElement.offsetWidth,
        height: canvasElement.offsetHeight,
        style: {
          transform: `translate(${-bbox.minX + padding + viewport.x / viewport.zoom}px, ${-bbox.minY + padding + viewport.y / viewport.zoom}px)`,
        },
        filter: (node) => {
          // Exclude UI elements like toolbars, selection handles during export
          if (node.classList?.contains('selection-handles')) return false
          if (node.classList?.contains('marquee-selection')) return false
          if (node.classList?.contains('tool-toolbar')) return false
          return true
        },
      })

      downloadDataUrl(dataUrl, `${filename}.png`)
    } catch (error) {
      console.error('[useCanvasExport] PNG export failed:', error)
      throw error
    }
  }

  /**
   * Export the canvas to SVG
   *
   * @param canvasElement - The DOM element containing the canvas
   * @param options - Export options
   */
  async function exportToSvg(
    canvasElement: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      backgroundColor = 'white',
      padding = 20,
      selectionOnly = false,
      filename = boardStore.title || 'boardkit-export',
    } = options

    const bbox = calculateBoundingBox(selectionOnly)
    if (!bbox) {
      console.warn('[useCanvasExport] No content to export')
      return
    }

    try {
      const dataUrl = await toSvg(canvasElement, {
        backgroundColor,
        width: canvasElement.offsetWidth,
        height: canvasElement.offsetHeight,
        filter: (node) => {
          // Exclude UI elements
          if (node.classList?.contains('selection-handles')) return false
          if (node.classList?.contains('marquee-selection')) return false
          if (node.classList?.contains('tool-toolbar')) return false
          return true
        },
      })

      downloadDataUrl(dataUrl, `${filename}.svg`)
    } catch (error) {
      console.error('[useCanvasExport] SVG export failed:', error)
      throw error
    }
  }

  /**
   * Get a PNG data URL without downloading
   */
  async function getPngDataUrl(
    canvasElement: HTMLElement,
    options: Omit<ExportOptions, 'filename'> = {}
  ): Promise<string> {
    const {
      backgroundColor = 'white',
      pixelRatio = 2,
    } = options

    return toPng(canvasElement, {
      backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
      pixelRatio,
      filter: (node) => {
        if (node.classList?.contains('selection-handles')) return false
        if (node.classList?.contains('marquee-selection')) return false
        if (node.classList?.contains('tool-toolbar')) return false
        return true
      },
    })
  }

  /**
   * Get an SVG data URL without downloading
   */
  async function getSvgDataUrl(
    canvasElement: HTMLElement,
    options: Omit<ExportOptions, 'filename'> = {}
  ): Promise<string> {
    const { backgroundColor = 'white' } = options

    return toSvg(canvasElement, {
      backgroundColor,
      filter: (node) => {
        if (node.classList?.contains('selection-handles')) return false
        if (node.classList?.contains('marquee-selection')) return false
        if (node.classList?.contains('tool-toolbar')) return false
        return true
      },
    })
  }

  return {
    calculateBoundingBox,
    exportToPng,
    exportToSvg,
    getPngDataUrl,
    getSvgDataUrl,
  }
}
