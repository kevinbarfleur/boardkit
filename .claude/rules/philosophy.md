---
globs: ["packages/core/**", "packages/platform/**", "ARCHITECTURE.md"]
---

# Boardkit Philosophy (Detailed)

## Core Principles (NON-NEGOTIABLE)

### 1. Offline-First
- Application MUST function 100% offline
- No backend dependencies whatsoever
- All data owned by user, stored locally
- Sync = user responsibility (Dropbox, Drive, Git, etc.)
- No "online-only" features allowed

### 2. File-Based Ownership
- `.boardkit` is a portable, deterministic document format
- ZIP container with JSON content
- File integrity and portability are critical
- No magic, no side effects in file operations
- Migrations explicit and versioned

### 3. Single Source of Truth
- One shared document model: Web = Desktop
- No platform-specific branching in core logic
- @boardkit/core is platform-agnostic

### 4. Strict Modularity
- Modules MUST NOT access each other's state directly
- No implicit coupling between modules
- Cross-module = Data Contracts only
- State 100% serializable, no side-effects

### 5. Simplicity Over Cleverness
- No premature abstractions
- 3 similar lines > 1 useless abstraction
- No backwards-compat hacks (delete unused code)
- Readable code = self-documented

## Permanently Out of Scope

These are BLOCKED. Do not implement, do not discuss:

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Multi-user = outside philosophy |
| Backend/Cloud | No Boardkit server, no vendor lock-in |
| User accounts | No authentication, no login |
| Automatic sync | No CRDTs, no conflict resolution |
| Plugin marketplace | No third-party plugin store |
| Monetization | No paid features |
| Analytics/tracking | No user telemetry |

## Decision Framework

When in doubt:
1. Does it work offline? → If no, reject
2. Does it add backend dependency? → If yes, reject
3. Does it break file portability? → If yes, reject
4. Is it the simplest solution? → If no, simplify
5. Can a solo dev maintain it? → If no, reconsider
