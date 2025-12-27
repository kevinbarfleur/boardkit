# Boardkit — Architecture & Storage

## High-Level Architecture

Boardkit uses a shared core with platform-specific adapters.

apps/

- web
- desktop

packages/

- core → document model, board logic, modules
- ui → design system and shared components
- platform → platform adapters (storage, shortcuts, menu)

Core logic must not depend on platform APIs.

---

## In-Memory Document Model

```ts
BoardkitDocument {
  version: 0
  meta: {
    title: string
    updatedAt: number
  }
  board: {
    viewport: {
      x: number
      y: number
      zoom: number
    }
    widgets: Array<{
      id: string
      moduleId: string
      rect: { x: number; y: number; width: number; height: number }
      zIndex: number
    }>
  }
  modules: {
    [widgetId: string]: unknown
  }
}
```
