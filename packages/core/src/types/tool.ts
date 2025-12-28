/**
 * Canvas Tool Types
 *
 * Tools define the current interaction mode for the canvas.
 */

import type { CanvasElement, ElementStyle, Point } from './element'

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Available tool types.
 */
export type ToolType =
  | 'select'    // V - Select, move, resize elements
  | 'hand'      // H - Pan canvas
  | 'rectangle' // R - Draw rectangle
  | 'ellipse'   // O - Draw ellipse
  | 'line'      // L - Draw line
  | 'arrow'     // A - Draw arrow
  | 'pencil'    // P - Freehand drawing
  | 'text'      // T - Place text

/**
 * Tools that create elements (drawing tools).
 */
export type DrawingToolType = Exclude<ToolType, 'select' | 'hand'>

/**
 * Check if a tool is a drawing tool.
 */
export function isDrawingTool(tool: ToolType): tool is DrawingToolType {
  return tool !== 'select' && tool !== 'hand'
}

// ============================================================================
// Tool State
// ============================================================================

/**
 * Current tool state.
 */
export interface ToolState {
  /** Currently active tool */
  activeTool: ToolType
  /** Whether a drawing operation is in progress */
  isDrawing: boolean
  /** Start point of current drawing operation */
  drawStart: Point | null
  /** Preview element during drawing */
  previewElement: CanvasElement | null
  /** Default style for new elements */
  defaultStyle: ElementStyle
}

// ============================================================================
// Tool Shortcuts
// ============================================================================

/**
 * Keyboard shortcuts for tools.
 */
export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  select: 'V',
  hand: 'H',
  rectangle: 'R',
  ellipse: 'O',
  line: 'L',
  arrow: 'A',
  pencil: 'P',
  text: 'T',
}

/**
 * Reverse mapping: key to tool.
 */
export const KEY_TO_TOOL: Record<string, ToolType> = {
  v: 'select',
  h: 'hand',
  r: 'rectangle',
  o: 'ellipse',
  l: 'line',
  a: 'arrow',
  p: 'pencil',
  t: 'text',
}
