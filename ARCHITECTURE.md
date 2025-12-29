# Boardkit — Architecture & Storage

## High-Level Architecture

Boardkit uses a shared core with platform-specific adapters.

```
boardkit/
├── apps/
│   ├── web/              # Web application (Vue 3 + Vite + PWA)
│   └── desktop/          # Desktop application (Tauri + Vue 3)
├── packages/
│   ├── core/             # Document model, stores, modules, actions
│   ├── ui/               # Design system and shared components
│   └── platform/         # Platform adapters (storage, etc.)
└── docs/                 # Specifications
```

### Package Responsibilities

| Package | Responsibility |
|---------|----------------|
| `@boardkit/core` | Business logic, stores (Pinia), module SDK, action registry, data sharing |
| `@boardkit/ui` | Design system, Vue components, WidgetFrame, ElementRenderer |
| `@boardkit/platform` | Storage adapters (IndexedDB, filesystem) |

**Core logic must NOT depend on platform APIs.**

---

## In-Memory Document Model

Current version: **2**

```ts
interface BoardkitDocument {
  version: 2
  meta: {
    title: string
    createdAt: number
    updatedAt: number
  }
  board: {
    viewport: {
      x: number
      y: number
      zoom: number
    }
    widgets: Widget[]
    elements: CanvasElement[]
    background: BoardBackground
  }
  modules: Record<string, unknown>
  dataSharing?: DataSharingState
}
```

### Widget Structure

```ts
interface Widget {
  id: string           // Unique ID (nanoid)
  moduleId: string     // Module type identifier
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  zIndex: number
  visibility?: {
    restMode: 'transparent' | 'subtle' | 'visible'
    hoverMode: 'transparent' | 'subtle' | 'visible'
  }
}
```

### Canvas Elements

Native canvas primitives (NOT modules):

```ts
type CanvasElement = ShapeElement | LineElement | DrawElement | TextElement

interface BaseElement {
  id: string
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'draw' | 'text'
  rect: Rect
  zIndex: number
  style: ElementStyle
  locked?: boolean
}

interface ElementStyle {
  strokeColor: string
  strokeWidth: number
  fillColor: string | null
  opacity: number
  strokeDash?: 'solid' | 'dashed' | 'dotted'
  roughness?: number
}
```

### Board Background

```ts
interface BoardBackground {
  pattern: 'dots' | 'grid' | 'none'
  color: string  // 'auto' uses theme background
}
```

### Data Sharing (v2)

```ts
interface DataSharingState {
  permissions: DataPermission[]
  links: DataLink[]
}

interface DataPermission {
  id: string
  consumerWidgetId: string
  providerWidgetId: string
  contractId: string
  scope: 'read'
  grantedAt: number
}
```

---

## Module System

Modules are registered widgets with strict isolation:

```ts
interface ModuleDefinition<TState> {
  moduleId: string
  version: string
  displayName: string
  component: Component
  defaultState: () => TState
  serialize: (state: TState) => unknown
  deserialize: (data: unknown) => TState
  minWidth?: number
  minHeight?: number
  defaultWidth?: number
  defaultHeight?: number
}
```

### Current Modules (V0)

| Module | ID | Data Contract |
|--------|-----|---------------|
| Text | `text` | - |
| Todo | `todo` | Provider: `boardkit.todo.v1` |
| Task Radar | `task-radar` | Consumer: `boardkit.todo.v1` |
| Focus Lens | `focus-lens` | Consumer: `boardkit.todo.v1` |

---

## State Management

### BoardStore (Pinia)

Central store managing document state:

- `document` — Current BoardkitDocument
- `selectedWidgetId` / `selectedElementId` — Selection state
- `selectedWidgetIds` / `selectedElementIds` — Multi-selection
- `isDirty` — Unsaved changes flag

### ToolStore (Pinia)

Canvas tool state:

- `activeTool` — Current tool (select, hand, rectangle, ellipse, line, arrow, pencil, text)
- `isDrawing` — Drawing in progress
- `defaultStyle` — Default element style

---

## Action System

All user operations are registered actions:

```ts
interface ActionDefinition {
  id: string
  title: string
  group: 'board' | 'widget' | 'element' | 'tool' | 'view' | 'module'
  contexts: ('global' | 'canvas' | 'widget')[]
  shortcutHint?: string
  when?: (ctx: ActionContext) => boolean
  run: (ctx: ActionContext) => Promise<void> | void
}
```

Actions power:
- Command Palette (Cmd/Ctrl + K)
- Context menus
- Keyboard shortcuts (display hints)

---

## Storage

### Web (IndexedDB)

- **Database:** `boardkit`
- **Stores:** `documents`, `history`
- **Autosave:** 500ms debounce
- **History:** Max 100 entries per document

### Desktop (Filesystem)

- **Location:** App local data directory
- **Format:** Plain JSON (autosave) or `.boardkit` ZIP (export)
- **Autosave:** 1000ms debounce

### .boardkit File Format

ZIP archive containing:
- `package.json` — Metadata (name, version, formatVersion)
- `board.json` — Complete BoardkitDocument

---

## Version History

| Version | Changes |
|---------|---------|
| 0 | Initial (legacy, auto-migrated) |
| 1 | Added `elements[]`, `background` |
| 2 | Added `dataSharing` for inter-module data |

Documents are automatically migrated on load via `migrateDocument()`.

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/types/document.ts` | Document schema |
| `packages/core/src/types/element.ts` | Canvas element types |
| `packages/core/src/stores/boardStore.ts` | Main Pinia store |
| `packages/core/src/actions/ActionRegistry.ts` | Action system |
| `packages/core/src/modules/defineModule.ts` | Module SDK |
| `packages/core/src/data/DataBus.ts` | Inter-module pub/sub |
| `packages/ui/src/components/WidgetFrame.vue` | Widget container |
| `packages/ui/src/components/ElementRenderer.vue` | Canvas rendering |
