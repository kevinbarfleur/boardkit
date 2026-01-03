# Plugin Development Guide

This guide covers how to create external plugins for Boardkit. Plugins are distributed separately from the core application and can be installed by users from GitHub.

> **Note**: This guide is for external plugins. For core modules bundled with Boardkit, see [MODULE_DEVELOPMENT.md](./MODULE_DEVELOPMENT.md).

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Plugin Structure](#plugin-structure)
3. [Imports & Dependencies](#imports--dependencies)
4. [manifest.json Reference](#manifestjson-reference)
5. [definePlugin() Reference](#defineplugin-reference)
6. [Vue Reactivity Patterns](#vue-reactivity-patterns)
7. [Data Sharing](#data-sharing)
8. [Configuration vs Settings](#configuration-vs-settings)
9. [Custom Configuration Components](#custom-configuration-components)
10. [Async Operations & Toasts](#async-operations--toasts)
11. [Modal & Full-Screen Alerts](#modal--full-screen-alerts)
12. [Build System](#build-system)
13. [Publishing Your Plugin](#publishing-your-plugin)
14. [Complete Example: Google Calendar](#complete-example-google-calendar)
15. [Troubleshooting](#troubleshooting)

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
│   ├── index.ts           # Required: Plugin definition with export default
│   ├── types.ts           # Recommended: State and settings interfaces
│   ├── MyPluginWidget.vue # Required: Main widget component
│   └── components/        # Optional: Sub-components
│       ├── index.ts
│       └── *.vue
└── README.md              # Recommended: Documentation
```

### Minimal Example

Here's the simplest possible plugin:

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
  count: number;
}

export const defaultState: MyPluginState = {
  count: 0,
};
```

**src/index.ts**:

```typescript
import { definePlugin } from "@boardkit/plugin-api";
import MyPluginWidget from "./MyPluginWidget.vue";
import type { MyPluginState } from "./types";
import { defaultState } from "./types";

// IMPORTANT: Must use "export default"
export default definePlugin<MyPluginState>({
  pluginId: "my-plugin", // Must match manifest.json "id"
  version: "0.1.0", // Must match manifest.json "version"
  displayName: "My Plugin",
  icon: "box", // Lucide icon name
  component: MyPluginWidget,
  defaultState: () => ({ ...defaultState }),
  serialize: (state) => state,
  deserialize: (data) => ({
    ...defaultState,
    ...(data as Partial<MyPluginState>),
  }),
});
```

**src/MyPluginWidget.vue**:

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { ModuleContext } from "@boardkit/plugin-api";
import type { MyPluginState } from "./types";

const props = defineProps<{
  context: ModuleContext<MyPluginState>;
}>();

// IMPORTANT: Always use computed() for reactivity
const count = computed(() => props.context.state.count);

function increment() {
  props.context.updateState(
    { count: props.context.state.count + 1 },
    { captureHistory: true, historyLabel: "Incremented counter" }
  );
}
</script>

<template>
  <div class="my-plugin p-4">
    <p class="text-lg">Count: {{ count }}</p>
    <button
      class="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded"
      @click="increment"
    >
      +1
    </button>
  </div>
</template>
```

---

## Imports & Dependencies

### What to Import From Where

Plugins have access to three packages at runtime:

| Package                | Import From   | Contains                                           |
| ---------------------- | ------------- | -------------------------------------------------- |
| `@boardkit/plugin-api` | Plugin API    | `definePlugin`, types, data contracts, composables |
| `@boardkit/ui`         | UI Components | `BkIcon`, `BkButton`, `useToast`, `useModal`, etc. |
| `vue`                  | Vue           | `ref`, `computed`, `watch`, `onMounted`, etc.      |

```typescript
// ✅ CORRECT - Import from plugin-api
import {
  definePlugin,
  useProvideData,
  todoContractV1,
} from "@boardkit/plugin-api";
import type {
  ModuleContext,
  ConfigurationSchema,
  SettingsSchema,
} from "@boardkit/plugin-api";

// ✅ CORRECT - Import UI components
import {
  BkIcon,
  BkButton,
  BkFullScreenAlert,
  useToast,
  useModal,
} from "@boardkit/ui";

// ✅ CORRECT - Import Vue
import { computed, ref, watch, onMounted, onUnmounted } from "vue";

// ❌ WRONG - Never import directly from @boardkit/core in plugins
import { defineModule } from "@boardkit/core"; // DON'T DO THIS
```

### Available from @boardkit/plugin-api

**Types:**

- `ModuleContext<TState>` - Widget context interface
- `DataContract<T>` - Data sharing contract
- `ConsumerConfig` - Consumer configuration
- `ConfigurationSchema` - Required setup schema
- `SettingsSchema`, `SettingsSection`, `SettingsField` - Settings definitions
- `ConnectionStatus` - Data connection status

**Composables:**

- `useProvideData()` - Expose data to other widgets
- `useConsumeData()` - Consume data from other widgets

**Data Contracts:**

- `todoContractV1`, `PublicTodoList`
- `counterContractV1`, `PublicCounter`
- `timerStatusContractV1`, `timerHistoryContractV1`
- `habitsContractV1`, `habitsStatsContractV1`
- `kanbanContractV1`, `kanbanStatsContractV1`

**Utilities:**

- `truncate(text, maxLength)` - Truncate text with ellipsis
- `actionRegistry` - Register custom actions

### Available from @boardkit/ui

**Components:**

- `BkIcon` - Lucide icon component
- `BkButton` - Button component
- `BkFullScreenAlert` - Full-screen modal for alerts

**Composables:**

- `useToast()` - Toast notifications
- `useModal()` - Dynamic modals and confirmations

---

## manifest.json Reference

The manifest file contains metadata about your plugin.

| Field                | Required | Description                                       |
| -------------------- | -------- | ------------------------------------------------- |
| `id`                 | Yes      | Unique identifier (kebab-case, e.g., `my-plugin`) |
| `name`               | Yes      | Human-readable name                               |
| `version`            | Yes      | Semantic version (e.g., `1.0.0`)                  |
| `minBoardkitVersion` | Yes      | Minimum Boardkit version required                 |
| `author`             | Yes      | Your name or organization                         |
| `description`        | Yes      | Short description of what the plugin does         |
| `authorUrl`          | No       | Link to your website or GitHub profile            |
| `repository`         | No       | GitHub repository URL                             |
| `icon`               | No       | Lucide icon name (default: `box`)                 |
| `isDesktopOnly`      | No       | Set to `true` if plugin requires desktop features |
| `provides`           | No       | Array of data contract IDs this plugin provides   |
| `consumes`           | No       | Array of data contract IDs this plugin consumes   |
| `hasStyles`          | No       | Set to `true` if you have a `styles.css` file     |

### Complete Example

```json
{
  "id": "google-calendar",
  "name": "Google Calendar",
  "version": "0.1.0",
  "minBoardkitVersion": "0.1.0",
  "author": "Boardkit Team",
  "authorUrl": "https://github.com/kevinbarfleur",
  "description": "Display events from Google Calendar with meeting reminders.",
  "repository": "https://github.com/kevinbarfleur/boardkit-official-plugins",
  "icon": "calendar",
  "isDesktopOnly": false,
  "provides": [],
  "consumes": []
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
import type { ConfigurationSchema, SettingsSchema, DataContract, ConsumerConfig } from '@boardkit/plugin-api'

export default definePlugin<MyState>({
  // ===== REQUIRED =====
  pluginId: string,                    // Must match manifest.json "id"
  version: string,                     // Must match manifest.json "version"
  displayName: string,                 // Shown in the UI
  component: Component,                // Vue component
  defaultState: () => State,           // Factory function returning initial state
  serialize: (state) => any,           // Convert state to JSON for persistence
  deserialize: (data) => State,        // Restore state from JSON

  // ===== OPTIONAL - Display =====
  icon?: string,                       // Lucide icon name (default: 'box')
  minWidth?: number,                   // Minimum widget width (default: 100)
  minHeight?: number,                  // Minimum widget height (default: 100)
  defaultWidth?: number,               // Default widget width (default: 200)
  defaultHeight?: number,              // Default widget height (default: 200)

  // ===== OPTIONAL - Data Sharing =====
  provides?: DataContract[],           // Data contracts this plugin exposes
  consumes?: ConsumerConfig[],         // Data contracts this plugin needs

  // ===== OPTIONAL - Configuration =====
  configurationSchema?: ConfigurationSchema,           // Required setup
  settingsSchema?: SettingsSchema,                     // User preferences
  configurationComponents?: Record<string, Component>, // Custom config UI

  // ===== OPTIONAL - Lifecycle Hooks =====
  onInstall?: () => Promise<void> | void,
  onEnable?: () => void,
  onDisable?: () => void,
  onUninstall?: () => Promise<void> | void,
  onUpdate?: (previousVersion: string) => Promise<void> | void,
})
```

### Lifecycle Hooks

| Hook          | When Called                                | Use Case                              |
| ------------- | ------------------------------------------ | ------------------------------------- |
| `onInstall`   | First time the plugin is installed         | Initialize data, show welcome message |
| `onEnable`    | Plugin is enabled (including on app start) | Start background tasks                |
| `onDisable`   | Plugin is disabled                         | Stop background tasks, cleanup        |
| `onUninstall` | Plugin is being removed                    | Clean up stored data                  |
| `onUpdate`    | Plugin version changed                     | Migrate data from older versions      |

### ModuleContext API

The `context` prop passed to your widget component:

```typescript
interface ModuleContext<TState> {
  widgetId: string; // Unique widget instance ID
  moduleId: string; // Your plugin ID
  state: TState; // Current state (reactive)
  isSelected: boolean; // Whether widget is selected

  updateState: (partial: Partial<TState>, options?: HistoryOptions) => void;

  setState: (state: TState, options?: HistoryOptions) => void;
}

interface HistoryOptions {
  captureHistory?: boolean; // Enable undo/redo for this action
  historyLabel?: string; // Label shown in history panel
  debounceMs?: number; // Debounce for frequent updates
}
```

---

## Vue Reactivity Patterns

### Critical: Always Use `computed()` for State Access

```typescript
// ✅ CORRECT - Reactive, updates when state changes
const items = computed(() => props.context.state.items || []);
const title = computed(() => props.context.state.title || "");

// ❌ WRONG - Loses reactivity, will NOT update
const { items, title } = props.context.state; // DON'T destructure!
const items = props.context.state.items; // Only evaluated once
```

### Settings Pattern with Defaults

```typescript
import type { MyPluginSettings } from "./types";
import { defaultSettings } from "./types";

// Create a computed settings object with defaults
const settings = computed<MyPluginSettings>(() => ({
  showTomorrow:
    props.context.state.showTomorrow ?? defaultSettings.showTomorrow,
  showAllDay: props.context.state.showAllDay ?? defaultSettings.showAllDay,
  timeFormat: props.context.state.timeFormat ?? defaultSettings.timeFormat,
  maxEvents: props.context.state.maxEvents ?? defaultSettings.maxEvents,
}));
```

### Watch for State Changes

```typescript
import { watch } from "vue";

// React to configuration changes
watch(
  () => props.context.state.accessToken,
  (newToken) => {
    if (newToken && !hasEvents.value) {
      handleRefresh();
    }
  },
  { immediate: true }
);
```

### State Updates with History

```typescript
import { truncate } from "@boardkit/plugin-api";

// Simple update (no history)
props.context.updateState({ count: 5 });

// User action with history (enables undo/redo)
props.context.updateState(
  { items: [...items.value, newItem] },
  {
    captureHistory: true,
    historyLabel: `Added: ${truncate(newItem.title, 25)}`,
  }
);

// Text input with debounce (avoids many history entries)
props.context.updateState(
  { title: newTitle },
  { captureHistory: true, historyLabel: "Updated title", debounceMs: 1000 }
);
```

---

## Data Sharing

Plugins can share data with each other using data contracts.

### Providing Data

```typescript
import { useProvideData, todoContractV1 } from "@boardkit/plugin-api";
import type { PublicTodoList } from "@boardkit/plugin-api";

// In definePlugin:
export default definePlugin({
  // ...
  provides: [todoContractV1],
});

// In your widget component:
useProvideData(props.context, todoContractV1, {
  project: (state): PublicTodoList => ({
    widgetId: props.context.widgetId,
    title: state.title || "",
    progress: {
      done: state.items.filter((i) => i.completed).length,
      total: state.items.length,
    },
    items: state.items.map(({ id, label, completed }) => ({
      id,
      label,
      completed,
    })),
  }),
});
```

### Consuming Data (Single Provider)

```typescript
import { useConsumeData, todoContractV1 } from "@boardkit/plugin-api";

const {
  status, // ComputedRef<'connected' | 'disconnected' | 'broken' | 'pending'>
  data, // Ref<PublicTodoList | null>
  lastUpdated, // Ref<number | null>
  availableProviders, // ComputedRef<Array<{ id: string; moduleId: string }>>
  connect, // (providerId: string) => boolean
  disconnect, // () => boolean
  refresh, // () => void
} = useConsumeData(props.context, todoContractV1);
```

### Consuming Data (Multiple Providers)

```typescript
const {
  connections, // ComputedRef<Map<string, DataConnection<T>>>
  allData, // ComputedRef<T[]> - flattened array
  connect, // (providerId: string) => boolean
  disconnect, // (providerId: string) => boolean
  disconnectAll, // () => void
  isConnected, // (providerId: string) => boolean
} = useConsumeData(props.context, todoContractV1, {
  multi: true,
  stateKey: "connectedProviders",
});
```

### Available Data Contracts

| Contract                 | Public Type          | Description                        |
| ------------------------ | -------------------- | ---------------------------------- |
| `todoContractV1`         | `PublicTodoList`     | Todo lists with items and progress |
| `counterContractV1`      | `PublicCounter`      | Counter values                     |
| `timerStatusContractV1`  | `PublicTimerStatus`  | Timer running state                |
| `timerHistoryContractV1` | `PublicTimerHistory` | Timer session history              |
| `habitsContractV1`       | `PublicHabitList`    | Habit definitions                  |
| `habitsStatsContractV1`  | `PublicHabitStats`   | Habit completion stats             |
| `kanbanContractV1`       | `PublicKanbanBoard`  | Kanban columns and cards           |
| `kanbanStatsContractV1`  | `PublicKanbanStats`  | Kanban completion stats            |

---

## Configuration vs Settings

**Configuration** = Required setup before the widget works
**Settings** = Optional preferences for customization

### Configuration Schema

```typescript
import type { ConfigurationSchema } from "@boardkit/plugin-api";
import GoogleCalendarSetup from "./components/GoogleCalendarSetup.vue";

const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => {
    const s = state as CalendarState;
    return !!s.accessToken;
  },
  setupMessage: "Connect your Google Calendar to see your upcoming events",
  setupIcon: "calendar",
  sections: [
    {
      type: "custom",
      title: "Connect Calendar",
      icon: "calendar",
      component: "GoogleCalendarSetup", // Must match key in configurationComponents
      description: "Connect your Google account or use demo mode.",
    },
  ],
};

export default definePlugin({
  // ...
  configurationSchema,
  configurationComponents: {
    GoogleCalendarSetup: GoogleCalendarSetup, // Register the component
  },
});
```

### Settings Schema

```typescript
import type { SettingsSchema } from "@boardkit/plugin-api";

const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: "display",
      title: "Display",
      icon: "eye",
      fields: [
        {
          type: "toggle",
          key: "showTomorrow",
          label: "Show tomorrow",
          hint: "Also display tomorrow's events",
        },
        {
          type: "toggle",
          key: "showAllDay",
          label: "All-day events",
          hint: "Show all-day events in the list",
        },
        {
          type: "button-group",
          key: "timeFormat",
          label: "Time format",
          options: [
            { value: "12h", label: "12h" },
            { value: "24h", label: "24h" },
          ],
        },
        {
          type: "slider",
          key: "maxEvents",
          label: "Max events",
          min: 3,
          max: 20,
          step: 1,
          showValue: true,
          hint: "Maximum number of events to display per day",
        },
      ],
    },
  ],
};
```

See [MODULE_DEVELOPMENT.md](./MODULE_DEVELOPMENT.md#field-types-reference) for all available field types.

---

## Custom Configuration Components

For complex configuration needs, create a custom Vue component.

### Component Contract

```vue
<script setup lang="ts">
import { BkButton, BkIcon } from "@boardkit/ui";
import type { ModuleContext } from "@boardkit/plugin-api";
import type { MyPluginState } from "../types";

interface Props {
  context?: ModuleContext<MyPluginState>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [key: string, value: unknown];
}>();

const handleConnect = () => {
  // Emit updates for each state property
  emit("update", "accessToken", "my-token");
  emit("update", "userEmail", "user@example.com");
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="p-4 rounded-lg border border-border bg-muted/30">
      <BkButton class="w-full" @click="handleConnect">
        <BkIcon icon="plug" :size="14" class="mr-2" />
        Connect Account
      </BkButton>
    </div>
  </div>
</template>
```

---

## Async Operations & Toasts

### useAsyncOperation Pattern

```typescript
import { useAsyncOperation } from "@boardkit/core";
import { useToast } from "@boardkit/ui";

const { success, error: showError } = useToast();

const { data, isLoading, error, isSuccess, execute } = useAsyncOperation<
  CalendarEvent[]
>({
  onSuccess: (events) => {
    props.context.updateState({
      events,
      lastSync: Date.now(),
      syncError: null,
    });
    success("Calendar synced");
  },
  onError: (err) => {
    props.context.updateState({ syncError: err.message });
    showError("Failed to sync calendar");
  },
});

const handleRefresh = async () => {
  await execute(async () => {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("API error");
    return response.json();
  });
};
```

### Toast Notifications

```typescript
import { useToast } from "@boardkit/ui";

const { success, error, info, warning } = useToast();

// Basic usage
success("Changes saved");
error("Failed to save");
info("New items available");
warning("Connection unstable");

// With title
success("Calendar synced", {
  title: "Sync complete",
});

// With action
success("Meeting reminder set", {
  action: {
    label: "View",
    onClick: () => openMeetingDetails(),
  },
});
```

---

## Modal & Full-Screen Alerts

### Dynamic Forms with useModal

```typescript
import { useModal } from "@boardkit/ui";
import type { SettingsField } from "@boardkit/plugin-api";

const { openModal, confirm } = useModal();

// Open a form modal
async function openAddEventModal() {
  const result = await openModal<{
    title: string;
    date: string | null;
    description?: string;
  }>({
    title: "Add Event",
    fields: [
      { type: "text", key: "title", label: "Event name" },
      { type: "date", key: "date", label: "Date", showPresets: true },
      { type: "textarea", key: "description", label: "Notes", rows: 3 },
    ],
    initialValues: { date: null },
    submitLabel: "Add Event",
  });

  if (result.confirmed && result.data?.title) {
    addEvent(result.data);
  }
}

// Confirmation dialog
async function handleDelete(eventId: string) {
  const confirmed = await confirm({
    title: "Delete event?",
    message: "This action cannot be undone.",
    confirmLabel: "Delete",
    destructive: true,
  });

  if (confirmed) {
    deleteEvent(eventId);
  }
}
```

### Full-Screen Alerts (BkFullScreenAlert)

For important notifications like meeting reminders:

```vue
<script setup lang="ts">
import { BkFullScreenAlert, BkIcon } from "@boardkit/ui";

interface Props {
  event: CalendarEvent;
  timeFormat: "12h" | "24h";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  join: [];
  dismiss: [];
}>();

const handleJoin = () => {
  if (props.event.meetLink) {
    window.open(props.event.meetLink, "_blank");
  }
  emit("join");
};
</script>

<template>
  <BkFullScreenAlert
    :title="event.title"
    subtitle="Meeting starting now"
    icon="video"
    primary-label="Join Meeting"
    primary-icon="video"
    secondary-label="Dismiss"
    @primary="handleJoin"
    @secondary="$emit('dismiss')"
    @close="$emit('dismiss')"
  >
    <!-- Optional content slot -->
    <div class="flex items-center gap-2 text-sm">
      <BkIcon icon="clock" :size="14" />
      <span>{{ formatTime(event.start) }}</span>
    </div>
  </BkFullScreenAlert>
</template>
```

---

## Build System

Boardkit plugins are compiled to ES modules that are loaded at runtime.

### How It Works

1. Your plugin code imports from `@boardkit/plugin-api`, `@boardkit/ui`, and `vue`
2. The build script marks these as external dependencies
3. At runtime, these are provided via `window.__BOARDKIT__`
4. Your plugin auto-registers when `main.js` is loaded

### Build Configuration

The build script (`scripts/build-plugin.js`) uses Vite with these settings:

```javascript
{
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@boardkit/core',
        '@boardkit/ui',
        '@boardkit/plugin-api',
      ],
    },
  },
}
```

### Building

```bash
# Build a single plugin
node scripts/build-plugin.js my-plugin

# Build all plugins
node scripts/build-all.js
```

### Important: export default

Your `index.ts` **must** use `export default`:

```typescript
// ✅ CORRECT - Plugin will be registered
export default definePlugin({...})

// ❌ WRONG - Plugin will timeout
export const MyPlugin = definePlugin({...})
```

### Adding npm Dependencies

External packages are bundled into your plugin:

```bash
pnpm add date-fns  # Add to plugins repo root
```

```typescript
import { format } from "date-fns";
// This gets bundled into main.js
```

### Custom Styles

1. Create `styles.css` in your plugin folder
2. Set `"hasStyles": true` in `manifest.json`
3. Prefer scoped styles in Vue components when possible

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

Match versions in both places:

```json
// manifest.json
{ "version": "1.0.0" }
```

```typescript
// index.ts
definePlugin({ version: "1.0.0" });
```

---

## Complete Example: Google Calendar

The `google-calendar` plugin demonstrates all major patterns.

### File Structure

```
google-calendar/
├── manifest.json
├── main.js
└── src/
    ├── index.ts                    # Plugin definition
    ├── types.ts                    # State and settings types
    ├── GoogleCalendarWidget.vue    # Main widget
    └── components/
        ├── index.ts
        ├── EmptyState.vue          # Not configured state
        ├── EventItem.vue           # Event display
        ├── EventDetailsPopover.vue # Event details
        ├── GoogleCalendarSetup.vue # Custom config component
        └── MeetingReminderModal.vue # Full-screen alert
```

### Plugin Definition

```typescript
// src/index.ts
import { definePlugin } from "@boardkit/plugin-api";
import type { ConfigurationSchema, SettingsSchema } from "@boardkit/plugin-api";
import GoogleCalendarWidget from "./GoogleCalendarWidget.vue";
import GoogleCalendarSetup from "./components/GoogleCalendarSetup.vue";
import type { CalendarState } from "./types";
import { defaultCalendarState, defaultCalendarSettings } from "./types";

const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => !!(state as CalendarState).accessToken,
  setupMessage: "Connect your Google Calendar to see your upcoming events",
  setupIcon: "calendar",
  sections: [
    {
      type: "custom",
      title: "Connect Calendar",
      icon: "calendar",
      component: "GoogleCalendarSetup",
      description: "Connect your Google account or use demo mode.",
    },
  ],
};

const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: "display",
      title: "Display",
      icon: "eye",
      fields: [
        { type: "toggle", key: "showTomorrow", label: "Show tomorrow" },
        { type: "toggle", key: "showAllDay", label: "All-day events" },
        {
          type: "button-group",
          key: "timeFormat",
          label: "Time format",
          options: [
            { value: "12h", label: "12h" },
            { value: "24h", label: "24h" },
          ],
        },
        {
          type: "slider",
          key: "maxEvents",
          label: "Max events",
          min: 3,
          max: 20,
          step: 1,
          showValue: true,
        },
      ],
    },
  ],
};

export default definePlugin<CalendarState>({
  pluginId: "google-calendar",
  version: "0.1.0",
  displayName: "Google Calendar",
  icon: "calendar",
  component: GoogleCalendarWidget,
  defaultState: () => ({ ...defaultCalendarState }),
  serialize: (state) => state,
  deserialize: (data) => ({
    ...defaultCalendarState,
    ...defaultCalendarSettings,
    ...(data as Partial<CalendarState>),
  }),
  minWidth: 250,
  minHeight: 200,
  defaultWidth: 300,
  defaultHeight: 350,
  configurationSchema,
  settingsSchema,
  configurationComponents: {
    GoogleCalendarSetup,
  },
  onInstall: async () => {
    console.log("[Google Calendar] Plugin installed");
  },
  onEnable: () => {
    console.log("[Google Calendar] Plugin enabled");
  },
});
```

### Widget Component Pattern

```vue
<!-- src/GoogleCalendarWidget.vue -->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import type { ModuleContext } from "@boardkit/plugin-api";
import { useAsyncOperation } from "@boardkit/core";
import { BkIcon, useToast } from "@boardkit/ui";
import type { CalendarState, CalendarEvent, CalendarSettings } from "./types";
import { defaultCalendarSettings } from "./types";
import EventItem from "./components/EventItem.vue";
import MeetingReminderModal from "./components/MeetingReminderModal.vue";

interface Props {
  context: ModuleContext<CalendarState>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  openSettings: [options?: { tab?: string }];
}>();

const { success, error: showError } = useToast();

// Async operation for fetching events
const {
  isLoading,
  error: fetchError,
  execute: fetchEvents,
} = useAsyncOperation<CalendarEvent[]>({
  onSuccess: (newEvents) => {
    props.context.updateState({
      events: newEvents,
      lastSync: Date.now(),
      syncError: null,
    });
    success("Calendar synced");
  },
  onError: (err) => {
    props.context.updateState({ syncError: err.message });
    showError("Failed to sync calendar");
  },
});

// Settings with defaults - CRITICAL for reactivity
const settings = computed<CalendarSettings>(() => ({
  showTomorrow:
    props.context.state.showTomorrow ?? defaultCalendarSettings.showTomorrow,
  showAllDay:
    props.context.state.showAllDay ?? defaultCalendarSettings.showAllDay,
  timeFormat:
    props.context.state.timeFormat ?? defaultCalendarSettings.timeFormat,
  maxEvents: props.context.state.maxEvents ?? defaultCalendarSettings.maxEvents,
}));

// Computed state - ALWAYS use computed()
const isConfigured = computed(() => !!props.context.state.accessToken);
const events = computed(() => props.context.state.events || []);
const userEmail = computed(() => props.context.state.userEmail);

// Meeting reminder state
const pendingReminder = ref<CalendarEvent | null>(null);
let reminderInterval: ReturnType<typeof setInterval> | null = null;

// Watch for token changes to auto-refresh
watch(
  () => props.context.state.accessToken,
  (newToken) => {
    if (newToken && events.value.length === 0) {
      handleRefresh();
    }
  },
  { immediate: true }
);

// Lifecycle
onMounted(() => {
  reminderInterval = setInterval(checkForUpcomingMeetings, 30000);
});

onUnmounted(() => {
  if (reminderInterval) clearInterval(reminderInterval);
});

// ...rest of implementation
</script>
```

---

## Troubleshooting

### Plugin doesn't appear after installation

1. Check browser console for errors
2. Verify `manifest.json` is valid JSON
3. Ensure `pluginId` matches `manifest.json` `id`
4. Ensure `version` matches in both places
5. Verify `main.js` exists (run build script)

### "Plugin registration timeout" (5 seconds)

The plugin didn't register itself. Common causes:

| Cause                    | Solution                                             |
| ------------------------ | ---------------------------------------------------- |
| Missing `export default` | Use `export default definePlugin({...})`             |
| Build error              | Check that `main.js` exists and has no syntax errors |
| Runtime error            | Check browser console for errors in your code        |
| Missing dependencies     | Ensure all imports are from allowed packages         |

### Reactivity not working

```typescript
// ❌ WRONG - loses reactivity
const { items } = props.context.state;
const items = props.context.state.items;

// ✅ CORRECT - stays reactive
const items = computed(() => props.context.state.items || []);
```

### "Invalid manifest" errors

| Error                      | Fix                                |
| -------------------------- | ---------------------------------- |
| Missing required field "X" | Add the field to manifest.json     |
| Invalid plugin ID format   | Use kebab-case (e.g., `my-plugin`) |
| Invalid version format     | Use semver (e.g., `1.0.0`)         |
| Incompatible version       | Update `minBoardkitVersion`        |

### Icon doesn't show

1. Verify icon name exists at [lucide.dev/icons](https://lucide.dev/icons)
2. Use kebab-case (e.g., `calendar-check`, not `CalendarCheck`)
3. Check for typos

### State not persisting

See the detailed [State Serialization guide](./MODULE_DEVELOPMENT.md#state-serialization-serialize--deserialize) for a complete explanation.

**Quick checklist:**

1. Ensure `serialize` returns JSON-serializable data
2. Check `deserialize` handles missing fields with defaults
3. Don't store non-serializable data (functions, DOM elements, class instances)
4. Don't serialize runtime data (fetch results, timestamps)

**Recommended pattern** - Separate your state into 3 categories:

```typescript
// types.ts
interface MyPluginConfig {
  accessToken: string | null; // Saved ✓
}

interface MyPluginSettings {
  showDetails: boolean; // Saved ✓
}

interface MyPluginRuntime {
  events: CalendarEvent[]; // NOT saved
  lastSync: number | null; // NOT saved
  syncError: string | null; // NOT saved
}

export interface MyPluginState
  extends MyPluginConfig,
    MyPluginSettings,
    MyPluginRuntime {}

export const defaultRuntime: MyPluginRuntime = {
  events: [],
  lastSync: null,
  syncError: null,
};
```

```typescript
// index.ts
serialize: (state) => {
  // Exclude runtime data
  const { events, lastSync, syncError, ...rest } = state;
  return rest;
},

deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<MyPluginState>),
  // CRITICAL: Always reset runtime
  ...defaultRuntime,
}),
```

**Common mistakes:**

```typescript
// ❌ BUG - Runtime not reset, stale data persists
deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<State>),
})

// ❌ BUG - Accidentally excluded config, user must reconfigure!
serialize: (state) => {
  const { accessToken, events, ...rest } = state;  // accessToken excluded!
  return rest;
}

// ✅ CORRECT
serialize: (state) => {
  const { events, lastSync, syncError, ...rest } = state;
  return rest;
},

deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<State>),
  events: [],
  lastSync: null,
  syncError: null,
}),
```

### TypeScript errors

```typescript
// ✅ CORRECT - import types from plugin-api
import type { ModuleContext, SettingsField } from "@boardkit/plugin-api";

// ✅ CORRECT - import Vue from vue
import { computed, ref, watch } from "vue";

// ❌ WRONG - don't import from @boardkit/core in plugins
import { defineModule } from "@boardkit/core";
```

### Debugging Tips

Add console logs to trace issues:

```typescript
// In your widget component
console.log('[MyPlugin] State:', props.context.state)
console.log('[MyPlugin] Is configured:', isConfigured.value)

// In lifecycle hooks
onInstall: async () => {
  console.log('[MyPlugin] Plugin installed')
},
onEnable: () => {
  console.log('[MyPlugin] Plugin enabled')
},
```

---

## Examples

| Plugin            | Complexity | Demonstrates                                    |
| ----------------- | ---------- | ----------------------------------------------- |
| `hello-world`     | Minimal    | Basic structure, state management               |
| `habit-tracker`   | Medium     | Data contracts (provides), settings             |
| `stats-card`      | Advanced   | Multiple data sources (consumes), custom config |
| `google-calendar` | Advanced   | Custom configuration, async data, modals        |

Browse the [official plugins](https://github.com/kevinbarfleur/boardkit-official-plugins) for working examples.
