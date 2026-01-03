---
globs: ["**/*.ts", "**/*.vue"]
---

# TypeScript Rules

## Strict Mode
- `strict: true` is enabled
- No escape hatches without documentation

## Type Safety

### Forbidden
- `any` without documented justification
- `@ts-ignore` without issue reference
- Type assertions (`as X`) at package boundaries

### Required
- Explicit return types on public functions
- Explicit types at package boundaries (core ↔ ui ↔ platform)
- Generic constraints when applicable

## Patterns

### Prefer
```typescript
// Discriminated unions
type Result<T> = { ok: true; value: T } | { ok: false; error: Error }

// Readonly by default
interface State {
  readonly items: ReadonlyArray<Item>
}

// Explicit undefined over optional
function get(id: string): Item | undefined
```

### Avoid
```typescript
// Loose types
function process(data: any): any

// Implicit any in callbacks
items.map(x => x.value) // if x type not inferred

// Non-null assertions without guard
user!.name // prefer: user?.name or if (user) { user.name }
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Interface | PascalCase | `BoardkitDocument` |
| Type alias | PascalCase | `WidgetState` |
| Enum | PascalCase | `ToolType` |
| Function | camelCase | `createWidget` |
| Constant | UPPER_SNAKE | `MAX_HISTORY_SIZE` |
| File | kebab-case | `board-store.ts` |

## Package Boundaries

```
@boardkit/core   → Pure logic, no Vue runtime, no I/O
@boardkit/ui     → Vue components, no business logic
@boardkit/platform → I/O adapters, no core dependency
```

Cross-package imports must use explicit types, not implementation details.
