/**
 * Boardkit Document Model
 * This is the single source of truth for the document structure.
 */

import type { CanvasElement, BoardBackground, GridSettings, ElementGroup, Connection } from './element'
import { DEFAULT_BACKGROUND } from './element'
import type { DataSharingState } from './dataContract'
import { createEmptyDataSharingState } from './dataContract'
import type { AssetRegistry } from './asset'
import { createEmptyAssetRegistry } from './asset'

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
 * - v3: Added assets registry for binary files (images)
 * - v4: Added canvasSettings for zoom, snap-to-grid, and grid spacing
 */
export const CURRENT_DOCUMENT_VERSION = 4

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
// Canvas Settings
// ============================================================================

/**
 * Canvas behavior settings stored at document level.
 * These settings persist with the document.
 */
export interface CanvasSettings {
  /** Zoom wheel sensitivity (0.0005 to 0.005). Default: 0.002 */
  zoomSensitivity: number
  /** Snap elements to grid when moving/resizing. Default: true */
  snapToGrid: boolean
  /** Grid spacing in pixels (10 to 100). Default: 20 */
  gridSpacing: number
}

/** Default canvas settings */
export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  zoomSensitivity: 0.002,
  snapToGrid: true,
  gridSpacing: 20,
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

// ============================================================================
// Widget Scale Constants
// ============================================================================

/** Minimum widget content scale (100%) */
export const MIN_WIDGET_SCALE = 1.0
/** Maximum widget content scale (200%) */
export const MAX_WIDGET_SCALE = 2.0
/** Default widget content scale (100%) */
export const DEFAULT_WIDGET_SCALE = 1.0

export interface Widget {
  id: string
  moduleId: string
  rect: Rect
  zIndex: number
  /** Widget frame visibility settings (optional, defaults applied if missing) */
  visibility?: WidgetVisibilitySettings
  /** Widget content scale (0.5 to 2.0, defaults to 1.0 if missing) */
  scale?: number
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
  /** Grid snapping settings (legacy, use canvasSettings instead) */
  grid?: GridSettings
  /** Element groups for grouping functionality */
  groups?: ElementGroup[]
  /** Connections between elements/widgets (orthogonal arrows) */
  connections?: Connection[]
  /** Canvas behavior settings - added in v4 */
  canvasSettings?: CanvasSettings
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
  /** Asset registry for binary files (images) - added in v3 */
  assets?: AssetRegistry
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
      connections: [],
      canvasSettings: { ...DEFAULT_CANVAS_SETTINGS },
    },
    modules: {},
    dataSharing: createEmptyDataSharingState(),
    assets: createEmptyAssetRegistry(),
  }
}
