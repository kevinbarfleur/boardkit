# Boardkit — Claude Instructions

## Project Overview

Boardkit is an open-source, offline-first, modular whiteboard toolkit.

It runs:

- as a Web application (offline-capable)
- as a macOS desktop application (via Tauri)

It uses a portable `.boardkit` document format and does NOT rely on any proprietary backend.

This repository targets **V0 only**.
Do not implement speculative features beyond the defined scope.

---

## Core Principles (NON-NEGOTIABLE)

Always use context7 when I need library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.

1. **Offline-first**

   - The application must function fully offline.
   - Synchronization is user-owned (Dropbox, Drive, Git, etc.).

2. **Single source of truth**

   - One shared document model across Web and Desktop.
   - No platform-specific branching in core logic.

3. **Strict modularity**

   - Modules must not access each other’s state directly.
   - No implicit coupling between modules.

4. **Design system enforcement**

   - All modules must use shared UI components.
   - No custom widget frames, drag logic, or headers.

5. **File-based philosophy**
   - `.boardkit` is a real document type.
   - Internal ZIP structure is an implementation detail.

---

## Technology Stack (FIXED)

- Frontend: Vue 3 + TypeScript + Vite
- Desktop: Tauri (macOS)
- State management: Pinia (encapsulated in core)
- Web storage: IndexedDB
- Desktop storage: filesystem
- Document format: `.boardkit` (ZIP container)

---

## Explicitly Out of Scope (DO NOT IMPLEMENT)

- Real-time collaboration
- Authentication or user accounts
- Cloud backend or sync service
- CRDTs or automatic conflict resolution
- Native macOS widgets
- Freehand drawing / Excalidraw-like canvas
- Plugin marketplace UI

If a feature is not explicitly described in `SPECS_V0.md`, assume it is out of scope.
