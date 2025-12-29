# Contributing to Boardkit

Thank you for your interest in contributing to Boardkit! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Creating a Module](#creating-a-module)
- [Pull Request Process](#pull-request-process)
- [Architecture Guidelines](#architecture-guidelines)

---

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming environment for all contributors.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8
- **Rust** (for desktop app development)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/boardkit.git
cd boardkit

# Install dependencies
pnpm install

# Start the web app in development mode
pnpm dev

# Or start the desktop app
pnpm desktop
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web app dev server |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm desktop` | Start Tauri desktop app |

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** following our code style guidelines

3. **Test your changes**:
   - Manual testing in web app (`pnpm dev`)
   - Run type checking (`pnpm typecheck`)
   - Run linting (`pnpm lint`)

4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add new widget module"
   ```

5. **Push and create a Pull Request**

---

## Project Structure

```
boardkit/
├── apps/
│   ├── web/                    # Web application
│   │   ├── src/
│   │   │   ├── components/     # Vue components
│   │   │   ├── composables/    # Vue composables
│   │   │   ├── modules/        # Widget modules
│   │   │   ├── pages/          # Route pages
│   │   │   └── utils/          # Utilities
│   │   └── ...
│   └── desktop/                # Tauri desktop app
│       ├── src/                # Vue frontend
│       └── src-tauri/          # Rust backend
│
├── packages/
│   ├── core/                   # Core business logic
│   │   ├── src/
│   │   │   ├── actions/        # Action definitions
│   │   │   ├── composables/    # Shared composables
│   │   │   ├── contracts/      # Data contracts
│   │   │   ├── data/           # Data sharing system
│   │   │   ├── migrations/     # Document migrations
│   │   │   ├── modules/        # Module SDK
│   │   │   ├── stores/         # Pinia stores
│   │   │   └── types/          # TypeScript types
│   │   └── ...
│   │
│   ├── ui/                     # Design system
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   └── composables/    # UI composables
│   │   └── DESIGN_SYSTEM.md    # Design documentation
│   │
│   └── platform/               # Platform adapters
│       └── src/
│           └── storage/        # Storage implementations
│
└── docs/                       # Specifications
```

### Package Responsibilities

| Package | Responsibility | Can depend on |
|---------|----------------|---------------|
| `@boardkit/core` | Business logic, stores, module SDK | None |
| `@boardkit/ui` | Design system, Vue components | `@boardkit/core` |
| `@boardkit/platform` | Storage adapters | `@boardkit/core` |
| `apps/web` | Web application | All packages |
| `apps/desktop` | Desktop application | All packages |

**Important**: `@boardkit/core` must NOT depend on platform-specific APIs.

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Export types explicitly
- Use meaningful variable names

```typescript
// Good
interface WidgetState {
  title: string
  items: TodoItem[]
}

// Avoid
type State = {
  t: string
  i: any[]
}
```

### Vue Components

- Use Composition API with `<script setup>`
- Use TypeScript for props and emits
- Keep components focused and small

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const displayTitle = computed(() => `${props.title} (${props.count})`)
</script>
```

### Styling

- Use UnoCSS utility classes
- Use design system tokens (see `packages/ui/DESIGN_SYSTEM.md`)
- Avoid inline styles except for dynamic values
- Use `@boardkit/ui` components when available

```vue
<!-- Good: Using design tokens -->
<button class="h-9 px-4 rounded-md bg-primary text-primary-foreground">
  Click me
</button>

<!-- Avoid: Hardcoded values -->
<button style="height: 36px; background: #3b82f6;">
  Click me
</button>
```

---

## Creating a Module

Modules are widget types that can be added to the canvas.

### 1. Create Module Directory

```
apps/web/src/modules/my-widget/
├── index.ts          # Module definition
├── types.ts          # TypeScript types
├── MyWidget.vue      # Vue component
└── (optional files)
```

### 2. Define Types

```typescript
// types.ts
export interface MyWidgetState {
  content: string
  settings: {
    showBorder: boolean
  }
}

export const defaultSettings = {
  showBorder: true
}
```

### 3. Create Component

```vue
<!-- MyWidget.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { MyWidgetState } from './types'

const props = defineProps<{
  context: ModuleContext<MyWidgetState>
}>()

const content = computed({
  get: () => props.context.state.content,
  set: (value) => props.context.updateState({ content: value })
})
</script>

<template>
  <div class="p-4">
    <textarea
      v-model="content"
      class="w-full h-full resize-none bg-transparent"
      placeholder="Enter content..."
    />
  </div>
</template>
```

### 4. Define Module

```typescript
// index.ts
import { defineModule } from '@boardkit/core'
import MyWidget from './MyWidget.vue'
import type { MyWidgetState } from './types'
import { defaultSettings } from './types'

export const MyWidgetModule = defineModule<MyWidgetState>({
  moduleId: 'my-widget',
  version: '0.1.0',
  displayName: 'My Widget',
  component: MyWidget,

  defaultState: () => ({
    content: '',
    settings: { ...defaultSettings }
  }),

  serialize: (state) => state,

  deserialize: (data) => ({
    content: '',
    settings: { ...defaultSettings },
    ...(data as Partial<MyWidgetState>)
  }),

  minWidth: 200,
  minHeight: 100,
  defaultWidth: 300,
  defaultHeight: 200,
})
```

### 5. Register Module

```typescript
// apps/web/src/modules/index.ts
import { moduleRegistry } from '@boardkit/core'
import { MyWidgetModule } from './my-widget'

export function registerModules() {
  moduleRegistry.register(MyWidgetModule)
  // ... other modules
}
```

### Module Rules

1. **Isolation**: Never access other modules' state directly
2. **Serialization**: All state must be JSON-serializable
3. **No custom frames**: Use the provided `WidgetFrame`
4. **Design system**: Use `@boardkit/ui` components
5. **Stable IDs**: `moduleId` must never change after release

---

## Pull Request Process

### Before Submitting

1. Ensure your code follows the style guidelines
2. Run `pnpm typecheck` with no errors
3. Run `pnpm lint` with no errors
4. Test manually in the web app
5. Update documentation if needed

### PR Title Format

Use conventional commits format:

- `feat: add new feature`
- `fix: resolve bug in X`
- `docs: update README`
- `refactor: restructure module system`
- `style: format code`
- `chore: update dependencies`

### PR Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (for UI changes)

### Review Process

1. PRs require at least one review
2. Address review comments
3. Keep PRs focused and small when possible
4. Squash commits before merging

---

## Architecture Guidelines

### Core Principles

1. **Offline-first**: All features must work without network
2. **File-based**: Documents are portable `.boardkit` files
3. **Modular**: Modules are isolated and self-contained
4. **Action-first**: User operations go through ActionRegistry
5. **Design system**: All UI uses `@boardkit/ui`

### Do's

- Use the ActionRegistry for user operations
- Use stores (`boardStore`, `toolStore`) for state
- Follow the module isolation rules
- Use design tokens from the design system
- Keep core logic platform-agnostic

### Don'ts

- Don't access other modules' state directly
- Don't implement custom drag/resize logic
- Don't bypass the design system
- Don't add platform-specific code to `@boardkit/core`
- Don't add features outside V0 scope without discussion

### Adding Actions

```typescript
// In packages/core/src/actions/myActions.ts
import { actionRegistry } from './ActionRegistry'

actionRegistry.register({
  id: 'my-feature.do-something',
  title: 'Do Something',
  group: 'board',
  contexts: ['global'],
  icon: 'wand',
  shortcutHint: '⌘S',
  when: (ctx) => ctx.selectedWidget !== null,
  run: async (ctx) => {
    // Implementation
  }
})
```

---

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Look at similar implementations in the codebase
3. Open an issue for discussion

Thank you for contributing to Boardkit!
