# Boardkit

An open-source, offline-first, modular whiteboard toolkit.

## Features

- **Offline-first**: Works without an internet connection
- **Modular**: Add and create custom widget modules
- **Cross-platform**: Web and macOS desktop (via Tauri)
- **Portable**: `.boardkit` document format

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

## Project Structure

```
boardkit/
├── apps/
│   ├── web/          # Web application (Vue 3 + Vite)
│   └── desktop/      # Desktop application (Tauri)
├── packages/
│   ├── core/         # Core logic, stores, module SDK
│   ├── ui/           # Design system and shared components
│   └── platform/     # Platform adapters (storage, etc.)
└── docs/
```

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
})
```

### Module Rules

1. Modules must declare a stable `moduleId` and `version`
2. Modules must NOT access other modules' state
3. Modules must NOT implement their own drag/resize/frame UI
4. Modules must use the shared `WidgetFrame` component

## Built-in Modules

### Text Module
Simple text editing widget.

### To-Do Module
Task list with checkboxes.

## Design System

Boardkit uses a design system based on Tailwind CSS with CSS custom properties for theming.

### Theme Support

- Light mode
- Dark mode
- System preference detection

### Components

- `BkButton` - Button component
- `BkIconButton` - Icon-only button
- `BkInput` - Text input
- `BkTextarea` - Multi-line text input
- `BkCheckbox` - Checkbox
- `BkDropdown` - Dropdown menu
- `BkModal` - Modal dialog
- `BkTooltip` - Tooltip
- `BkDivider` - Visual divider
- `WidgetFrame` - Widget container (handles drag, resize, selection)

## Controls

### Canvas Navigation

- **Scroll**: Pan the canvas
- **Ctrl/Cmd + Scroll**: Zoom in/out
- **Middle Mouse Button**: Pan

### Widgets

- **Click**: Select widget
- **Drag header**: Move widget
- **Drag corner**: Resize widget (when selected)

## Technology Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Desktop**: Tauri
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (web), Filesystem (desktop)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT
