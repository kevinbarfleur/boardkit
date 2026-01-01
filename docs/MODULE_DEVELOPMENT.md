# Module Development Guide

This guide covers how to create new modules for Boardkit. Modules are the building blocks of Boardkit widgets - they define what a widget does, how it looks, and how users can configure it.

## Table of Contents

1. [Module Structure](#module-structure)
2. [Creating a Module](#creating-a-module)
3. [Configuration vs Settings](#configuration-vs-settings)
4. [Field Types](#field-types)
5. [Context Menu](#context-menu)
6. [Data Sharing](#data-sharing)
7. [Async Operations](#async-operations)
8. [Toast Notifications](#toast-notifications)
9. [Secrets & Security](#secrets--security)
10. [Best Practices](#best-practices)

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
  apiKey: string | null

  // User settings
  refreshInterval: number
  showDetails: boolean

  // Runtime data (not persisted)
  items: Item[]
  lastSync: number | null
}

export const defaultMyModuleState: MyModuleState = {
  apiKey: null,
  refreshInterval: 300,
  showDetails: true,
  items: [],
  lastSync: null,
}
```

### 2. Create the Module Definition (`index.ts`)

```typescript
import { defineModule } from '@boardkit/core'
import type { ConfigurationSchema, SettingsSchema } from '@boardkit/core'
import MyModuleWidget from './MyModuleWidget.vue'
import type { MyModuleState } from './types'
import { defaultMyModuleState } from './types'

const configurationSchema: ConfigurationSchema = {
  // See Configuration section below
}

const settingsSchema: SettingsSchema = {
  // See Settings section below
}

export const MyModule = defineModule<MyModuleState>({
  moduleId: 'my-module',
  version: '0.1.0',
  displayName: 'My Module',
  icon: 'box',
  component: MyModuleWidget,

  defaultState: () => ({ ...defaultMyModuleState }),

  serialize: (state) => {
    // Don't serialize runtime data
    const { items, lastSync, ...rest } = state
    return rest
  },

  deserialize: (data) => ({
    ...defaultMyModuleState,
    ...(data as Partial<MyModuleState>),
  }),

  minWidth: 200,
  minHeight: 150,
  defaultWidth: 300,
  defaultHeight: 250,

  configurationSchema,
  settingsSchema,
})
```

### 3. Create the Widget Component (`MyModuleWidget.vue`)

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import type { MyModuleState } from './types'

interface Props {
  context: ModuleContext<MyModuleState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openSettings: [options?: { tab?: string }]
}>()

// Access state
const items = computed(() => props.context.state.items || [])
const isSelected = computed(() => props.context.isSelected)

// Update state
const addItem = (item: Item) => {
  props.context.updateState(
    { items: [...items.value, item] },
    { captureHistory: true, historyLabel: 'Added item' }
  )
}
</script>

<template>
  <div class="my-module h-full flex flex-col">
    <!-- Your widget UI here -->
  </div>
</template>
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
    const s = state as MyModuleState
    return !!s.apiKey
  },
  setupMessage: 'Connect your account to get started',
  setupIcon: 'plug',
  sections: [
    {
      type: 'custom',
      title: 'Account',
      icon: 'user',
      component: 'MyModuleSetup',
    },
  ],
}
```

### Settings (Optional Preferences)

Settings are for **optional customization** of an already-functional module:
- Display preferences
- Behavior tweaks
- Visual options

```typescript
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          type: 'toggle',
          key: 'showDetails',
          label: 'Show details',
          hint: 'Display additional information',
        },
        {
          type: 'slider',
          key: 'refreshInterval',
          label: 'Refresh interval',
          min: 60,
          max: 3600,
          step: 60,
          unit: 's',
        },
      ],
    },
  ],
}
```

---

## Field Types

Available field types for `settingsSchema`:

| Type | Description | Value Type |
|------|-------------|------------|
| `toggle` | Boolean switch | `boolean` |
| `checkbox` | Checkbox with label | `boolean` |
| `select` | Dropdown selection | `string \| number` |
| `button-group` | Segmented buttons | `string \| number` |
| `slider` | Range slider | `number` |
| `number` | Numeric input | `number` |
| `text` | Text input | `string` |
| `textarea` | Multi-line text | `string` |
| `date` | Date picker | `string \| null` |
| `color` | Color picker | `string \| null` |
| `secret` | Secure input (stored in vault) | `string \| null` |

### Secret Field Example

```typescript
{
  type: 'secret',
  key: 'apiKey',
  label: 'API Key',
  placeholder: 'Enter your API key',
  storedLabel: 'API key configured',
}
```

---

## Context Menu

Modules can add custom actions to the context menu:

```vue
<script setup lang="ts">
import type { ModuleContextMenuEvent, ModuleMenuGroup } from '@boardkit/core'

const emit = defineEmits<{
  moduleContextMenu: [event: ModuleContextMenuEvent]
}>()

const handleItemContextMenu = (item: Item, e: MouseEvent) => {
  const groups: ModuleMenuGroup[] = [
    {
      label: 'Item Actions',
      items: [
        { id: `edit:${item.id}`, label: 'Edit', icon: 'pencil' },
        { id: `delete:${item.id}`, label: 'Delete', icon: 'trash-2', destructive: true },
      ],
    },
  ]

  emit('moduleContextMenu', {
    x: e.clientX,
    y: e.clientY,
    groups,
    onSelect: handleMenuSelect,
  })
}

const handleMenuSelect = async (itemId: string) => {
  const [action, id] = itemId.split(':')
  // Handle action
}
</script>
```

---

## Data Sharing

### Providing Data

```typescript
import { useProvideData, myContractV1 } from '@boardkit/core'

useProvideData(props.context, myContractV1, {
  project: (state) => ({
    widgetId: props.context.widgetId,
    items: state.items.map(({ id, name }) => ({ id, name })),
    count: state.items.length,
  }),
})
```

### Consuming Data (Single Provider)

```typescript
import { useConsumeData, todoContractV1 } from '@boardkit/core'

// Single provider mode (default)
const { status, data, connect, disconnect } = useConsumeData(
  props.context,
  todoContractV1
)

// status: 'idle' | 'connecting' | 'connected' | 'error'
// data: the projected data from the provider (reactive)
```

### Consuming Data (Multiple Providers)

```typescript
import { useConsumeData, todoContractV1 } from '@boardkit/core'

// Multi-provider mode
const { connections, allData, connect, disconnect } = useConsumeData(
  props.context,
  todoContractV1,
  { multi: true, stateKey: 'connectedProviders' }
)

// connections: array of { providerId, status, data }
// allData: flattened array of all connected data
```

### Declarative Data Sharing

The recommended approach is to declare data sharing in `defineModule`:

```typescript
export const MyConsumerModule = defineModule<MyState>({
  moduleId: 'my-consumer',
  // ...
  consumes: [{
    contract: todoContractV1,
    multi: true,                    // Enable multi-provider mode
    stateKey: 'connectedProviders', // Where provider IDs are stored
    sourceLabel: 'Todo List',       // UI label
  }],
})
```

---

## Async Operations

Use `useAsyncOperation` for standardized loading/error states:

```typescript
import { useAsyncOperation } from '@boardkit/core'
import { useToast } from '@boardkit/ui'

const { success, error: showError } = useToast()

const {
  data,
  isLoading,
  error,
  isSuccess,
  execute,
} = useAsyncOperation<Item[]>({
  onSuccess: (items) => {
    props.context.updateState({ items, lastSync: Date.now() })
    success('Data synced')
  },
  onError: (err) => {
    showError(err.message)
  },
})

const refresh = () => {
  execute(async () => {
    const response = await fetch('/api/items')
    if (!response.ok) throw new Error('API error')
    return response.json()
  })
}
```

---

## Toast Notifications

```typescript
import { useToast } from '@boardkit/ui'

const { success, error, info, warning } = useToast()

// Basic usage
success('Changes saved')
error('Failed to save')
info('New items available')
warning('Connection unstable')

// With options
success('File uploaded', {
  title: 'Upload complete',
  action: {
    label: 'View',
    onClick: () => navigateToFile(),
  },
})
```

---

## Secrets & Security

For sensitive data (API keys, tokens), use the secrets vault:

```typescript
import { useSecrets } from '@boardkit/core'

const { getSecret, setSecret, resolveSecretRef } = useSecrets()

// Store a secret (returns a reference like "secret:my_api_key")
const ref = await setSecret('my_api_key', 'actual-key-value')
props.context.updateState({ apiKey: ref })

// Retrieve a secret
const apiKey = await resolveSecretRef(props.context.state.apiKey)

// Use in API calls
const response = await fetch('/api/data', {
  headers: { Authorization: `Bearer ${apiKey}` },
})
```

**Important:**
- Secrets are stored locally (IndexedDB for web, filesystem for desktop)
- Only references (e.g., `secret:my_key`) are stored in `.boardkit` files
- Users can share `.boardkit` templates without exposing credentials

---

## Best Practices

### 1. History Labels

Always provide descriptive history labels for user actions:

```typescript
props.context.updateState(
  { items: newItems },
  {
    captureHistory: true,
    historyLabel: `Added item: ${truncate(item.name, 25)}`,
  }
)
```

### 2. Debounced Updates

For frequent updates (like typing), use debouncing:

```typescript
props.context.updateState(
  { title: newTitle },
  {
    captureHistory: true,
    historyLabel: 'Updated title',
    debounceMs: 1000,
  }
)
```

### 3. Serialization

Don't serialize runtime data:

```typescript
serialize: (state) => {
  const { items, lastSync, error, ...rest } = state
  return rest
},

deserialize: (data) => ({
  ...defaultState,
  ...(data as Partial<State>),
  // Reset runtime state
  items: [],
  lastSync: null,
  error: null,
}),
```

### 4. Error Boundaries

Handle errors gracefully in the UI:

```vue
<template>
  <div v-if="error" class="error-state">
    <BkIcon icon="alert-circle" />
    <p>{{ error }}</p>
    <BkButton @click="retry">Retry</BkButton>
  </div>
  <div v-else>
    <!-- Normal content -->
  </div>
</template>
```

### 5. Loading States

Show loading indicators for async operations:

```vue
<template>
  <div class="flex items-center gap-2">
    <BkIcon
      icon="refresh-cw"
      :class="{ 'animate-spin': isLoading }"
    />
    <span v-if="lastSync">
      Last sync: {{ formatTime(lastSync) }}
    </span>
  </div>
</template>
```

---

## Example: Complete Module

See the `google-calendar` module for a complete example that demonstrates:
- Configuration schema with custom component
- Settings schema with various field types
- Async data fetching with `useAsyncOperation`
- Toast notifications with `useToast`
- Loading and error states
- Context menu integration

Location: `packages/app-common/src/modules/google-calendar/`
