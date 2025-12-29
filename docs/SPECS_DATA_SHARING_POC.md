# Boardkit Data Sharing System (POC)

## Overview

This document specifies the Inter-Module Data Sharing system for Boardkit V0. The system enables modules to expose data through versioned contracts, allowing other modules to consume this data in a read-only, permission-controlled manner while maintaining strict modularity.

## Goals

1. **Controlled data access** - Modules can read data from other modules through explicit contracts
2. **No direct coupling** - Modules never access each other's state directly
3. **Read-only by default** - Consumers can only read, never write to providers
4. **Explicit permissions** - Data access requires user-granted permissions
5. **Live updates** - Consumers receive real-time updates when provider data changes
6. **Persistence** - All connections and permissions are saved in the document

## Non-Goals (Out of Scope for POC)

- Write access from consumers to providers
- Real-time collaboration / multi-user sync
- Complex field-level permissions
- Plugin marketplace / third-party modules
- Automatic conflict resolution (CRDTs)

---

## Core Concepts

### Data Contract

A versioned schema that defines what data a module can expose.

```typescript
interface DataContract<T = unknown> {
  id: string          // e.g., 'boardkit.todo.v1'
  name: string        // Human-readable name
  description: string // What data is exposed
  version: string     // Semver version
  providerId: string  // Module ID that provides this contract
}
```

**Naming Convention:** `boardkit.<moduleId>.v<major>`

### Data Provider

A module that exposes data through one or more contracts.

- Registers its contract on module load
- Publishes projections (not raw state) through the DataBus
- Auto-publishes when state changes

### Data Consumer

A module that reads data from one or more providers.

- Requests permission to connect to a provider
- Subscribes to updates via the DataBus
- Handles broken connections gracefully

### Permission

An explicit grant allowing a consumer widget to read from a provider widget.

```typescript
interface DataPermission {
  id: string
  consumerWidgetId: string
  providerWidgetId: string
  contractId: string
  scope: 'read'
  grantedAt: number
}
```

### Link

A simplified view of an active connection (derived from permission).

```typescript
interface DataLink {
  consumerWidgetId: string
  providerWidgetId: string
  contractId: string
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        @boardkit/core                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ DataContract    │    │ DataAccess      │                     │
│  │ Registry        │    │ Controller      │                     │
│  │                 │    │                 │                     │
│  │ - register()    │    │ - checkAccess() │                     │
│  │ - get()         │    │ - grant()       │                     │
│  │ - getByProvider │    │ - revoke()      │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐      │
│  │                      DataBus                           │      │
│  │                                                        │      │
│  │   Provider A ──publish──→ [cache] ──notify──→ Consumer│      │
│  │   Provider B ──publish──→ [cache] ──notify──→ Consumer│      │
│  │                                                        │      │
│  │   - subscribe(consumer, provider, contract, callback)  │      │
│  │   - publish(provider, contract, data)                  │      │
│  │   - getData(provider, contract)                        │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ useDataProvider │    │ useDataConsumer │                     │
│  │ (composable)    │    │ (composable)    │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Document Schema Extension

The document gains a new `dataSharing` section:

```typescript
interface BoardkitDocument {
  version: 2  // Bumped from 1
  meta: DocumentMeta
  board: BoardState
  modules: Record<string, unknown>
  dataSharing: {
    permissions: DataPermission[]
    links: DataLink[]
  }
}
```

**Migration:** Documents at version 1 are automatically migrated by adding an empty `dataSharing` section.

---

## Connection Flow

### 1. Consumer Requests Connection

```
User clicks "Connect Data Source" on Consumer widget
     │
     ▼
Consumer opens connection dialog
     │
     ▼
Dialog shows available providers for the contract
     │
     ▼
User selects a provider
     │
     ▼
System grants permission (creates DataPermission)
     │
     ▼
Consumer subscribes to DataBus
     │
     ▼
Consumer receives initial snapshot + live updates
```

### 2. Permission Grant

```typescript
// In boardStore
function grantDataPermission(
  consumerWidgetId: string,
  providerWidgetId: string,
  contractId: string
): DataPermission {
  const permission = {
    id: nanoid(),
    consumerWidgetId,
    providerWidgetId,
    contractId,
    scope: 'read',
    grantedAt: Date.now(),
  }

  document.dataSharing.permissions.push(permission)
  document.dataSharing.links.push({
    consumerWidgetId,
    providerWidgetId,
    contractId,
  })

  markDirty('Connected data source')
  return permission
}
```

### 3. Provider Deletion

When a provider widget is deleted:
1. All permissions referencing it are removed
2. All links referencing it are removed
3. Consumer subscriptions are cleaned up
4. Consumers detect `status: 'broken'` and show appropriate UI

---

## Contracts

### Todo Contract (boardkit.todo.v1)

```typescript
interface PublicTodoList {
  widgetId: string
  title: string
  description?: string
  progress: {
    done: number
    total: number
  }
  items: Array<{
    id: string
    label: string
    completed: boolean
  }>
}
```

**Important:** This is a *projection*, not the raw module state. The provider transforms its internal state into this public format.

---

## Consumer Modules

### Task Radar

**Purpose:** Aggregate view of multiple todo lists.

**Capabilities:**
- Connect to multiple todo providers
- Show combined statistics
- Display remaining tasks across all sources
- Live update as tasks are completed

**State:**
```typescript
interface TaskRadarState {
  title: string
  connectedProviders: string[]
  viewMode: 'summary' | 'detailed'
}
```

### Focus Lens

**Purpose:** Single-task focus view.

**Capabilities:**
- Connect to one todo provider
- Show the next actionable task
- Auto-update when task is completed

**State:**
```typescript
interface FocusLensState {
  connectedProvider: string | null
  showMode: 'next' | 'random'
}
```

---

## Connection Status

```typescript
type ConnectionStatus =
  | 'connected'     // Provider exists, permission granted, data flowing
  | 'disconnected'  // No permission or manually disconnected
  | 'broken'        // Provider widget was deleted
  | 'pending'       // Permission requested, awaiting grant
```

**UI Guidelines:**
- `connected`: Green indicator, show data
- `disconnected`: Neutral, show "Connect" button
- `broken`: Red/amber indicator, show "Source deleted" message
- `pending`: Loading indicator (not used in POC - permissions are instant)

---

## Security Considerations

1. **Projection-only exposure:** Providers expose projections, not raw state
2. **Widget-scoped permissions:** Permissions are per-widget-pair, not global
3. **Read-only:** No mechanism for consumers to modify provider state
4. **User-initiated:** Connections require explicit user action
5. **Audit trail:** Permissions include `grantedAt` timestamp

---

## Testing Requirements

### Unit Tests
- DataContractRegistry: registration, lookup, collision handling
- DataBus: subscribe, publish, unsubscribe, cache
- DataAccessController: permission CRUD, validation

### Integration Tests
- Provider publishes on state change
- Consumer receives updates after connect
- Permission revocation stops data flow
- Widget deletion cleans up connections
- Undo/redo preserves data sharing state
- Export/import preserves connections

### Edge Cases
- Consumer connects before provider publishes
- Provider deleted while consumer subscribed
- Multiple consumers to same provider
- Consumer connects to non-existent provider

---

## Future Considerations (Post-POC)

These are explicitly out of scope but documented for future reference:

1. **Write permissions:** Allow consumers to trigger actions on providers
2. **Schema validation:** Runtime validation of contract data
3. **Versioned contracts:** Support multiple versions simultaneously
4. **Permission UI:** Dedicated permission management panel
5. **Contract discovery:** Dynamic contract registration at runtime
