/**
 * Boardkit Document Model
 * This is the single source of truth for the document structure.
 */

import type { CanvasElement, BoardBackground } from './element'
import { DEFAULT_BACKGROUND } from './element'

// ============================================================================
// Current Document Version
// ============================================================================

/**
 * Current document format version.
 * Increment this when making breaking changes to the document structure.
 */
export const CURRENT_DOCUMENT_VERSION = 1

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

export interface Widget {
  id: string
  moduleId: string
  rect: Rect
  zIndex: number
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
  }
}
