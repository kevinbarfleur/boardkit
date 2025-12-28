---
name: boardkit-architecture
description: |
  Boardkit monorepo architecture: package boundaries, module system, action registry, store patterns, and architectural decisions.
  Use when planning refactors, adding features, or understanding system boundaries.
allowed-tools: Read, Grep, Glob
---

# Boardkit Architecture Skill

## Package Boundaries
- @boardkit/core = business logic / types / registries (module/actions)
- @boardkit/ui = design system + reusable components
- @boardkit/platform = adapters (IndexedDB, filesystem Tauri, etc.)

## Key Patterns
- ModuleRegistry for widget modules
- ActionRegistry for user actions
- Store patterns (Vue stores for state management)

## References
- Architecture docs: ARCHITECTURE.md (if exists)
- Module system: packages/core/src/modules/
- Action system: packages/core/src/actions/ (if exists)

