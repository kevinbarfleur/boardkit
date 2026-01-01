# Plugin Development Guide

This guide covers how to create external plugins for Boardkit. Plugins are distributed separately from the core application and can be installed by users from GitHub.

> **Note**: This guide is for external plugins. For core modules bundled with Boardkit, see [MODULE_DEVELOPMENT.md](./MODULE_DEVELOPMENT.md).

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Plugin Structure](#plugin-structure)
3. [manifest.json Reference](#manifestjson-reference)
4. [definePlugin() Reference](#defineplugin-reference)
5. [Data Sharing](#data-sharing)
6. [Configuration vs Settings](#configuration-vs-settings)
7. [Build System](#build-system)
8. [Publishing Your Plugin](#publishing-your-plugin)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start (5 minutes)

The fastest way to create a plugin is to use the scaffolding script:

```bash
# Clone the official plugins repo
git clone https://github.com/kevinbarfleur/boardkit-official-plugins.git
cd boardkit-official-plugins

# Install dependencies
pnpm install

# Create a new plugin
node scripts/create-plugin.js my-plugin "My Plugin" "A description of what it does"

# Build your plugin
node scripts/build-plugin.js my-plugin
```

This generates a complete plugin structure at `plugins/my-plugin/` with all required files.

### Testing Your Plugin

1. Start Boardkit (web or desktop)
2. Go to **Settings → Plugins → Add from GitHub**
3. Enter the path to your local plugin (or push to GitHub first)
4. Click Install

---

## Plugin Structure

A Boardkit plugin has the following structure:

```
my-plugin/
├── manifest.json           # Required: Plugin metadata
├── main.js                 # Generated: Compiled bundle
├── src/
│   ├── index.ts           # Required: Plugin definition
│   ├── types.ts           # Recommended: State interface
│   └── MyPluginWidget.vue # Required: Widget component
└── README.md              # Recommended: Documentation
```

### Minimal Example

Here's the simplest possible plugin (see `plugins/hello-world/` for a working example):

**manifest.json**:
```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "minBoardkitVersion": "0.1.0",
  "author": "Your Name",
  "description": "What your plugin does"
}
```

**src/types.ts**:
```typescript
export interface MyPluginState {
  count: number
}

export const defaultState: MyPluginState = {
  count: 0,
}
```

**src/index.ts**:
```typescript
import { definePlugin } from '@boardkit/plugin-api'
import MyPluginWidget from './MyPluginWidget.vue'
import type { MyPluginState } from './types'
import { defaultState } from './types'

export default definePlugin<MyPluginState>({
  pluginId: 'my-plugin',        // Must match manifest.json "id"
  version: '0.1.0',             // Must match manifest.json "version"
  displayName: 'My Plugin',
  icon: 'box',                  // Lucide icon name
  component: MyPluginWidget,
  defaultState: () => ({ ...defaultState }),
  serialize: (state) => state,
  deserialize: (data) => ({ ...defaultState, ...(data as Partial<MyPluginState>) }),
})
```

**src/MyPluginWidget.vue**:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/plugin-api'
import type { MyPluginState } from './types'

const props = defineProps<{
  context: ModuleContext<MyPluginState>
}>()

const count = computed(() => props.context.state.count)

function increment() {
  props.context.updateState({
    count: props.context.state.count + 1,
  })
}
</script>

<template>
  <div class="my-plugin">
    <p>Count: {{ count }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

---

## manifest.json Reference

The manifest file contains metadata about your plugin.

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (kebab-case, e.g., `my-plugin`) |
| `name` | Yes | Human-readable name |
| `version` | Yes | Semantic version (e.g., `1.0.0`) |
| `minBoardkitVersion` | Yes | Minimum Boardkit version required |
| `author` | Yes | Your name or organization |
| `description` | Yes | Short description of what the plugin does |
| `authorUrl` | No | Link to your website or GitHub profile |
| `repository` | No | GitHub repository URL |
| `icon` | No | Lucide icon name (default: `box`) |
| `isDesktopOnly` | No | Set to `true` if plugin requires desktop features |
| `provides` | No | Array of data contract IDs this plugin provides |
| `consumes` | No | Array of data contract IDs this plugin consumes |
| `hasStyles` | No | Set to `true` if you have a `styles.css` file |

### Example

```json
{
  "$schema": "../../schemas/manifest.schema.json",
  "id": "pomodoro-timer",
  "name": "Pomodoro Timer",
  "version": "1.0.0",
  "minBoardkitVersion": "0.1.0",
  "author": "Jane Doe",
  "authorUrl": "https://github.com/janedoe",
  "description": "A productivity timer using the Pomodoro technique",
  "repository": "https://github.com/janedoe/boardkit-pomodoro",
  "icon": "timer",
  "provides": ["boardkit.pomodoro.sessions.v1"],
  "consumes": ["boardkit.todo.v1"]
}
```

### Icon Names

Icons must be valid [Lucide](https://lucide.dev/icons) icon names in kebab-case:
- ✅ `calendar-check`
- ✅ `list-todo`
- ❌ `CalendarCheck` (wrong case)
- ❌ `my-custom-icon` (doesn't exist)

---

## definePlugin() Reference

The `definePlugin()` function registers your plugin with Boardkit.

```typescript
import { definePlugin } from '@boardkit/plugin-api'

export default definePlugin<MyState>({
  // Required
  pluginId: string,           // Must match manifest.json "id"
  version: string,            // Must match manifest.json "version"
  displayName: string,        // Shown in the UI
  component: Component,       // Vue component
  defaultState: () => State,  // Factory function
  serialize: (state) => any,  // Convert state to JSON
  deserialize: (data) => State, // Restore state from JSON

  // Optional - Display
  icon?: string,              // Lucide icon name (default: 'box')
  minWidth?: number,          // Minimum widget width (default: 100)
  minHeight?: number,         // Minimum widget height (default: 100)
  defaultWidth?: number,      // Default widget width (default: 200)
  defaultHeight?: number,     // Default widget height (default: 200)

  // Optional - Data sharing
  provides?: DataContract[],  // Data this plugin exposes
  consumes?: ConsumerConfig[], // Data this plugin needs

  // Optional - Configuration
  configurationSchema?: ConfigurationSchema,  // Required setup
  settingsSchema?: SettingsSchema,            // User preferences
  configurationComponents?: Record<string, Component>, // Custom UI

  // Optional - Lifecycle hooks
  onInstall?: () => Promise<void> | void,     // First installation
  onEnable?: () => void,                      // Plugin enabled
  onDisable?: () => void,                     // Plugin disabled
  onUninstall?: () => Promise<void> | void,   // Plugin removed
  onUpdate?: (previousVersion: string) => Promise<void> | void,
})
```

### Lifecycle Hooks

| Hook | When Called | Use Case |
|------|-------------|----------|
| `onInstall` | First time the plugin is installed | Initialize data, show welcome message |
| `onEnable` | Plugin is enabled (including on app start) | Start background tasks |
| `onDisable` | Plugin is disabled | Stop background tasks, cleanup |
| `onUninstall` | Plugin is being removed | Clean up stored data |
| `onUpdate` | Plugin version changed | Migrate data from older versions |

### State Management

```typescript
// In your widget component
const props = defineProps<{
  context: ModuleContext<MyState>
}>()

// Read state (reactive)
const count = computed(() => props.context.state.count)

// Update state (triggers autosave)
props.context.updateState({
  count: props.context.state.count + 1,
})

// Update with history label (for undo/redo)
props.context.updateState(
  { count: 0 },
  { historyLabel: 'Reset counter' }
)
```

---

## Data Sharing

Plugins can share data with each other using data contracts.

### Providing Data

```typescript
import { definePlugin, useProvideData, todoContractV1 } from '@boardkit/plugin-api'

// In definePlugin:
provides: [todoContractV1],

// In your widget:
useProvideData(props.context, todoContractV1, {
  project: (state) => ({
    items: state.items.map(item => ({
      id: item.id,
      label: item.text,
      completed: item.done,
    })),
  }),
})
```

### Consuming Data

```typescript
import { useConsumeData, todoContractV1 } from '@boardkit/plugin-api'

// Single provider
const { status, data, connect, disconnect } = useConsumeData(
  props.context,
  todoContractV1
)

// Multiple providers
const { connections, allData } = useConsumeData(
  props.context,
  todoContractV1,
  { multi: true, stateKey: 'connectedProviders' }
)
```

### Available Contracts

| Contract | Data Type | Description |
|----------|-----------|-------------|
| `todoContractV1` | `{ items: TodoItem[] }` | Task lists |
| `counterContractV1` | `{ value: number }` | Counter values |
| `timerStatusContractV1` | `{ isRunning, remaining, ... }` | Timer state |
| `timerHistoryContractV1` | `{ sessions: TimerSession[] }` | Timer history |
| `habitsContractV1` | `{ habits: Habit[] }` | Habit data |
| `habitsStatsContractV1` | `{ completedToday, streak, ... }` | Habit stats |
| `kanbanContractV1` | `{ columns: Column[] }` | Kanban boards |
| `kanbanStatsContractV1` | `{ totalCards, completedCards, ... }` | Kanban stats |

---

## Configuration vs Settings

**Configuration** = Required setup before the widget works (e.g., API key, data source)
**Settings** = Optional preferences (e.g., theme, refresh interval)

```typescript
// Configuration: Widget shows "Setup required" until configured
configurationSchema: {
  isConfigured: (state) => !!state.apiKey,
  setupMessage: 'Enter your API key to get started',
  setupIcon: 'key',
  sections: [
    {
      type: 'field',
      title: 'API Key',
      icon: 'key',
      field: {
        type: 'secret',
        key: 'apiKey',
        label: 'API Key',
        placeholder: 'Enter your API key',
      },
    },
  ],
}

// Settings: Optional preferences in the settings panel
settingsSchema: {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          type: 'toggle',
          key: 'showLabels',
          label: 'Show labels',
        },
        {
          type: 'slider',
          key: 'refreshInterval',
          label: 'Refresh interval',
          min: 60,
          max: 3600,
          step: 60,
        },
      ],
    },
  ],
}
```

See [MODULE_DEVELOPMENT.md](./MODULE_DEVELOPMENT.md#field-types) for all available field types.

---

## Build System

Boardkit plugins are compiled to IIFE (Immediately Invoked Function Expression) format for browser compatibility.

### Why IIFE?

- Works in all browsers without ES module support
- No import/export at runtime
- Dependencies are injected via `window.__BOARDKIT__`
- Single file output (`main.js`)

### How It Works

1. Your plugin code imports from `@boardkit/plugin-api`
2. The build script marks these as external dependencies
3. At runtime, imports are resolved from `window.__BOARDKIT__`
4. Your plugin auto-registers when loaded

### Building

```bash
# Build a single plugin
node scripts/build-plugin.js my-plugin

# Build all plugins
node scripts/build-all.js
```

### Adding Dependencies

If your plugin needs an npm package:

1. Add it to `package.json` in the plugins repo root
2. Import it normally in your code
3. It will be bundled into `main.js`

```bash
pnpm add lodash-es
```

```typescript
import { debounce } from 'lodash-es'
// This gets bundled into your plugin
```

### Custom Styles

If your plugin needs custom CSS:

1. Create `styles.css` in your plugin folder
2. Set `"hasStyles": true` in `manifest.json`
3. Use scoped styles in Vue components when possible

---

## Publishing Your Plugin

### Option 1: Standalone Repository

```
github.com/yourname/boardkit-plugin-name/
├── manifest.json
├── main.js
├── src/
└── README.md
```

**Installation URL**: `github.com/yourname/boardkit-plugin-name`

### Option 2: Monorepo

```
github.com/yourname/boardkit-plugins/
├── plugins/
│   ├── plugin-a/
│   │   ├── manifest.json
│   │   └── main.js
│   └── plugin-b/
│       ├── manifest.json
│       └── main.js
└── README.md
```

**Installation URLs**:
- `github.com/yourname/boardkit-plugins/plugins/plugin-a`
- `github.com/yourname/boardkit-plugins/plugins/plugin-b`

### Versioning

Use semantic versioning and match `manifest.json` and `definePlugin()` versions:

```json
{ "version": "1.0.0" }
```

```typescript
definePlugin({ version: '1.0.0' })
```

**Version format**: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

---

## Troubleshooting

### Plugin doesn't appear after installation

1. Check browser console for errors
2. Verify `manifest.json` has valid JSON
3. Ensure `pluginId` matches `manifest.json` `id`
4. Ensure `version` matches in both places

### "Plugin registration timeout"

The plugin didn't call `registerPlugin()` within 5 seconds. This usually means:
- Build error (check `main.js` exists)
- Export error (must use `export default definePlugin(...)`)
- Runtime error in your code (check console)

### "Invalid manifest" errors

| Error | Fix |
|-------|-----|
| Missing required field "X" | Add the field to manifest.json |
| Invalid plugin ID format | Use kebab-case (e.g., `my-plugin`) |
| Invalid version format | Use semver (e.g., `1.0.0`) |
| Incompatible version | Update `minBoardkitVersion` |

### Icon doesn't show

1. Verify icon name exists at [lucide.dev/icons](https://lucide.dev/icons)
2. Use kebab-case (e.g., `calendar-check`, not `CalendarCheck`)
3. Check for typos

### State not persisting

1. Ensure `serialize` returns JSON-serializable data
2. Check `deserialize` handles missing fields with defaults
3. Don't store non-serializable data (functions, DOM elements)

### TypeScript errors

Make sure you're importing types correctly:

```typescript
// Correct
import type { ModuleContext } from '@boardkit/plugin-api'

// Also correct
import { type ModuleContext, definePlugin } from '@boardkit/plugin-api'
```

---

## Examples

| Plugin | Complexity | Demonstrates |
|--------|------------|--------------|
| `hello-world` | Minimal | Basic structure, state management |
| `habit-tracker` | Medium | Data contracts (provides), settings |
| `stats-card` | Advanced | Multiple data sources (consumes), custom config |
| `google-calendar` | Advanced | Custom configuration components, async data |

Browse the [official plugins](https://github.com/kevinbarfleur/boardkit-official-plugins) for working examples.
