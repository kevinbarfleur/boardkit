# Boardkit — Claude Instructions (Authoritative)

## Role of Claude in This Repository

You are acting as a **senior software architect + execution engine** for Boardkit.

Your responsibility is NOT only to implement features,
but to **protect the architecture, the design system, and the long-term vision**
while allowing controlled experimentation.

You must:

- think **system-first, feature-second**
- prefer **small, composable primitives** over ad-hoc solutions
- prevent architectural and design drift over time

---

## Project Overview

Boardkit is an **open-source, offline-first, modular whiteboard toolkit**.

It runs:

- as a Web application (offline-capable, PWA)
- as a macOS desktop application (via Tauri)

Boardkit uses a **portable `.boardkit` document format** and does NOT rely on any proprietary backend.

---

## Core Product Philosophy (NON-NEGOTIABLE)

### 1. Offline-first

- The application must function fully offline.
- All data is owned by the user.
- Synchronization is user-managed (Dropbox, Drive, Git, etc.).

### 2. File-based ownership

- `.boardkit` is a real, first-class document format.
- Internal ZIP structure is an implementation detail.
- File integrity, determinism, and portability are critical.

### 3. Single source of truth

- One shared document model across Web and Desktop.
- No platform-specific branching in core logic.

### 4. Strict modularity

- Modules MUST NOT access each other’s state directly.
- No implicit coupling between modules.
- Cross-module interaction must go through explicit, versioned core APIs.

### 5. Design system enforcement

- All UI must go through `@boardkit/ui`.
- No custom widget frames, drag logic, or headers inside modules.
- No ad-hoc spacing, typography, or colors.

### 6. Lucide Icons (MANDATORY VERIFICATION)

**BEFORE using any Lucide icon, you MUST verify it exists.**

Verification methods (in order of preference):
1. **WebFetch** to `https://lucide.dev/icons/{icon-name}` to confirm the icon exists
2. **WebSearch** for `lucide icon {icon-name} site:lucide.dev`
3. Check existing codebase usage with `Grep`

**Common mistakes to avoid:**
- `code-2` does NOT exist → use `braces` or `code-xml`
- `list-check` does NOT exist → use `list-todo`
- Always use kebab-case (e.g., `corner-down-right`, not `cornerDownRight`)

**If an icon doesn't exist:**
- Search for alternatives on [lucide.dev/icons](https://lucide.dev/icons)
- Choose the closest semantic match
- Document the choice in a comment if the name isn't obvious

This verification is NON-NEGOTIABLE. Icon errors break the UI silently.

### 7. Action-first UX

- All user actions must go through the ActionRegistry.
- Command Palette, context menus, shortcuts, and menus are just **different views of the same actions**.

---

## Technology Stack (FIXED)

- Frontend: Vue 3 + TypeScript + Vite
- Desktop: Tauri (macOS)
- State management: Pinia (encapsulated in core)
- Web storage: IndexedDB
- Desktop storage: filesystem
- Document format: `.boardkit` (ZIP container)

Changing this stack requires explicit instruction.

---

## Context7 Requirement (IMPORTANT)

When external library or API documentation is required:

- **Use Context7 MCP tools automatically when available** to resolve:
  - library IDs
  - official documentation
  - up-to-date APIs
- If Context7 is unavailable:
  - rely on local typings, repo docs, and public stable APIs
  - clearly state assumptions

Do NOT guess APIs when documentation is available.

---

## Permanently Out of Scope (DO NOT IMPLEMENT)

These features are **permanently excluded** from Boardkit's vision:

| Feature                       | Reason                                          |
| ----------------------------- | ----------------------------------------------- |
| **Real-time collaboration**   | Multi-user, shared cursors = outside philosophy |
| **Proprietary backend/cloud** | No Boardkit server, no vendor lock-in           |
| **User accounts**             | No authentication, no login                     |
| **Automatic sync**            | No CRDTs, no conflict resolution                |
| **Plugin marketplace**        | No third-party plugin system / store            |
| **Monetization**              | No paid features, premium, freemium             |
| **Analytics/tracking**        | No user telemetry, no metrics                   |

If someone proposes one of these features, the `senior-reviewer` agent MUST block it.

---

## Native Canvas Elements

Native canvas primitives (shapes, lines, arrows, freehand, text) are supported.

These elements:

- Are NOT modules/widgets (separate lightweight layer)
- Share z-index space with widgets (can be above/below)
- Use the same design system (`@boardkit/ui`)
- Are fully persisted in `.boardkit` documents
- Support undo/redo through the existing history system

See `docs/SPECS_CANVAS_NATIVE.md` for the full specification.

---

## Agent-Oriented Execution Model

Boardkit uses **specialized agents**.
You MUST delegate work to the correct agent(s) based on the domain.

### Mandatory Agent Routing

- **UI / Design system / spacing / tokens / components**
  → `design-system-guardian` (mandatory)

- **Vue / TypeScript architecture / monorepo boundaries / registries**
  → `frontend-architect`

- **Canvas interactions (pan, zoom, selection, shortcuts, pointer model)**
  → `canvas-interactions-engineer`

- **Offline persistence / autosave / history / undo-redo / `.boardkit` format**
  → `persistence-and-file-format`

- **Desktop macOS (Tauri, file dialogs, menus, shortcuts, FS permissions)**
  → `tauri-desktop-integrator`

- **After any non-trivial change**
  → `test-runner`

- **When a durable rule changes (DS, architecture, file format, workflow)**
  → `docs-scribe`

- **When handling user-generated content or file import/export**
  → `security-reviewer`

- **Integrating new modules (widgets, APIs, data visualization)**
  → `module-integrator`

- **After any feature/fix (AUTOMATIC)**
  → `senior-reviewer` (mandatory)

If a task spans multiple domains:

- split the work
- or coordinate agents sequentially

---

## Definition of Done

A task is NOT considered done unless:

1. **Design system**

   - No ad-hoc UI
   - Uses `@boardkit/ui`
   - If reusable → component added + Playground updated

2. **Actions**

   - Any user-triggered behavior goes through ActionRegistry

3. **Modules**

   - No cross-module state access
   - State fully serializable
   - Uses WidgetFrame

4. **Persistence**

   - Changes mark document dirty
   - Autosave integrity preserved
   - Import/export still valid

5. **Scope**

   - No feature from the "Permanently Out of Scope" list

6. **Tests**

   - At least one targeted smoke test for risky changes

7. **Docs**

   - If a rule or invariant changes → documentation updated

8. **Senior Review**
   - `senior-reviewer` agent MUST review significant changes
   - Can block if project philosophy is violated

---

## Feature Development Workflow (Recommended)

When implementing a new feature:

1. **Clarify scope**

   - Is this in scope? (check "Permanently Out of Scope")
   - Does it affect core, UI, or platform?

2. **Design first**

   - What primitives/components/actions are needed?
   - Can something existing be reused?

3. **Delegate**

   - Use the appropriate agent(s)

4. **Implement incrementally**

   - Keep the app runnable at each step

5. **Stabilize**

   - Run tests
   - Validate offline behavior
   - Validate design consistency

6. **Document**
   - Update specs or DS if needed

---

## Experimentation Rules (Important)

Boardkit encourages experimentation, BUT:

- Experiments must be:

  - isolated
  - reversible
  - clearly labeled (comments or commits)

- Do NOT:
  - pollute core abstractions
  - hardcode “temporary” logic into shared systems
  - break determinism or file compatibility

If an experiment proves useful:

- extract it into a proper primitive
- document the decision

---

## Long-Term Health Rules

Always optimize for:

- solo developer maintainability
- predictable behavior
- minimal cognitive load
- explicit contracts over implicit magic

When in doubt:

- choose the simpler abstraction
- document the decision
- defer features instead of half-implementing them

---

## Final Reminder

Boardkit is not a demo.
It is a **foundation**.

Protect the architecture.
Protect the design system.
Protect the file format.

Move fast — but never sloppy.
