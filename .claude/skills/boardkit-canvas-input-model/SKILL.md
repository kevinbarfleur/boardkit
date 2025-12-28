---
name: boardkit-canvas-input-model
description: |
  Canvas input model and interaction patterns: pan/zoom, pointer events, keyboard shortcuts, selection, and gesture handling.
  Use when working on canvas interactions, navigation, or input handling.
allowed-tools: Read, Grep, Glob
---

# Boardkit Canvas Input Model Skill

## Core Interactions
- Pan: mouse drag, trackpad drag, space+drag
- Zoom: wheel, pinch, Cmd/Ctrl +/-
- Selection: click, drag-select, Cmd/Ctrl+click
- Keyboard shortcuts: Cmd+K (command palette), Esc, Delete, Duplicate

## Input Model Rules
- Widget scroll vs canvas pan: prevent conflicts
- Focus management: when widgets are focused vs canvas
- Shortcuts: must go through ActionRegistry when applicable
- Web + Desktop parity: same behavior except OS constraints

## References
- Canvas component: apps/web/src/components/BoardCanvas.vue (or equivalent)
- Widget frame: apps/web/src/components/WidgetFrame.vue (or equivalent)

