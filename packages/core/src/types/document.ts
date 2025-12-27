/**
 * Boardkit Document Model
 * This is the single source of truth for the document structure.
 */

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

export interface Widget {
  id: string
  moduleId: string
  rect: Rect
  zIndex: number
}

export interface BoardState {
  viewport: Viewport
  widgets: Widget[]
}

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

export function createEmptyDocument(title: string): BoardkitDocument {
  const now = Date.now()
  return {
    version: 0,
    meta: {
      title,
      createdAt: now,
      updatedAt: now,
    },
    board: {
      viewport: { x: 0, y: 0, zoom: 1 },
      widgets: [],
    },
    modules: {},
  }
}
