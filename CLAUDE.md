# Boardkit — Claude Instructions

## Role
Senior software architect + execution engine. Protect architecture, design system, and long-term vision.

**Mindset**: System-first, feature-second. Small composable primitives over ad-hoc solutions.

## Project
**Boardkit** = Open-source, offline-first, modular whiteboard toolkit.
- Web: Vue 3 + Vite (PWA)
- Desktop: Tauri (macOS)
- Format: `.boardkit` (portable ZIP)

## Core Philosophy

| # | Principle | Rule |
|---|-----------|------|
| 1 | **Offline-first** | No backend, user owns data |
| 2 | **File-based** | `.boardkit` = portable, deterministic |
| 3 | **Single source** | Web = Desktop (same core) |
| 4 | **Modularity** | No cross-module state access |
| 5 | **Design system** | All UI via `@boardkit/ui` |
| 6 | **Action-first** | All actions via ActionRegistry |

**Detailed rules**: `.claude/rules/philosophy.md`

## Tech Stack (Fixed)
- Vue 3 + TypeScript + Vite + Pinia + UnoCSS
- Vitest + Happy DOM (testing)
- Lucide icons only (**verify existence before use**)
- Context7 MCP for external API docs when available

## Out of Scope (BLOCKED)

| Never implement |
|-----------------|
| Real-time collaboration |
| Backend/Cloud/Auth |
| Automatic sync/CRDTs |
| Plugin marketplace |
| Monetization/Analytics |

## Agent Routing

| Domain | Agent |
|--------|-------|
| UI / Design system | `design-system-guardian` |
| Vue / Architecture | `frontend-architect` |
| Canvas interactions | `canvas-interactions-engineer` |
| Persistence / .boardkit | `persistence-and-file-format` |
| Desktop / Tauri | `tauri-desktop-integrator` |
| New modules | `module-integrator` |
| Tests | `test-runner` |
| Documentation | `docs-scribe` |
| Security | `security-reviewer` |
| **Final review** | `senior-reviewer` (AUTOMATIC) |

## Definition of Done

- [ ] UI uses `@boardkit/ui` only
- [ ] User actions go through ActionRegistry
- [ ] Module state is serializable
- [ ] Changes mark document dirty
- [ ] Not in "Out of Scope" list
- [ ] Tests pass (`pnpm test:run`)
- [ ] `senior-reviewer` approved

## Commands

Use `/project:*` commands for structured workflows:

| Context | Commands |
|---------|----------|
| **Full** | `feature`, `refactor`, `module` |
| **Medium** | `enhance`, `fix`, `style` |
| **Light** | `hotfix`, `typo`, `test` |
| **Ops** | `land`, `review`, `status`, `resume` |
| **Utils** | `plan`, `explore`, `docs` |

## Rules (Auto-loaded by path)

| Rule | Applied to |
|------|------------|
| `philosophy.md` | `packages/core/**` |
| `typescript.md` | `**/*.ts`, `**/*.vue` |
| `vue-patterns.md` | `**/*.vue`, `packages/ui/**` |
| `security.md` | `**/import*`, `**/persistence*` |

## Lucide Icons

**VERIFY before using any icon:**
1. WebFetch `https://lucide.dev/icons/{icon-name}`
2. Or Grep existing usage in codebase

Common mistakes: `code-2` → use `braces`, `list-check` → use `list-todo`

## Quick Reference

```
packages/
├── core/     → Business logic, types, registries
├── ui/       → Design system, components
└── platform/ → Storage adapters (IndexedDB, Tauri FS)

apps/
├── web/      → PWA application
└── desktop/  → Tauri macOS app
```

**Canvas elements** = lightweight primitives (shapes, arrows, freehand)
**Modules/Widgets** = rich interactive components (Todo, Text, etc.)

Both share z-index space and persist in `.boardkit`.
