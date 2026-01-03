/**
 * Canvas Element Types
 *
 * Native canvas primitives that exist alongside widgets.
 * Elements are NOT modules - they are lightweight drawing primitives.
 */

import type { Rect } from './document'

// ============================================================================
// Base Types
// ============================================================================

export interface Point {
  x: number
  y: number
}

export type ElementType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'draw' | 'text' | 'image'

/**
 * Stroke dash pattern type.
 */
export type StrokeDashType = 'solid' | 'dashed' | 'dotted'

/**
 * Visual style properties shared by all elements.
 */
export interface ElementStyle {
  /** Stroke color (CSS color string). Default: '#ffffff' */
  strokeColor: string
  /** Stroke width in pixels (1-8). Default: 2 */
  strokeWidth: number
  /** Fill color (CSS color string) or null for no fill. Default: null */
  fillColor: string | null
  /** Opacity (0-1). Default: 1 */
  opacity: number
  /** Stroke dash pattern. Default: 'solid' */
  strokeDash?: StrokeDashType
  /** Roughness for sketchy rendering (0-3). Default: 1 */
  roughness?: number
}

/**
 * Base interface for all canvas elements.
 */
export interface BaseElement {
  /** Unique identifier (nanoid) */
  id: string
  /** Element type discriminator */
  type: ElementType
  /** Bounding box (position and dimensions) */
  rect: Rect
  /** Stacking order (shared with widgets) */
  zIndex: number
  /** Visual style properties */
  style: ElementStyle
  /** Rotation angle in radians (0 = no rotation). Default: 0 */
  angle?: number
  /** Optional: prevent modifications */
  locked?: boolean
}

// ============================================================================
// Shape Elements
// ============================================================================

/**
 * Rectangle or Ellipse shape element.
 */
export interface ShapeElement extends BaseElement {
  type: 'rectangle' | 'ellipse'
  /** Optional centered text label */
  label?: string
  /** Border radius (rectangles only) */
  cornerRadius?: number
}

// ============================================================================
// Line Elements
// ============================================================================

export type ArrowHeadType = 'none' | 'end' | 'start' | 'both'

/**
 * Line or Arrow element.
 * Note: rect is the computed bounding box of the line.
 */
export interface LineElement extends BaseElement {
  type: 'line' | 'arrow'
  /** Start and end points in board coordinates */
  points: {
    start: Point
    end: Point
  }
  /** Arrowhead placement (for arrows) */
  arrowHead?: ArrowHeadType
  /** Binding for start point (connects arrow to shape) */
  startBinding?: ArrowBinding
  /** Binding for end point (connects arrow to shape) */
  endBinding?: ArrowBinding
}

// ============================================================================
// Draw Element (Freehand)
// ============================================================================

/**
 * Freehand drawing element.
 */
export interface DrawElement extends BaseElement {
  type: 'draw'
  /** Array of path points in board coordinates */
  points: Point[]
}

// ============================================================================
// Text Element
// ============================================================================

export type FontWeight = 'normal' | 'medium' | 'bold'
export type TextAlign = 'left' | 'center' | 'right'

/**
 * Font family options for text elements.
 * - system: System UI font (default)
 * - handwritten: Cursive/hand-drawn style (like Excalidraw's Virgil)
 * - code: Monospace font for code
 * - serif: Classic serif font for elegant text
 */
export type FontFamily = 'system' | 'handwritten' | 'code' | 'serif'

/**
 * Standalone text block element.
 */
export interface TextElement extends BaseElement {
  type: 'text'
  /** Text content */
  content: string
  /** Font family. Default: 'system' */
  fontFamily: FontFamily
  /** Font size in pixels (12-72). Default: 16 */
  fontSize: number
  /** Font weight. Default: 'normal' */
  fontWeight: FontWeight
  /** Text alignment. Default: 'left' */
  textAlign: TextAlign
}

// ============================================================================
// Image Element
// ============================================================================

/**
 * How image content fits within its bounding box.
 */
export type ImageObjectFit = 'contain' | 'cover' | 'fill'

/**
 * Image element for displaying raster/vector images on the canvas.
 * Images are stored as assets and referenced by assetId.
 */
export interface ImageElement extends BaseElement {
  type: 'image'
  /** Reference to asset in the document's asset registry */
  assetId: string
  /** Alternative text for accessibility */
  alt?: string
  /** How image fits within bounds. Default: 'contain' */
  objectFit?: ImageObjectFit
  /** Horizontal flip */
  flipX?: boolean
  /** Vertical flip */
  flipY?: boolean
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * Union of all canvas element types.
 */
export type CanvasElement = ShapeElement | LineElement | DrawElement | TextElement | ImageElement

// ============================================================================
// Board Background
// ============================================================================

export type BackgroundPattern = 'dots' | 'grid' | 'none'

/**
 * Board background configuration.
 */
export interface BoardBackground {
  /** Background pattern. Default: 'dots' */
  pattern: BackgroundPattern
  /** Background color (CSS color string). Default: '#0a0a0a' */
  color: string
}

// ============================================================================
// Type Guards
// ============================================================================

export function isShapeElement(element: CanvasElement): element is ShapeElement {
  return element.type === 'rectangle' || element.type === 'ellipse'
}

export function isLineElement(element: CanvasElement): element is LineElement {
  return element.type === 'line' || element.type === 'arrow'
}

export function isDrawElement(element: CanvasElement): element is DrawElement {
  return element.type === 'draw'
}

export function isTextElement(element: CanvasElement): element is TextElement {
  return element.type === 'text'
}

export function isImageElement(element: CanvasElement): element is ImageElement {
  return element.type === 'image'
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  strokeColor: '#ffffff',
  strokeWidth: 2,
  fillColor: null,
  opacity: 1,
  strokeDash: 'solid',
  roughness: 1,
}

export const DEFAULT_BACKGROUND: BoardBackground = {
  pattern: 'dots',
  color: 'auto', // 'auto' = use theme background color
}

export const DEFAULT_FONT_SIZE = 16
export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 72

export const MIN_STROKE_WIDTH = 1
export const MAX_STROKE_WIDTH = 8

export const DEFAULT_FONT_FAMILY: FontFamily = 'system'

/**
 * CSS font-family values for each FontFamily option.
 */
export const FONT_FAMILY_CSS: Record<FontFamily, string> = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  handwritten: '"Caveat", "Segoe Print", "Bradley Hand", cursive',
  code: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
  serif: '"Libre Baskerville", Georgia, "Times New Roman", serif',
}

/**
 * Display labels for font family options.
 */
export const FONT_FAMILY_LABELS: Record<FontFamily, string> = {
  system: 'System',
  handwritten: 'Handwritten',
  code: 'Code',
  serif: 'Serif',
}

/**
 * Default object fit for image elements.
 */
export const DEFAULT_IMAGE_OBJECT_FIT: ImageObjectFit = 'contain'

/**
 * Display labels for image object fit options.
 */
export const IMAGE_OBJECT_FIT_LABELS: Record<ImageObjectFit, string> = {
  contain: 'Contain',
  cover: 'Cover',
  fill: 'Fill',
}

// ============================================================================
// Grid Settings (Snap to Grid)
// ============================================================================

/**
 * Fixed grid size in canvas coordinates (pixels).
 * This matches the visual background pattern and ensures snap alignment.
 * Style: Excalidraw-like fixed grid.
 */
export const GRID_SIZE = 20

/**
 * Grid snapping configuration for the board.
 * Simplified: only controls whether snap is enabled.
 * Grid size is fixed at GRID_SIZE (20px) to match visual pattern.
 */
export interface GridSettings {
  /** Whether snap to grid is enabled */
  enabled: boolean
  /** @deprecated Use GRID_SIZE constant instead. Kept for backwards compatibility. */
  size?: number
  /** @deprecated Grid overlay removed, background pattern serves as visual guide. */
  showGrid?: boolean
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  enabled: false,
}

// ============================================================================
// Element Groups
// ============================================================================

/**
 * A group of elements that move/resize together.
 */
export interface ElementGroup {
  /** Unique identifier for the group */
  id: string
  /** IDs of elements in this group */
  memberIds: string[]
  /** Parent group ID if this is a nested group */
  parentGroupId?: string
}

// ============================================================================
// Arrow Binding
// ============================================================================

/**
 * Anchor positions on a shape for arrow binding.
 */
export type AnchorPosition = 'top' | 'bottom' | 'left' | 'right' | 'center'

/**
 * Binding between an arrow endpoint and a shape.
 */
export interface ArrowBinding {
  /** ID of the bound shape element */
  elementId: string
  /** Anchor position on the shape */
  anchor: AnchorPosition
  /** Optional offset from anchor point for fine-tuning */
  offset?: Point
}

// ============================================================================
// Connections (Intentional Element-to-Element Links)
// ============================================================================

/**
 * Target type for connections - can be a canvas element or a widget.
 */
export type ConnectionTargetType = 'element' | 'widget'

/**
 * A connection represents an intentional link between two elements/widgets.
 * Unlike arrow bindings, connections are explicit user-created relationships
 * with orthogonal routing (90° angles).
 *
 * Connections are created via context menu "Connect from here" action.
 * The arrow path is calculated dynamically based on element positions.
 */
export interface Connection {
  /** Unique identifier (nanoid) */
  id: string
  /** ID of the source element or widget */
  sourceId: string
  /** Type of the source (canvas element or widget) */
  sourceType: ConnectionTargetType
  /** ID of the target element or widget */
  targetId: string
  /** Type of the target (canvas element or widget) */
  targetType: ConnectionTargetType
  /** Optional label for the connection */
  label?: string
  /** Optional style overrides */
  style?: {
    /** Stroke color (CSS color string) */
    strokeColor?: string
    /** Stroke width in pixels */
    strokeWidth?: number
  }
}
