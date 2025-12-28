---
name: boardkit-file-format
description: |
  .boardkit file format specification: structure, serialization, versioning, and migration strategies.
  Use when working on import/export, persistence, or file format changes.
allowed-tools: Read, Grep, Glob
---

# Boardkit File Format Skill

## Format Structure
- .boardkit = ZIP archive (but UX as single file)
- Contains: board state, widget data, metadata
- Versioned: formatVersion field for migrations

## Serialization Rules
- Deterministic: same input = same output (no random ordering)
- Atomic writes (desktop) / transactions (IndexedDB)
- History: capped size, consistent snapshots

## Migration Strategy
- Increment formatVersion on changes
- Backward compatibility or clear migration path
- Validation checks on import

## References
- File format spec: SPECS_V0.md or equivalent
- Persistence layer: packages/platform/

