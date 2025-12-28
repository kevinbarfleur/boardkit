# Canvas Native Elements — Full Specification

## Overview

This document specifies the native canvas elements feature for Boardkit V0.
Native elements are lightweight primitives (shapes, lines, text, freehand) that exist
alongside widgets but are NOT modules.

---

## Data Model

### Element Types

```typescript
type ElementType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'draw' | 'text'
```

### Base Element

All elements share these properties:

| Property   | Type           | Description                          |
|------------|----------------|--------------------------------------|
| `id`       | `string`       | Unique identifier (nanoid)           |
| `type`     | `ElementType`  | Element type discriminator           |
| `rect`     | `Rect`         | Bounding box (x, y, width, height)   |
| `zIndex`   | `number`       | Stacking order (shared with widgets) |
| `style`    | `ElementStyle` | Visual properties                    |
| `locked`   | `boolean?`     | Optional: prevent modifications      |

### Element Style

| Property      | Type             | Default     | Description                    |
|---------------|------------------|-------------|--------------------------------|
| `strokeColor` | `string`         | `'#ffffff'` | CSS color for stroke           |
| `strokeWidth` | `number`         | `2`         | Stroke thickness (1-8)         |
| `fillColor`   | `string \| null` | `null`      | Fill color (null = no fill)    |
| `opacity`     | `number`         | `1`         | Element opacity (0-1)          |

### Shape Elements (Rectangle, Ellipse)

Additional properties:

| Property       | Type      | Description                         |
|----------------|-----------|-------------------------------------|
| `label`        | `string?` | Optional centered text label        |
| `cornerRadius` | `number?` | Border radius (rectangles only)     |

### Line Elements (Line, Arrow)

Additional properties:

| Property    | Type                                     | Description           |
|-------------|------------------------------------------|-----------------------|
| `points`    | `{ start: Point; end: Point }`           | Start and end coords  |
| `arrowHead` | `'none' \| 'end' \| 'start' \| 'both'`   | Arrowhead placement   |

Note: `rect` is the computed bounding box of the line.

### Draw Elements (Freehand)

Additional properties:

| Property | Type      | Description                      |
|----------|-----------|----------------------------------|
| `points` | `Point[]` | Array of path points (x, y)      |

### Text Elements

Additional properties:

| Property     | Type                              | Default    | Description           |
|--------------|-----------------------------------|------------|-----------------------|
| `content`    | `string`                          | `''`       | Text content          |
| `fontSize`   | `number`                          | `16`       | Font size (12-72)     |
| `fontWeight` | `'normal' \| 'medium' \| 'bold'`  | `'normal'` | Font weight           |
| `textAlign`  | `'left' \| 'center' \| 'right'`   | `'left'`   | Text alignment        |

---

## Board Background

```typescript
interface BoardBackground {
  pattern: 'dots' | 'grid' | 'none'
  color: string  // Background color (default: '#0a0a0a')
}
```

| Pattern | Description                                    |
|---------|------------------------------------------------|
| `dots`  | Dot grid pattern (default, current behavior)   |
| `grid`  | Line grid pattern                              |
| `none`  | No pattern (solid color or transparent)        |

---

## Tools

### Tool Types

```typescript
type ToolType = 'select' | 'hand' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'pencil' | 'text'
```

### Tool Behavior

| Tool      | Shortcut | Click              | Drag                        |
|-----------|----------|--------------------|-----------------------------|
| Select    | V        | Select element     | Move or resize element      |
| Hand      | H        | —                  | Pan canvas                  |
| Rectangle | R        | —                  | Draw rectangle from corner  |
| Ellipse   | O        | —                  | Draw ellipse from corner    |
| Line      | L        | —                  | Draw line start to end      |
| Arrow     | A        | —                  | Draw arrow start to end     |
| Pencil    | P        | —                  | Freehand stroke             |
| Text      | T        | Place text element | —                           |

### Modifier Keys

| Modifier   | Effect                                            |
|------------|---------------------------------------------------|
| `Shift`    | Constrain proportions (square, circle, 45° line)  |
| `Escape`   | Cancel current drawing operation                  |

---

## Selection Model

### Unified Selection

Selection can be either a widget OR an element (not both):

```typescript
type SelectionTarget =
  | { type: 'widget'; id: string }
  | { type: 'element'; id: string }
  | null
```

### Selection Behavior

- Click on element → select element (deselect widget if any)
- Click on widget → select widget (deselect element if any)
- Click on empty canvas → clear selection
- `Escape` key → clear selection

### Selection Visual

Selected elements display:
- Stroke highlight (primary color)
- Resize handles at corners and edges
- Bounding box for non-rectangular elements

---

## Actions

### Tool Actions

| Action ID        | Title           | Shortcut | Context |
|------------------|-----------------|----------|---------|
| `tool.select`    | Select Tool     | V        | global  |
| `tool.hand`      | Hand Tool       | H        | global  |
| `tool.rectangle` | Rectangle Tool  | R        | global  |
| `tool.ellipse`   | Ellipse Tool    | O        | global  |
| `tool.line`      | Line Tool       | L        | global  |
| `tool.arrow`     | Arrow Tool      | A        | global  |
| `tool.pencil`    | Pencil Tool     | P        | global  |
| `tool.text`      | Text Tool       | T        | global  |

### Element Actions

| Action ID               | Title           | Shortcut | When               |
|-------------------------|-----------------|----------|--------------------|
| `element.duplicate`     | Duplicate       | ⌘D       | element selected   |
| `element.delete`        | Delete          | ⌫        | element selected   |
| `element.bring-to-front`| Bring to Front  | —        | element selected   |
| `element.send-to-back`  | Send to Back    | —        | element selected   |

### Background Actions

| Action ID             | Title          | Context |
|-----------------------|----------------|---------|
| `background.dots`     | Dots Pattern   | global  |
| `background.grid`     | Grid Pattern   | global  |
| `background.none`     | No Pattern     | global  |

---

## Context Menus

### Canvas Context Menu (right-click on empty canvas)

- Add Rectangle
- Add Ellipse
- Add Text
- ---
- Paste (if clipboard has element)
- ---
- Reset View

### Element Context Menu (right-click on element)

- Duplicate
- Delete
- ---
- Bring to Front
- Send to Back
- ---
- Edit Style...

---

## Toolbar

### Position

Fixed position at bottom-center of the viewport, floating above the canvas.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ [V] [H] │ [□] [○] [╱] [→] [✎] [T] │ [Style▼] [BG▼] │
└─────────────────────────────────────────────────────────┘
```

- Tool buttons show active state (ring highlight)
- Tooltips show tool name + shortcut
- Style button opens style popover
- BG button opens background popover

### Style Popover

- Stroke color (preset palette)
- Fill toggle + color
- Stroke width (S/M/L buttons)
- Opacity slider

### Background Popover

- Pattern selector (dots/grid/none)
- Color picker (for solid background)

---

## Rendering

### SVG Layer

Elements are rendered in an SVG layer that:
- Shares the same CSS transform as the widget layer
- Is positioned below widgets by default (but z-index controls final order)
- Uses `pointer-events: none` on container, `pointer-events: auto` on elements

### Element Rendering

| Type      | SVG Element                    |
|-----------|--------------------------------|
| Rectangle | `<rect>`                       |
| Ellipse   | `<ellipse>`                    |
| Line      | `<line>`                       |
| Arrow     | `<line>` + `<marker>` (arrowhead) |
| Draw      | `<path>` (M/L commands)        |
| Text      | `<foreignObject>` with div     |

### Labels in Shapes

Labels use `<foreignObject>` centered within the shape bounds.

---

## Persistence

### Document Schema (v1)

```typescript
interface BoardState {
  viewport: Viewport
  widgets: Widget[]
  elements: CanvasElement[]     // NEW in v1
  background: BoardBackground   // NEW in v1
}
```

### Migration (v0 → v1)

Documents with `version: 0` are migrated automatically:

```typescript
{
  ...doc,
  version: 1,
  board: {
    ...doc.board,
    elements: [],
    background: { pattern: 'dots', color: '#0a0a0a' },
  },
}
```

### History

Element operations create history entries:
- "Added rectangle"
- "Deleted element"
- "Moved element" (hidden from UI, still in history)
- etc.

---

## Keyboard Shortcuts Summary

### Tool Shortcuts (single key, no modifier)

| Key | Tool      |
|-----|-----------|
| V   | Select    |
| H   | Hand      |
| R   | Rectangle |
| O   | Ellipse   |
| L   | Line      |
| A   | Arrow     |
| P   | Pencil    |
| T   | Text      |

### Element Shortcuts

| Shortcut        | Action                    |
|-----------------|---------------------------|
| Delete / ⌫      | Delete selected element   |
| ⌘D / Ctrl+D     | Duplicate selected        |
| Escape          | Clear selection / cancel  |
| Arrow keys      | Nudge element (1px)       |
| Shift + Arrows  | Nudge element (10px)      |

---

## UI Components

New components in `@boardkit/ui`:

| Component            | Purpose                           |
|----------------------|-----------------------------------|
| `BkToolbar`          | Floating toolbar container        |
| `BkToolButton`       | Tool selection toggle button      |
| `BkColorPicker`      | Preset color palette              |
| `BkSlider`           | Numeric slider                    |
| `ElementRenderer`    | SVG element renderer              |
| `SelectionHandles`   | Resize handles for selection      |

---

## Non-Goals (this version)

- Multi-selection (select multiple elements)
- Grouping elements
- Snapping / alignment guides
- Smart connectors
- Images / media elements
- Layers panel
- Export to PNG/SVG/PDF (may be added later)
