# Module Development Guide

This guide covers how to create new modules for Boardkit. Modules are the building blocks of Boardkit widgets - they define what a widget does, how it looks, and how users can configure it.

## Table of Contents

1. [Module Structure](#module-structure)
2. [Creating a Module](#creating-a-module)
3. [ModuleContext API](#modulecontext-api)
4. [Vue Reactivity Patterns](#vue-reactivity-patterns)
5. [Configuration vs Settings](#configuration-vs-settings)
6. [Field Types Reference](#field-types-reference)
7. [Context Menu](#context-menu)
8. [Modal & Dynamic Forms](#modal--dynamic-forms)
9. [Custom Configuration Components](#custom-configuration-components)
10. [Data Sharing](#data-sharing)
11. [Async Operations](#async-operations)
12. [Toast Notifications](#toast-notifications)
13. [Secrets & Security](#secrets--security)
14. [State Serialization](#state-serialization-serialize--deserialize)
15. [Best Practices](#best-practices)
16. [Common Pitfalls](#common-pitfalls)

---

## Module Structure

A typical module follows this structure:

```
packages/app-common/src/modules/my-module/
├── index.ts                 # Module definition (defineModule)
├── types.ts                 # TypeScript types
├── MyModuleWidget.vue       # Main widget component
├── components/
│   ├── index.ts
│   └── *.vue                # Sub-components
└── composables/
    ├── index.ts
    └── *.ts                 # Module-specific composables
```

---

## Creating a Module

### 1. Define Types (`types.ts`)

```typescript
export interface MyModuleState {
  // Required configuration
  apiKey: string | null;

  // User settings
  refreshInterval: number;
  showDetails: boolean;

  // Runtime data (not persisted)
  items: Item[];
  lastSync: number | null;
}

export const defaultMyModuleState: MyModuleState = {
  apiKey: null,
  refreshInterval: 300,
  showDetails: true,
  items: [],
  lastSync: null,
};

// Separate interface for settings (useful for child components)
export interface MyModuleSettings {
  refreshInterval: number;
  showDetails: boolean;
}

export const defaultMyModuleSettings: MyModuleSettings = {
  refreshInterval: 300,
  showDetails: true,
};
```

### 2. Create the Module Definition (`index.ts`)

```typescript
import { defineModule } from "@boardkit/core";
import type { ConfigurationSchema, SettingsSchema } from "@boardkit/core";
import MyModuleWidget from "./MyModuleWidget.vue";
import type { MyModuleState } from "./types";
import { defaultMyModuleState, defaultMyModuleSettings } from "./types";

const configurationSchema: ConfigurationSchema = {
  // See Configuration section below
};

const settingsSchema: SettingsSchema = {
  // See Settings section below
};

export const MyModule = defineModule<MyModuleState>({
  moduleId: "my-module",
  version: "0.1.0",
  displayName: "My Module",
  icon: "box",
  component: MyModuleWidget,

  defaultState: () => ({ ...defaultMyModuleState }),

  serialize: (state) => {
    // Don't serialize runtime data
    const { items, lastSync, ...rest } = state;
    return rest;
  },

  deserialize: (data) => ({
    ...defaultMyModuleState,
    ...defaultMyModuleSettings,
    ...(data as Partial<MyModuleState>),
  }),

  minWidth: 200,
  minHeight: 150,
  defaultWidth: 300,
  defaultHeight: 250,

  configurationSchema,
  settingsSchema,
});
```

### 3. Create the Widget Component (`MyModuleWidget.vue`)

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { ModuleContext } from "@boardkit/core";
import type { MyModuleState, MyModuleSettings } from "./types";
import { defaultMyModuleSettings } from "./types";

interface Props {
  context: ModuleContext<MyModuleState>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  openSettings: [options?: { tab?: string }];
}>();

// Access state - ALWAYS use computed() for reactivity
const items = computed(() => props.context.state.items || []);
const isSelected = computed(() => props.context.isSelected);

// Settings with defaults - pattern from TodoWidget
const settings = computed<MyModuleSettings>(() => ({
  refreshInterval:
    props.context.state.refreshInterval ??
    defaultMyModuleSettings.refreshInterval,
  showDetails:
    props.context.state.showDetails ?? defaultMyModuleSettings.showDetails,
}));

// Update state
const addItem = (item: Item) => {
  props.context.updateState(
    { items: [...items.value, item] },
    { captureHistory: true, historyLabel: "Added item" }
  );
};
</script>

<template>
  <div class="my-module h-full flex flex-col">
    <!-- Your widget UI here -->
  </div>
</template>
```

---

## ModuleContext API

The `ModuleContext<TState>` interface is the primary way widgets interact with Boardkit.

### Interface Definition

```typescript
interface ModuleContext<TState = unknown> {
  /** Widget ID - unique identifier for this widget instance */
  widgetId: string;

  /** Module ID - identifier of the module type */
  moduleId: string;

  /** Current module state (reactive) */
  state: TState;

  /** Whether the widget is currently selected */
  isSelected: boolean;

  /**
   * Update module state (partial merge).
   * @param partial - Partial state to merge
   * @param options - History options for undo/redo
   */
  updateState: (partial: Partial<TState>, options?: HistoryOptions) => void;

  /**
   * Replace entire module state.
   * @param state - New complete state
   * @param options - History options for undo/redo
   */
  setState: (state: TState, options?: HistoryOptions) => void;
}
```

### HistoryOptions

Control how state changes integrate with undo/redo:

```typescript
interface HistoryOptions {
  /**
   * If true, captures a history snapshot before the mutation.
   * Default: false
   */
  captureHistory?: boolean;

  /**
   * Contextual label for the history entry.
   * Example: "Checked: Buy groceries"
   */
  historyLabel?: string;

  /**
   * Debounce delay in milliseconds before capturing snapshot.
   * Useful for high-frequency actions like text input.
   * Default: 0 (immediate)
   */
  debounceMs?: number;
}
```

### Usage Examples

```typescript
// Simple update (no history)
props.context.updateState({ count: 5 });

// User action with history
props.context.updateState(
  { items: newItems },
  { captureHistory: true, historyLabel: "Added new item" }
);

// Text input with debounce
props.context.updateState(
  { title: newTitle },
  { captureHistory: true, historyLabel: "Updated title", debounceMs: 1000 }
);
```

---

## Vue Reactivity Patterns

### Critical: Always Use `computed()` for State Access

Vue's reactivity system requires proper patterns to track dependencies correctly.

```typescript
// ✅ CORRECT - Reactive, will update when state changes
const items = computed(() => props.context.state.items || []);
const title = computed(() => props.context.state.title || "");
const isSelected = computed(() => props.context.isSelected);

// ❌ WRONG - Loses reactivity, will NOT update
const { items } = props.context.state; // Don't destructure!
const title = props.context.state.title; // This is only evaluated once

// ❌ WRONG - toRef doesn't work with proxy state
const items = toRef(props.context.state, "items");
```

### Settings Pattern with Defaults

When a module has settings, create a computed object that merges with defaults:

```typescript
// From TodoWidget.vue - recommended pattern
const settings = computed<TodoSettings>(() => ({
  strikeCompleted: props.context.state.strikeCompleted ?? defaultTodoSettings.strikeCompleted,
  hideCompleted: props.context.state.hideCompleted ?? defaultTodoSettings.hideCompleted,
  showProgress: props.context.state.showProgress ?? defaultTodoSettings.showProgress,
  showDueDate: props.context.state.showDueDate ?? defaultTodoSettings.showDueDate,
  showPriority: props.context.state.showPriority ?? defaultTodoSettings.showPriority,
  enableReorder: props.context.state.enableReorder ?? defaultTodoSettings.enableReorder,
  autoSort: props.context.state.autoSort ?? defaultTodoSettings.autoSort,
  cascadeCompletion: props.context.state.cascadeCompletion ?? defaultTodoSettings.cascadeCompletion,
  confirmDelete: props.context.state.confirmDelete ?? defaultTodoSettings.confirmDelete,
}))

// Then use in template
<TodoList :settings="settings" />
```

### Watch for State Changes

Use `watch` when you need to react to state changes:

```typescript
import { watch } from "vue";

// Watch for configuration changes
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

### Derived Computed Values

Chain computed values for complex transformations:

```typescript
// From KanbanWidget.vue
const items = computed(() => props.context.state.items || []);
const columns = computed(() =>
  [...(props.context.state.columns || [])].sort((a, b) => a.order - b.order)
);

// Derived from items
const activeItems = computed(() => items.value.filter((i) => !i.archived));
const archivedItems = computed(() => items.value.filter((i) => i.archived));
const archivedCount = computed(() => archivedItems.value.length);
```

---

## Configuration vs Settings

### Configuration (Required Setup)

Configuration is for **required setup** before the module becomes functional:

- Connecting to data sources
- API credentials
- Selecting what data to display

```typescript
const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => {
    const s = state as MyModuleState;
    return !!s.apiKey;
  },
  setupMessage: "Connect your account to get started",
  setupIcon: "plug",
  sections: [
    {
      type: "custom",
      title: "Account",
      icon: "user",
      component: "MyModuleSetup", // Must match key in configurationComponents
      description: "Connect your account or use demo mode.",
    },
  ],
};

// Register the custom component
export const MyModule = defineModule<MyModuleState>({
  // ...
  configurationSchema,
  configurationComponents: {
    MyModuleSetup: MyModuleSetupComponent,
  },
});
```

### Configuration Section Types

| Type                  | Description                         | Use Case                         |
| --------------------- | ----------------------------------- | -------------------------------- |
| `source-picker`       | Select single/multiple data sources | Focus Lens (single todo list)    |
| `source-picker-group` | Multi-contract source selection     | Stats Card (5 different sources) |
| `item-builder`        | Build list of items via wizard      | Stats Card metrics config        |
| `custom`              | Custom Vue component                | Google Calendar setup            |

### Settings (Optional Preferences)

Settings are for **optional customization** of an already-functional module:

- Display preferences
- Behavior tweaks
- Visual options

```typescript
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: "display",
      title: "Display",
      icon: "eye",
      fields: [
        {
          type: "toggle",
          key: "showDetails",
          label: "Show details",
          hint: "Display additional information",
        },
        {
          type: "slider",
          key: "refreshInterval",
          label: "Refresh interval",
          min: 60,
          max: 3600,
          step: 60,
          unit: "s",
          showValue: true,
        },
      ],
    },
  ],
};
```

---

## Field Types Reference

Available field types for `settingsSchema`:

### Basic Fields

| Type       | Description         | Value Type |
| ---------- | ------------------- | ---------- |
| `toggle`   | Boolean switch      | `boolean`  |
| `checkbox` | Checkbox with label | `boolean`  |
| `text`     | Text input          | `string`   |
| `textarea` | Multi-line text     | `string`   |
| `number`   | Numeric input       | `number`   |

### Selection Fields

| Type           | Description        | Value Type         |
| -------------- | ------------------ | ------------------ |
| `select`       | Dropdown selection | `string \| number` |
| `button-group` | Segmented buttons  | `string \| number` |

### Range & Date Fields

| Type     | Description  | Value Type       |
| -------- | ------------ | ---------------- |
| `slider` | Range slider | `number`         |
| `date`   | Date picker  | `string \| null` |
| `color`  | Color picker | `string \| null` |

### Special Fields

| Type     | Description                    | Value Type       |
| -------- | ------------------------------ | ---------------- |
| `secret` | Secure input (stored in vault) | `string \| null` |
| `tags`   | Multi-tag input                | `string[]`       |

### Field Options Reference

#### Toggle Field

```typescript
{
  type: 'toggle',
  key: 'showDetails',
  label: 'Show details',
  hint: 'Optional description text',
  disabled: false,
  condition: "state.mode === 'advanced'",  // Conditional display
}
```

#### Button Group Field

```typescript
{
  type: 'button-group',
  key: 'showProgress',
  label: 'Progress indicator',
  options: [
    { value: 'none', label: 'None' },
    { value: 'bar', label: 'Bar' },
    { value: 'counter', label: 'Counter' },
  ],
  fullWidth: true,  // Buttons take full width
}
```

#### Slider Field

```typescript
{
  type: 'slider',
  key: 'maxEvents',
  label: 'Max events',
  min: 3,
  max: 20,
  step: 1,
  showValue: true,  // Display current value
  unit: 'items',    // Unit label
  hint: 'Maximum number of events to display',
}
```

#### Date Field

```typescript
{
  type: 'date',
  key: 'dueDate',
  label: 'Due date',
  placeholder: 'Select date',
  showPresets: true,  // Show Today, Tomorrow, etc.
}
```

#### Tags Field

```typescript
{
  type: 'tags',
  key: 'tags',
  label: 'Tags',
  placeholder: 'Add tags...',
  suggestions: ['urgent', 'important', 'review'],  // Autocomplete suggestions
  maxTags: 5,         // Maximum allowed tags
  allowCreate: true,  // Allow new tags not in suggestions
}
```

#### Secret Field

```typescript
{
  type: 'secret',
  key: 'apiKey',
  label: 'API Key',
  placeholder: 'Enter your API key',
  storedLabel: 'API key configured',  // Shown when secret is stored
}
```

#### Select Field

```typescript
{
  type: 'select',
  key: 'priority',
  label: 'Priority',
  placeholder: 'Select priority',
  options: [
    { value: 'low', label: 'Low', icon: 'arrow-down' },
    { value: 'medium', label: 'Medium', icon: 'minus' },
    { value: 'high', label: 'High', icon: 'arrow-up' },
  ],
}
```

---

## Context Menu

Modules can add custom actions to the context menu. These are combined with widget-level actions (Edit, Settings, Delete).

### Basic Implementation

```vue
<script setup lang="ts">
import type {
  ModuleContextMenuEvent,
  ModuleMenuGroup,
  ModuleMenuItem,
} from "@boardkit/core";

const emit = defineEmits<{
  moduleContextMenu: [event: ModuleContextMenuEvent];
}>();

const handleItemContextMenu = (item: Item, e: MouseEvent) => {
  const groups: ModuleMenuGroup[] = [
    {
      label: "Item Actions", // Optional group label
      items: [
        { id: `edit:${item.id}`, label: "Edit", icon: "pencil" },
        { id: `duplicate:${item.id}`, label: "Duplicate", icon: "copy" },
      ],
    },
    {
      // No label = separator group
      items: [
        {
          id: `delete:${item.id}`,
          label: "Delete",
          icon: "trash-2",
          destructive: true, // Shows in red
        },
      ],
    },
  ];

  emit("moduleContextMenu", {
    x: e.clientX,
    y: e.clientY,
    groups,
    onSelect: handleMenuSelect,
  });
};

const handleMenuSelect = async (menuItemId: string) => {
  // Parse action and ID from menu item ID
  const [action, id] = menuItemId.split(":");

  switch (action) {
    case "edit":
      await openEditModal(id);
      break;
    case "duplicate":
      duplicateItem(id);
      break;
    case "delete":
      requestDelete(id);
      break;
  }
};
</script>

<template>
  <div
    v-for="item in items"
    :key="item.id"
    @contextmenu.prevent="(e) => handleItemContextMenu(item, e)"
  >
    {{ item.label }}
  </div>
</template>
```

### Advanced: Move To Submenu

```typescript
// From KanbanWidget.vue
function buildCardContextMenuGroups(item: KanbanItem): ModuleMenuGroup[] {
  const otherColumns = columns.value.filter((c) => c.id !== item.columnId);
  const groups: ModuleMenuGroup[] = [];

  // Basic actions
  groups.push({
    items: [
      { id: `card:edit:${item.id}`, label: "Edit card", icon: "pencil" },
      { id: `card:duplicate:${item.id}`, label: "Duplicate", icon: "copy" },
    ],
  });

  // Move to column submenu
  if (otherColumns.length > 0) {
    groups.push({
      label: "Move to",
      items: otherColumns.map((c) => ({
        id: `card:move:${item.id}:${c.id}`,
        label: c.title,
      })),
    });
  }

  // Delete (separate group for visual separation)
  groups.push({
    items: [
      {
        id: `card:delete:${item.id}`,
        label: "Delete card",
        icon: "trash-2",
        destructive: true,
      },
    ],
  });

  return groups;
}
```

---

## Modal & Dynamic Forms

Use `useModal()` from `@boardkit/ui` for dynamic forms and confirmations.

### Opening a Form Modal

```typescript
import { useModal } from "@boardkit/ui";
import type { SettingsField } from "@boardkit/core";

const { openModal, confirm } = useModal();

// Define form fields
const taskFields: SettingsField[] = [
  {
    type: "text",
    key: "title",
    label: "Task name",
    placeholder: "Enter task name...",
  },
  {
    type: "textarea",
    key: "description",
    label: "Description",
    placeholder: "Add a description (optional)",
    rows: 3,
  },
  {
    type: "button-group",
    key: "priority",
    label: "Priority",
    options: [
      { value: "", label: "None" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
    fullWidth: true,
  },
  {
    type: "date",
    key: "dueDate",
    label: "Due date",
    showPresets: true,
  },
];

// Open the modal with type-safe data
async function openAddTaskModal() {
  const result = await openModal<{
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "";
    dueDate?: string | null;
  }>({
    title: "Add task",
    fields: taskFields,
    initialValues: { priority: "" },
    submitLabel: "Add task",
  });

  if (result.confirmed && result.data?.title?.trim()) {
    // Handle the submitted data
    addTask(result.data);
  }
}
```

### Conditional Fields

```typescript
// From KanbanWidget.vue - conditionally add fields
const fields: SettingsField[] = [
  { type: "text", key: "title", label: "Title" },
  { type: "textarea", key: "description", label: "Description" },
  // Only add tags field if feature is enabled
  ...(showTags.value
    ? [
        {
          type: "tags" as const,
          key: "tags",
          label: "Tags",
          suggestions: allTags.value,
        },
      ]
    : []),
  // Only add date field if feature is enabled
  ...(showDueDate.value
    ? [
        {
          type: "date" as const,
          key: "dueDate",
          label: "Due Date",
          showPresets: true,
        },
      ]
    : []),
];
```

### Confirmation Dialogs

```typescript
async function handleDelete(itemId: string) {
  const item = items.value.find((i) => i.id === itemId);

  const confirmed = await confirm({
    title: "Delete task?",
    message: `Are you sure you want to delete "${item?.title}"? This action cannot be undone.`,
    confirmLabel: "Delete",
    destructive: true, // Red confirm button
  });

  if (confirmed) {
    removeItem(itemId);
  }
}
```

---

## Custom Configuration Components

For complex configuration needs, use a custom Vue component.

### Component Contract

```vue
<script setup lang="ts">
import type { ModuleContext } from "@boardkit/core";
import type { MyModuleState } from "../types";

interface Props {
  context?: ModuleContext<MyModuleState>; // Optional - provided by parent
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [key: string, value: unknown]; // Key-value updates
}>();

// Handler for state updates
const handleConnect = () => {
  emit("update", "accessToken", "demo");
  emit("update", "userEmail", "demo@example.com");
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="p-4 rounded-lg border">
      <!-- Your custom configuration UI -->
      <BkButton @click="handleConnect"> Connect Account </BkButton>
    </div>
  </div>
</template>
```

### Example: Google Calendar Setup

```vue
<!-- GoogleCalendarSetup.vue -->
<script setup lang="ts">
import { BkButton, BkIcon } from "@boardkit/ui";
import type { ModuleContext } from "@boardkit/core";
import type { CalendarState } from "../types";

interface Props {
  context?: ModuleContext<CalendarState>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [key: string, value: unknown];
}>();

const handleEnableDemo = () => {
  emit("update", "accessToken", "demo");
  emit("update", "userEmail", "demo@example.com");
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- OAuth Section (placeholder) -->
    <div class="p-4 rounded-lg border border-border bg-muted/30">
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <BkIcon icon="user" :size="20" class="text-primary" />
        </div>
        <div>
          <p class="text-sm font-medium">Sign in with Google</p>
          <p class="text-xs text-muted-foreground">
            Connect your Google account
          </p>
        </div>
      </div>
      <BkButton variant="outline" class="w-full" disabled>
        Connect Google Account
      </BkButton>
    </div>

    <!-- Demo Mode Section -->
    <div class="p-4 rounded-lg border border-border bg-muted/30">
      <BkButton class="w-full" @click="handleEnableDemo">
        <BkIcon icon="sparkles" :size="14" class="mr-2" />
        Enable Demo Mode
      </BkButton>
    </div>
  </div>
</template>
```

---

## Data Sharing

### Providing Data

Expose data to other modules using data contracts:

```typescript
import { useProvideData, todoContractV1 } from "@boardkit/core";
import type { PublicTodoList } from "@boardkit/core";

// Register as data provider with typed projection
useProvideData(props.context, todoContractV1, {
  project: (state): PublicTodoList => ({
    widgetId: props.context.widgetId,
    title: state.title || "",
    description: state.description || undefined,
    progress: {
      done: (state.items || []).filter((i) => i.completed).length,
      total: (state.items || []).length,
    },
    items: (state.items || []).map(({ id, label, completed }) => ({
      id,
      label,
      completed,
    })),
  }),
});
```

### Multiple Contracts

A module can provide multiple contracts:

```typescript
// From KanbanWidget.vue
useProvideData(props.context, kanbanContractV1, {
  project: (state): PublicKanbanBoard => ({
    widgetId: props.context.widgetId,
    title: state.title || "Kanban",
    totalItems: (state.items || []).length,
    columns: (state.columns || []).map((col) => ({
      id: col.id,
      title: col.title,
      itemCount: (state.items || []).filter((i) => i.columnId === col.id)
        .length,
    })),
  }),
});

useProvideData(props.context, kanbanStatsContractV1, {
  project: (state): PublicKanbanStats => ({
    widgetId: props.context.widgetId,
    totalItems: (state.items || []).length,
    completedItems: getCompletedCount(state),
    completionRate: getCompletionRate(state),
  }),
});
```

### Consuming Data (Single Provider)

```typescript
import { useConsumeData, todoContractV1 } from "@boardkit/core";

// Single provider mode (default)
const { status, data, connect, disconnect, availableProviders, refresh } =
  useConsumeData(props.context, todoContractV1);

// status: 'connected' | 'disconnected' | 'broken' | 'pending'
// data: Ref<PublicTodoList | null>
// availableProviders: ComputedRef<Array<{ id: string; moduleId: string }>>
```

### Consuming Data (Multiple Providers)

```typescript
import { useConsumeData, todoContractV1 } from "@boardkit/core";

// Multi-provider mode
const {
  connections,
  allData,
  connect,
  disconnect,
  disconnectAll,
  isConnected,
} = useConsumeData(props.context, todoContractV1, {
  multi: true,
  stateKey: "connectedProviders",
});

// connections: ComputedRef<Map<string, DataConnection<PublicTodoList>>>
// allData: ComputedRef<PublicTodoList[]> - flattened array of all data
```

### Declarative Data Sharing

Declare data dependencies in `defineModule`:

```typescript
export const MyConsumerModule = defineModule<MyState>({
  moduleId: "my-consumer",
  // ...
  consumes: [
    {
      contract: todoContractV1,
      multi: true, // Enable multi-provider mode
      stateKey: "connectedProviders", // Where provider IDs are stored
      sourceLabel: "Todo List", // UI label
    },
  ],
  provides: [myContractV1], // Contracts this module provides
});
```

---

## Async Operations

Use `useAsyncOperation` for standardized loading/error states:

```typescript
import { useAsyncOperation } from "@boardkit/core";
import { useToast } from "@boardkit/ui";

const { success, error: showError } = useToast();

const {
  data, // Ref<CalendarEvent[] | null>
  isLoading, // Ref<boolean>
  error, // Ref<string | null>
  isSuccess, // ComputedRef<boolean>
  isError, // ComputedRef<boolean>
  hasExecuted, // Ref<boolean>
  execute, // (fn: () => Promise<T>) => Promise<T | null>
  reset, // () => void
  setError, // (message: string) => void
  clearError, // () => void
} = useAsyncOperation<CalendarEvent[]>({
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

---

## Toast Notifications

```typescript
import { useToast } from "@boardkit/ui";

const { success, error, info, warning } = useToast();

// Basic usage
success("Changes saved");
error("Failed to save");
info("New items available");
warning("Connection unstable");

// With options
success("File uploaded", {
  title: "Upload complete",
  action: {
    label: "View",
    onClick: () => navigateToFile(),
  },
});
```

---

## Secrets & Security

For sensitive data (API keys, tokens), use the secrets vault:

```typescript
import { useSecrets } from "@boardkit/core";

const { getSecret, setSecret, resolveSecretRef, hasSecret, deleteSecret } =
  useSecrets();

// Store a secret (returns a reference like "secret:my_api_key")
const ref = await setSecret("my_api_key", "actual-key-value");
props.context.updateState({ apiKey: ref });

// Retrieve a secret
const apiKey = await resolveSecretRef(props.context.state.apiKey);
// If state.apiKey = "secret:my_key", resolves to the actual value
// If state.apiKey = "plain_value", returns "plain_value"

// Check if secret exists
const exists = await hasSecret("my_api_key");

// Delete a secret
await deleteSecret("my_api_key");
```

**Important:**

- Secrets are stored locally (IndexedDB for web, filesystem for desktop)
- Only references (e.g., `secret:my_key`) are stored in `.boardkit` files
- Users can share `.boardkit` templates without exposing credentials

---

## State Serialization (serialize / deserialize)

The `serialize` and `deserialize` functions control how your module's state is persisted to `.boardkit` files.

### Why Serialization Exists

Your module state typically contains three categories of data:

```typescript
interface MyModuleState {
  // 1. CONFIGURATION - Required setup, must be saved
  apiKey: string | null;
  userEmail: string | null;

  // 2. SETTINGS - User preferences, must be saved
  showDetails: boolean;
  refreshInterval: number;

  // 3. RUNTIME - Temporary data, must NOT be saved
  items: Item[]; // Fetched from API on refresh
  lastSync: number | null; // Timestamp of last sync
  syncError: string | null; // Temporary error state
}
```

Without proper serialization:

- **File size explosion**: All fetched data gets saved (calendar events, API responses)
- **Stale data**: Runtime data becomes obsolete when reloading
- **Persisted errors**: Temporary error states get saved

### Recommended Pattern

Structure your types clearly:

```typescript
// types.ts

// 1. Configuration (required setup)
interface MyModuleConfig {
  apiKey: string | null;
  userEmail: string | null;
}

// 2. Settings (user preferences)
interface MyModuleSettings {
  showDetails: boolean;
  refreshInterval: number;
}

// 3. Runtime (temporary, not saved)
interface MyModuleRuntime {
  items: Item[];
  lastSync: number | null;
  syncError: string | null;
}

// Complete state
export interface MyModuleState
  extends MyModuleConfig,
    MyModuleSettings,
    MyModuleRuntime {}

// Separate defaults for each category
export const defaultConfig: MyModuleConfig = {
  apiKey: null,
  userEmail: null,
};

export const defaultSettings: MyModuleSettings = {
  showDetails: true,
  refreshInterval: 300,
};

export const defaultRuntime: MyModuleRuntime = {
  items: [],
  lastSync: null,
  syncError: null,
};

export const defaultState: MyModuleState = {
  ...defaultConfig,
  ...defaultSettings,
  ...defaultRuntime,
};
```

Then in your module definition:

```typescript
export const MyModule = defineModule<MyModuleState>({
  // ...

  serialize: (state) => {
    // Explicitly exclude runtime data
    const { items, lastSync, syncError, ...persisted } = state;
    return persisted;
  },

  deserialize: (data) => ({
    // Start with all defaults
    ...defaultState,
    // Merge saved data (config + settings)
    ...(data as Partial<MyModuleState>),
    // CRITICAL: Force runtime to default values
    ...defaultRuntime,
  }),
});
```

### Common Pitfalls

#### 1. Forgetting to Reset Runtime in `deserialize`

```typescript
// ❌ BUG - If runtime was accidentally saved before, it persists
deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<MyModuleState>),
});

// ✅ CORRECT - Always reset runtime explicitly
deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<MyModuleState>),
  // Force reset runtime
  items: [],
  lastSync: null,
  syncError: null,
});
```

#### 2. Adding New Settings Without Defaults

When you add a new setting, users with existing widgets won't have it:

```typescript
// Added new field: showParticipantCount
// But forgot to add to defaultSettings!

// ❌ Results in undefined
const showParticipantCount = computed(
  () => props.context.state.showParticipantCount
);

// ✅ CORRECT - Always use defaults
const showParticipantCount = computed(
  () =>
    props.context.state.showParticipantCount ??
    defaultSettings.showParticipantCount
);
```

#### 3. Accidentally Excluding Configuration

```typescript
// ❌ BUG - apiKey excluded, user has to reconfigure after reload!
serialize: (state) => {
  const { apiKey, items, ...rest } = state;
  return rest;
};

// ✅ CORRECT - Only exclude runtime
serialize: (state) => {
  const { items, lastSync, syncError, ...rest } = state;
  return rest;
};
```

#### 4. Non-Serializable Data

```typescript
// ❌ These cannot be serialized to JSON
interface BadState {
  callback: () => void; // Functions
  element: HTMLElement; // DOM elements
  connection: WebSocket; // Class instances
  data: Map<string, Item>; // Map (becomes {})
}

// ✅ Use serializable types
interface GoodState {
  items: Item[]; // Arrays
  config: Record<string, unknown>; // Plain objects
  timestamp: number; // Primitives
}
```

### Simple Modules (No Runtime Data)

For simple modules where everything should be saved:

```typescript
// If your module has no runtime data, use the simple form:
serialize: (state) => state,
deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<MyModuleState>),
}),
```

---

## Best Practices

### 1. History Labels

Always provide descriptive history labels for user actions:

```typescript
import { truncate } from "@boardkit/core";

props.context.updateState(
  { items: newItems },
  {
    captureHistory: true,
    historyLabel: `Added item: ${truncate(item.name, 25)}`,
  }
);
```

### 2. Debounced Updates

For frequent updates (like typing), use debouncing:

```typescript
props.context.updateState(
  { title: newTitle },
  {
    captureHistory: true,
    historyLabel: "Updated title",
    debounceMs: 1000,
  }
);
```

### 3. Error Boundaries

Handle errors gracefully in the UI:

```vue
<template>
  <div
    v-if="error"
    class="error-state p-2 rounded bg-destructive/10 text-destructive text-xs flex items-center gap-2"
  >
    <BkIcon icon="alert-circle" :size="14" />
    <span>{{ error }}</span>
  </div>
  <div v-else>
    <!-- Normal content -->
  </div>
</template>
```

### 4. Loading States

Show loading indicators for async operations:

```vue
<template>
  <div class="flex items-center gap-2">
    <button @click="handleRefresh" :disabled="isLoading">
      <BkIcon
        icon="refresh-cw"
        :size="14"
        :class="{ 'animate-spin': isLoading }"
      />
    </button>
    <span v-if="lastSyncFormatted" class="text-xs text-muted-foreground">
      {{ lastSyncFormatted }}
    </span>
  </div>
</template>
```

---

## Common Pitfalls

### 1. Reactivity Lost by Destructuring

```typescript
// ❌ WRONG - loses reactivity
const { items, title } = props.context.state;

// ✅ CORRECT - stays reactive
const items = computed(() => props.context.state.items || []);
const title = computed(() => props.context.state.title || "");
```

### 2. Forgetting `captureHistory`

User-triggered actions should capture history for undo/redo:

```typescript
// ❌ WRONG - user can't undo this action
props.context.updateState({ items: newItems });

// ✅ CORRECT - action appears in history
props.context.updateState(
  { items: newItems },
  { captureHistory: true, historyLabel: "Added item" }
);
```

### 3. Missing Debounce for Text Input

Without debounce, every keystroke creates a history entry:

```typescript
// ❌ WRONG - creates many history entries
const onInput = (e) => {
  props.context.updateState(
    { content: e.target.value },
    { captureHistory: true }
  );
};

// ✅ CORRECT - debounces history capture
const onInput = (e) => {
  props.context.updateState(
    { content: e.target.value },
    { captureHistory: true, historyLabel: "Edited content", debounceMs: 1000 }
  );
};
```

### 4. Incorrect Imports

For modules (not plugins), import from `@boardkit/core`:

```typescript
// ✅ CORRECT for modules
import { defineModule, useProvideData, todoContractV1 } from "@boardkit/core";
import { BkIcon, useToast, useModal } from "@boardkit/ui";

// ❌ WRONG - plugin-api is for external plugins only
import { definePlugin } from "@boardkit/plugin-api";
```

### 5. Missing Default Values in Settings

Always handle missing settings gracefully:

```typescript
// ❌ WRONG - might be undefined
const showDetails = computed(() => props.context.state.showDetails);

// ✅ CORRECT - fallback to default
const showDetails = computed(() => props.context.state.showDetails ?? true);

// ✅ BETTER - use settings object pattern
const settings = computed<MySettings>(() => ({
  showDetails: props.context.state.showDetails ?? defaultSettings.showDetails,
}));
```

---

## Example: Complete Module

See these modules for complete examples:

| Module                     | Demonstrates                                              |
| -------------------------- | --------------------------------------------------------- |
| `todo`                     | Settings schema, data sharing, context menu, modals       |
| `kanban`                   | Complex state, drag & drop, multiple contracts, filtering |
| `text`                     | Simple settings, debounced updates                        |
| `google-calendar` (plugin) | Configuration schema, custom components, async operations |

Location: `packages/app-common/src/modules/`
