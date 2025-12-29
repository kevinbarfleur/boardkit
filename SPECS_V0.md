# Boardkit — V0 Specifications

## Goal of V0

Deliver a usable, offline-first, modular whiteboard with:

- basic widgets
- file-based persistence
- Web + macOS Desktop support
- keyboard-driven desktop UX

---

## Whiteboard (V0)

- Infinite canvas (pan + zoom)
- Add / move / resize widgets
- Simple z-index handling
- Single selection (widgets or elements)
- Autosave enabled

---

## Canvas Elements (V0)

Native canvas primitives (lightweight, non-module elements):

### Supported Element Types

- **Rectangle** — with optional label text
- **Ellipse** — with optional label text
- **Line** — two-point line
- **Arrow** — line with arrowhead(s)
- **Draw** — freehand pencil strokes
- **Text** — standalone text block

### Element Styles

- Stroke color (preset palette)
- Fill color (none or solid)
- Stroke width (S/M/L)
- Opacity (100/75/50%)

### Tools

| Tool      | Shortcut | Description              |
|-----------|----------|--------------------------|
| Select    | V        | Select/move/resize       |
| Hand      | H        | Pan canvas               |
| Rectangle | R        | Draw rectangle           |
| Ellipse   | O        | Draw ellipse             |
| Line      | L        | Draw line                |
| Arrow     | A        | Draw arrow               |
| Pencil    | P        | Freehand drawing         |
| Text      | T        | Place text block         |

### Board Background

- Dots (default)
- Grid
- None (transparent)
- Solid color

### Z-Index

Elements and widgets share the same z-index space.
Elements can be sent behind or brought in front of widgets.

### Persistence

Elements are stored in `board.elements[]` within the document.
Full undo/redo support via history snapshots.

---

## Modules (V0)

### Text Module

- Editable text content
- Local state only
- Fully serializable

### To-do Module

- List of tasks (checkbox + label)
- Optional title and description
- Priority levels (high/medium/low)
- Due dates
- Progress indicator (bar or counter)
- Settings: auto-sort, strike completed, hide completed
- **Data Provider**: Exposes `boardkit.todo.v1` contract

### Task Radar Module

- Aggregates tasks from multiple To-do widgets
- Shows overview of all connected tasks
- Displays combined progress statistics
- **Data Consumer**: Consumes `boardkit.todo.v1` (multi-source)

### Focus Lens Module

- Focused view of a single To-do widget's tasks
- Filtered display mode for deep work
- **Data Consumer**: Consumes `boardkit.todo.v1` (single source)

---

## Data Sharing (V0)

Inter-module communication system for read-only data flow.

### Concepts

- **Data Contract**: Versioned schema defining shared data structure
- **Provider**: Module that exposes data via a contract
- **Consumer**: Module that reads data from providers
- **Permission**: User-granted link between consumer and provider

### Current Contracts

| Contract ID | Provider | Consumers |
|-------------|----------|-----------|
| `boardkit.todo.v1` | To-do | Task Radar, Focus Lens |

### Rules

- All data sharing is **read-only** in V0
- Consumers must request permission to connect
- Connections are persisted in document (`dataSharing` section)
- Providers are unaware of their consumers

See `docs/SPECS_DATA_SHARING_POC.md` for full specification.

---

## Module Rules (STRICT)

Each module must:

- Declare a stable `moduleId` and `version`
- Provide a Vue component
- Define an initial state
- Implement `serialize()` and `deserialize()`

Modules must NOT:

- Access other modules’ state
- Implement their own drag/resize/frame UI
- Bypass the shared WidgetFrame

---

## Desktop UX (macOS)

### Global Shortcut

- `Cmd + Shift + Space`
  - Bring app to foreground
  - Focus main window
  - Open command palette

### Command Palette

- Search widgets / modules
- Create new module instance
- Open existing board

### Menu Bar

- New Board
- Open Board
- Quick Search
- Quit

---

## Web Application (V0)

- Fully offline-capable
- IndexedDB persistence
- Import / Export `.boardkit` files
- No background synchronization

---

## Synchronization Model

- User-managed only
- Via Dropbox / Drive / Git / Syncthing
- File conflicts result in duplicated documents
- No automatic merge logic

---

## Explicit Non-Goals

- Multi-user collaboration
- Accounts or permissions
- Encryption
- Advanced indexing or search backends
