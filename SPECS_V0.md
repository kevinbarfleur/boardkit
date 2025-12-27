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
- Single-widget selection
- Autosave enabled

Freehand drawing is explicitly excluded from V0.

---

## Modules (V0)

### Text Module

- Editable text content
- Local state only
- Fully serializable

### To-do Module

- List of tasks (checkbox + label)
- Local state only
- Fully serializable

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
