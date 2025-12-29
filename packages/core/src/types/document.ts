/**
 * Boardkit Document Model
 * This is the single source of truth for the document structure.
 */

import type { CanvasElement, BoardBackground } from './element'
import { DEFAULT_BACKGROUND } from './element'
import type { DataSharingState } from './dataContract'
import { createEmptyDataSharingState } from './dataContract'

// ============================================================================
// Current Document Version
// ============================================================================

/**
 * Current document format version.
 * Increment this when making breaking changes to the document structure.
 *
 * Version history:
 * - v1: Initial version with widgets, elements, and background
 * - v2: Added dataSharing for inter-module data sharing
 */
export const CURRENT_DOCUMENT_VERSION = 2

// ============================================================================
// Geometry Types
// ============================================================================

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

// ============================================================================
// Widget Types
// ============================================================================

/** How the widget frame appears visually */
export type WidgetVisibilityMode = 'transparent' | 'subtle' | 'visible'

/** Per-widget visibility settings */
export interface WidgetVisibilitySettings {
  /** Appearance when widget is at rest (not hovered, not selected) */
  restMode: WidgetVisibilityMode
  /** Appearance when widget is hovered */
  hoverMode: WidgetVisibilityMode
}

/** Default visibility settings for new widgets */
export const DEFAULT_WIDGET_VISIBILITY: WidgetVisibilitySettings = {
  restMode: 'transparent',
  hoverMode: 'subtle',
}

export interface Widget {
  id: string
  moduleId: string
  rect: Rect
  zIndex: number
  /** Widget frame visibility settings (optional, defaults applied if missing) */
  visibility?: WidgetVisibilitySettings
}

// ============================================================================
// Board State
// ============================================================================

export interface BoardState {
  viewport: Viewport
  widgets: Widget[]
  /** Native canvas elements (shapes, lines, text, etc.) */
  elements: CanvasElement[]
  /** Board background configuration */
  background: BoardBackground
}

// ============================================================================
// Document Types
// ============================================================================

export interface DocumentMeta {
  title: string
  createdAt: number
  updatedAt: number
}

export interface BoardkitDocument {
  version: number
  meta: DocumentMeta
  board: BoardState
  modules: Record<string, unknown>
  /** Data sharing state (permissions and links) - added in v2 */
  dataSharing?: DataSharingState
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new empty document with the current version.
 */
export function createEmptyDocument(title: string): BoardkitDocument {
  const now = Date.now()
  return {
    version: CURRENT_DOCUMENT_VERSION,
    meta: {
      title,
      createdAt: now,
      updatedAt: now,
    },
    board: {
      viewport: { x: 0, y: 0, zoom: 1 },
      widgets: [],
      elements: [],
      background: { ...DEFAULT_BACKGROUND },
    },
    modules: {},
    dataSharing: createEmptyDataSharingState(),
  }
}
