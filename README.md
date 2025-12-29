# Boardkit

An open-source, offline-first, modular whiteboard toolkit.

## Features

- **Offline-first**: Works without an internet connection
- **Modular**: Add and create custom widget modules
- **Cross-platform**: Web (PWA) and macOS desktop (via Tauri)
- **Portable**: `.boardkit` document format (ZIP-based)
- **Native canvas**: Shapes, arrows, freehand drawing, text
- **Data sharing**: Modules can share data through versioned contracts

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Rust (for desktop app)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/boardkit.git
cd boardkit

# Install dependencies
pnpm install

# Start the web app
pnpm dev
```

### Desktop App

```bash
# Run the desktop app (requires Rust)
pnpm desktop
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web app in development mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm desktop` | Start desktop app (Tauri) |

---

## Project Structure

```
boardkit/
├── apps/
│   ├── web/              # Web application (Vue 3 + Vite + PWA)
│   └── desktop/          # Desktop application (Tauri)
├── packages/
│   ├── core/             # Core logic, stores, module SDK
│   ├── ui/               # Design system and shared components
│   └── platform/         # Platform adapters (storage, etc.)
└── docs/                 # Specifications
```

---

## Canvas Tools

Boardkit includes native canvas drawing tools:

| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | `V` | Select, move, and resize elements |
| Hand | `H` | Pan the canvas |
| Rectangle | `R` | Draw rectangles |
| Ellipse | `O` | Draw ellipses |
| Line | `L` | Draw lines |
| Arrow | `A` | Draw arrows |
| Pencil | `P` | Freehand drawing |
| Text | `T` | Add text blocks |

### Element Styling

- Stroke color (preset palette)
- Fill color (none or solid)
- Stroke width (1-8px)
- Stroke dash (solid, dashed, dotted)
- Opacity (0-100%)
- Roughness (sketchy hand-drawn effect)

---

## Controls

### Canvas Navigation

| Action | Input |
|--------|-------|
| Pan | Scroll / Middle mouse + drag / Space + drag |
| Zoom | Cmd/Ctrl + Scroll |
| Reset view | Cmd/Ctrl + 0 |
| Zoom in | Cmd/Ctrl + Plus |
| Zoom out | Cmd/Ctrl + Minus |

### Widgets & Elements

| Action | Input |
|--------|-------|
| Select | Click |
| Multi-select | Shift + Click |
| Move | Drag (header for widgets) |
| Resize | Drag corner handle (when selected) |
| Delete | Delete / Backspace |
| Duplicate | Cmd/Ctrl + D |
| Nudge | Arrow keys (1px) / Shift + arrows (10px) |

### General

| Action | Input |
|--------|-------|
| Command Palette | Cmd/Ctrl + K |
| Deselect | Escape |
| Undo | Cmd/Ctrl + Z |
| Redo | Cmd/Ctrl + Shift + Z |

---

## Built-in Modules

### Text Module

Rich text editor with Markdown support.

- Tiptap-based editor
- Markdown syntax (headings, lists, bold, italic, code)
- Syntax highlighting for code blocks
- Smart typography

### Todo Module

Task list with completion tracking.

- Add/remove tasks
- Toggle completion
- Progress indicator
- **Data Provider**: Exposes `boardkit.todo.v1` contract

### Task Radar Module

Aggregate view of multiple todo lists.

- Connect to multiple Todo widgets
- Combined statistics
- Live updates
- **Data Consumer**: Reads from `boardkit.todo.v1`

### Focus Lens Module

Single-task focus view.

- Connect to one Todo widget
- Shows next actionable task
- Auto-updates when tasks change
- **Data Consumer**: Reads from `boardkit.todo.v1`

---

## Creating Modules

Modules are the building blocks of Boardkit. Each module represents a type of widget.

```typescript
import { defineModule } from '@boardkit/core'
import MyWidget from './MyWidget.vue'

interface MyState {
  value: string
}

export const MyModule = defineModule<MyState>({
  moduleId: 'my-module',
  version: '0.1.0',
  displayName: 'My Module',
  component: MyWidget,
  defaultState: () => ({ value: '' }),
  serialize: (state) => state,
  deserialize: (data) => data as MyState,
  minWidth: 200,
  minHeight: 100,
  defaultWidth: 300,
  defaultHeight: 200,
})
```

### Module Component

```vue
<script setup lang="ts">
import type { ModuleContext } from '@boardkit/core'
import type { MyState } from './types'

const props = defineProps<{
  context: ModuleContext<MyState>
}>()

// Read state
const value = computed(() => props.context.state.value)

// Update state
function updateValue(newValue: string) {
  props.context.updateState({ value: newValue })
}
</script>
```

### Module Rules

1. Modules must declare a stable `moduleId` and `version`
2. Modules must NOT access other modules' state directly
3. Modules must NOT implement their own drag/resize/frame UI
4. Modules must use the shared `WidgetFrame` component
5. All state must be serializable

### Registering Modules

Add your module to the registration file:

```typescript
// apps/web/src/modules/index.ts
import { moduleRegistry } from '@boardkit/core'
import { MyModule } from './my-module'

export function registerModules() {
  moduleRegistry.register(MyModule)
  // ... other modules
}
```

---

## Data Sharing Between Modules

Modules can share data through versioned contracts:

### As a Provider

```typescript
import { useDataProvider } from '@boardkit/core'
import { todoContract } from '@boardkit/core/contracts'

const { publishData } = useDataProvider(
  props.context.widgetId,
  todoContract
)

// Publish when state changes
watch(() => props.context.state, () => {
  publishData({
    widgetId: props.context.widgetId,
    title: state.title,
    items: state.items,
    progress: { done: completed, total: items.length }
  })
}, { deep: true, immediate: true })
```

### As a Consumer

```typescript
import { useDataConsumer } from '@boardkit/core'
import { todoContract } from '@boardkit/core/contracts'

const { connections, status } = useDataConsumer(
  props.context.widgetId,
  todoContract.id,
  { multiSelect: true }
)

// Access connected data
const allTodos = computed(() =>
  connections.value
    .filter(c => c.status === 'connected')
    .flatMap(c => c.data?.items ?? [])
)
```

---

## Design System

Boardkit uses a design system based on Tailwind CSS with CSS custom properties.

### Theme Support

- Light mode
- Dark mode
- System preference detection

### UI Components (`@boardkit/ui`)

**Basic Controls:**
- `BkButton` — Button with variants (default, destructive, outline, secondary, ghost)
- `BkIconButton` — Icon-only button
- `BkInput` — Text input
- `BkTextarea` — Multi-line text input
- `BkCheckbox` — Checkbox
- `BkToggle` — Toggle switch
- `BkSelect` — Dropdown select
- `BkSlider` — Range slider
- `BkColorPicker` — Color selection

**Layout:**
- `BkDropdown` — Dropdown menu
- `BkMenu` — Menu with sections
- `BkContextMenu` — Right-click context menu
- `BkModal` — Modal dialog
- `BkTooltip` — Tooltip
- `BkDivider` — Visual divider

**Specialized:**
- `WidgetFrame` — Widget container (handles drag, resize, selection)
- `BkCommandDialog` — Command palette
- `BkHistoryList` — Undo/redo history

### Component Playground

Visit `/playground` in the web app to see all UI components in action.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + TypeScript + Vite |
| Desktop | Tauri (macOS) |
| State | Pinia |
| Styling | Tailwind CSS |
| Editor | Tiptap |
| Drawing | rough.js + perfect-freehand |
| Storage (Web) | IndexedDB |
| Storage (Desktop) | Filesystem |
| Document | ZIP-based `.boardkit` format |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and data model |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [SPECS_V0.md](./SPECS_V0.md) | V0 feature specifications |
| [docs/SPECS_CANVAS_NATIVE.md](./docs/SPECS_CANVAS_NATIVE.md) | Canvas elements specification |
| [docs/SPECS_DATA_SHARING_POC.md](./docs/SPECS_DATA_SHARING_POC.md) | Data sharing system |
| [packages/ui/DESIGN_SYSTEM.md](./packages/ui/DESIGN_SYSTEM.md) | Design system guide |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup
- Code style guidelines
- How to create modules
- Pull request process

---

## License

MIT
