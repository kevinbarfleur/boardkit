# Boardkit Design System

This document defines the complete design tokens, component guidelines, spacing rules, and implementation patterns for the Boardkit application.

---

## Design Philosophy

### Chalk Edition
Boardkit uses the **Chalk Edition** design language — a monochromatic, typography-focused aesthetic that prioritizes:
- **Inverted primary**: Primary actions use white/light backgrounds with dark text (not colored buttons)
- **Border-based focus**: Focus states use visible borders, not rings
- **Serif typography**: Titles and headings use Source Serif 4 for a refined, professional feel
- **Grain texture**: Subtle noise overlay adds tactile depth to the interface

### Compact by Default (App Density)
Boardkit is a canvas-first application. UI controls must feel light, compact, and never dominate the infinite canvas workspace.

### Calm Surfaces, Clear Hierarchy
We use subtle surface layering and minimal borders instead of heavy shadows. The dark theme creates depth through carefully controlled contrast levels.

### Semantic Tokens
All design tokens are semantic (background/foreground/border/input/etc.) enabling theme changes without refactoring components.

### Consistency Over Custom Styling
No ad-hoc paddings, font sizes, radii, or random colors. Every value used repeatedly becomes a documented token or rule.

---

## Implementation Rules (Non-negotiable)

- **All spacing must use the spacing scale** (multiples of 4px: `p-2`, `gap-4`, etc.)
- **No inline styles** except for dynamic positioning (widget coordinates)
- **No arbitrary values** (e.g. `p-[13px]`, `text-[15px]`) unless documented
- **Default density is Compact** - h-9 buttons, h-9 icon buttons, compact padding
- **Use semantic design tokens** - never hard-code colors like `bg-white` or `text-gray-500`

---

## Color System

### Palette Architecture (Chalk Edition)

**Total Colors: 5**
- 1 Primary: Inverted white/light (`#e5e5e5`) — NOT blue
- 3 Neutrals: Deep charcoal, dark gray, medium gray
- 1 Destructive accent: Red (`#ef4444`)

**Why This Palette:**
- Monochromatic and professional
- High contrast for accessibility
- Inverted primary (white bg, dark text) creates clear affordance
- No colored buttons — clean, focused aesthetic
- Gradients are avoided entirely

### Design Tokens (CSS Variables)

All tokens are defined in `globals.css`:

```css
:root {
  /* CHALK EDITION - Core surfaces */
  --background: 0 0% 9%;              /* #171717 - charcoal canvas */
  --foreground: 0 0% 90%;             /* #e5e5e5 - off-white text */

  /* Secondary surfaces */
  --card: 0 0% 10%;                   /* #1a1a1a - elevated bg */
  --muted: 0 0% 13%;                  /* #222222 - widget backgrounds */
  --muted-foreground: 0 0% 64%;       /* #a3a3a3 - secondary text */

  /* Interactive elements - INVERTED PRIMARY */
  --primary: 0 0% 90%;                /* #e5e5e5 - white/light primary */
  --primary-foreground: 0 0% 9%;      /* #171717 - dark text on primary */

  /* Hover states */
  --accent: 0 0% 14%;                 /* #242424 - hover background */
  --accent-foreground: 0 0% 98%;      /* #fafafa - text on accent */

  /* Borders */
  --border: 0 0% 18%;                 /* #2e2e2e - subtle borders */
  --border-strong: 0 0% 25%;          /* #404040 - focus/active borders */
  --ring: 0 0% 90%;                   /* #e5e5e5 - white ring (rarely used) */

  /* Functional colors */
  --destructive: 0 84% 60%;           /* #ef4444 - delete/danger */
  --destructive-foreground: 0 0% 98%;

  /* Typography */
  --font-serif: 'Source Serif 4', serif;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Radius */
  --radius: 0.5rem;                   /* 8px base radius */
}
```

### Color Usage Guidelines

**Text Hierarchy:**
- Primary text: `text-foreground` (#ededed)
- Secondary text: `text-muted-foreground` (#737373)
- Placeholder text: `text-muted-foreground/50` (50% opacity)

**Backgrounds:**
- Canvas: `bg-background` (#0a0a0a)
- Widgets/Cards: `bg-muted` (#1a1a1a)
- Hover states: `hover:bg-accent` (#262626)
- Selected state: `border-primary` (#e5e5e5)

**Borders:**
- Default: `border-border` (#2e2e2e, 1px)
- Selected: `border-primary` (#e5e5e5, 2px)
- Focus: `border-border-strong` (#404040, 1px) — NO rings

**CRITICAL: Never Override Without Text Color**
If you change a background color, you MUST override the text color to ensure proper contrast.

---

## Border Radius

Goal: Modern and clean, not overly rounded.

**Token:** `--radius: 0.5rem` (8px)

**Utility Class Mapping:**
- `rounded-lg` → `0.5rem` (8px) - topbar, large surfaces, widgets
- `rounded-md` → `0.375rem` (6px) - inputs, small buttons
- `rounded-sm` → `0.25rem` (4px) - small elements
- `rounded-full` → `9999px` - circular icon buttons only

**Usage:**
- Controls (inputs/buttons/menus): `rounded-lg` or `rounded-md`
- Surfaces (cards/modals/widgets): `rounded-lg`
- Icon buttons (undo/redo): `rounded-full`

---

## Typography

### Font Families (Chalk Edition)

**Serif:** Source Serif 4 — for titles, headings, and modal headers
**Sans Serif:** Inter — for body text, controls, and labels
**Monospace:** Geist Mono — for code elements

**Application:**
- `font-serif`: Titles, widget headers, modal headers
- `font-sans`: Body text, buttons, inputs, labels
- `font-mono`: Code blocks, technical values

### Font Sizes

| Usage | Class | Size | Where Used |
|-------|-------|------|------------|
| Controls/Body | `text-sm` | 14px | Buttons, inputs, body text |
| Labels/Hints | `text-xs` | 12px | Input labels, hints |
| Widget Titles | `text-lg` | 18px | Widget headers |
| Base | `text-base` | 16px | Dialog content (rare) |

**Rule:** Default to `text-sm` (14px) for all UI controls to maintain compact density.

### Font Weights

| Usage | Class | Weight |
|-------|-------|--------|
| Body text | `font-normal` | 400 |
| Titles/Labels | `font-medium` | 500 |
| Emphasis (rare) | `font-semibold` | 600 |

### Line Height

- Body text: `leading-relaxed` (1.625) for readability
- Compact elements: `leading-none` (1) for icons
- Default: UnoCSS default leading based on font size

---

## Spacing & Density

Base spacing grid: **4px** (UnoCSS default: `1` = 0.25rem = 4px)

### Component Heights (Compact Default)

| Component | Height | Class |
|-----------|--------|----------------|
| Topbar | 56px | `h-14` |
| Button (default) | 36px | `h-9` |
| Button (sm) | 32px | `h-8` |
| Button (lg) | 40px | `h-10` |
| Icon Button (default) | 36px | `size-9` |
| Icon Button (sm) | 32px | `size-8` |
| Icon Button (lg) | 40px | `size-10` |
| Input | 36px | `h-9` |
| Widget header | auto | Based on content |

**Philosophy:** Compact but breathable - no cramped 24px buttons.

### Padding Scale

| Context | Classes | Pixels | Usage |
|---------|---------|--------|-------|
| Minimal | `p-2` | 8px | Tight spacing |
| Compact | `p-3` | 12px | Small elements |
| Standard | `p-4` | 16px | Default padding |
| Large | `p-6` | 24px | Dialogs, modals |

**Specific Component Padding:**
- Topbar: `px-4` (16px horizontal)
- Buttons: `px-4 py-2` (16px horizontal, 8px vertical)
- Widgets: `p-4` (16px all around)
- Dialog: `p-6` (24px for generous breathing room)
- Inputs: `px-3` (12px horizontal)

### Gap Scale

| Context | Class | Pixels | Usage |
|---------|-------|--------|-------|
| Inline groups | `gap-2` | 8px | Button groups, icon pairs |
| Small sections | `gap-3` | 12px | Form fields |
| Standard | `gap-4` | 16px | Topbar elements, general layout |
| Large sections | `gap-6` | 24px | Dialog sections |

**Rule:** Prefer `gap` over margin for spacing between flex/grid children.

---

## Shadows & Elevation

**Philosophy:** Flat and minimal - borders define separation, not shadows.

**Shadow Usage:**
- Default: No shadow (`shadow-none` implicit)
- Widgets: No shadow (borders only)
- Dialogs/Modals: Subtle shadow if needed (use backdrop blur instead)
- Canvas: Grid pattern provides depth

**Why No Shadows:**
- Maintains clean, professional aesthetic
- Reduces visual noise
- Borders + background layers provide sufficient hierarchy

---

## Grain Texture (Chalk Edition)

A subtle noise overlay is applied globally to add tactile depth:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,..."); /* SVG noise pattern */
}
```

**Rules:**
- Opacity: 0.06 (very subtle)
- Mix-blend-mode: overlay
- Z-index: 9999 (above all content)
- Pointer-events: none (doesn't interfere with interactions)

---

## Layout Structure

### Topbar

**Structure:**
```
Fixed header spanning full width
Layout: Flexbox with space-between
Left: Logo + Board name + Add Widget button
Right: Undo/Redo + Theme toggle
```

**Implementation:**
- Position: `fixed top-0 left-0 right-0`
- Height: `h-14` (56px)
- Background: `bg-background`
- Border: `border-b border-border`
- Z-index: `z-50` (above canvas)
- Padding: `px-4`
- Gap: `gap-4` between sections

### Canvas

**Structure:**
```
Infinite scrollable workspace
Grid pattern background
Absolute-positioned widgets
Pan and zoom enabled
```

**Implementation:**
- Position: `absolute inset-0` (fills viewport below topbar)
- Background: Radial gradient dot pattern
- Overflow: `overflow-hidden`
- Transform origin: Center for zoom
- Grid: 20px spacing, white dots at 10% opacity

**Grid Pattern CSS:**
```css
background-image: radial-gradient(
  circle,
  rgba(255, 255, 255, 0.1) 1px,
  transparent 1px
);
background-size: 20px 20px;
```

### Widgets

**Structure:**
```
Absolute positioned cards
Draggable via header
Resizable (future)
Fixed width: 320px
```

**Implementation:**
- Position: `absolute` with dynamic `left`/`top`
- Width: `w-80` (320px fixed)
- Background: `bg-muted` (#1a1a1a)
- Border: `border border-border`
- Border radius: `rounded-lg`
- Padding: `p-4`
- Cursor: `cursor-move` for draggability
- Selected state: `border-2 border-primary`

### Dialogs/Modals

**Structure:**
```
Centered overlay
Dark backdrop with blur
Content card with padding
Footer with action buttons
```

**Implementation:**
- Overlay: `bg-black/80` (80% opacity black)
- Content: `bg-muted` with `rounded-lg`
- Padding: `p-6`
- Gap: `gap-6` between sections
- Max width: `sm:max-w-[425px]`

---

## Interactive States

### Hover

**Default Pattern:**
```vue
hover:bg-accent hover:text-accent-foreground
```

**Usage:**
- Buttons: Background shifts to #262626
- Widgets: Border becomes slightly more visible
- Menu items: Subtle background highlight

**Transition:**
- Duration: 150ms (default)
- Property: `transition-colors`

### Focus (Chalk Edition)

**Pattern (Border-based):**
```vue
focus-visible:outline-none
focus-visible:border-border-strong
```

**Rules:**
- Always use `focus-visible` (not `focus`) to avoid mouse focus indicators
- Focus uses stronger border color (`--border-strong`)
- NO ring utilities — border-based focus only
- Consistent across all interactive elements

### Active/Selected

**Widget Selected State:**
```vue
border-2 border-primary
```

**Button Active:**
```vue
active:scale-[0.98]
```

### Disabled

**Pattern:**
```vue
disabled:pointer-events-none
disabled:opacity-50
```

---

## Component Specifications

### Topbar

**Anatomy:**
- Left section: Logo (grid icon) + Board name + Add Widget button
- Right section: Undo button + Redo button + Theme toggle

**Classes:**
```vue
fixed top-0 left-0 right-0 z-50
h-14 border-b border-border bg-background
flex items-center justify-between px-4 gap-4
```

**Buttons:**
- Add Widget: Primary button (`bg-primary`)
- Undo/Redo: Icon buttons (`rounded-full`)
- Theme toggle: Icon button with sun/moon icon

### Canvas

**Features:**
- Infinite pan (drag with mouse)
- Zoom in/out (Cmd/Ctrl + scroll or +/- keys)
- Grid snapping (optional)
- Transform state: `{ x, y, zoom }`

**Zoom Indicator:**
```vue
fixed bottom-4 right-4 z-50
bg-muted border border-border rounded-lg
px-3 py-1.5 text-sm
```

### Widgets

**Types:**
1. Text Note
2. Todo List
3. (Extensible for more types)

**Header:**
```vue
flex items-center justify-between
cursor-move (for drag handle)
mb-2 (separation from content)
```

**Content:**
```vue
Scrollable if content exceeds height
text-sm for body text
```

**Actions:**
- Delete: Small button with trash icon
- Drag: Entire header is drag handle

### Buttons

**Complete Button Anatomy (Vue):**

```vue
<!-- Base classes (always applied) -->
inline-flex items-center justify-center gap-2 whitespace-nowrap
rounded-md text-sm font-medium transition-all
border border-transparent
disabled:pointer-events-none disabled:opacity-50
shrink-0

<!-- Focus states (Chalk Edition: border-based) -->
focus-visible:outline-none focus-visible:border-border-strong
```

**Available Variants:**

**`variant="default"` (Primary):**
```vue
bg-primary text-primary-foreground hover:bg-primary/90
```

**`variant="destructive"` (Danger):**
```vue
bg-destructive text-white hover:bg-destructive/90
focus-visible:ring-destructive/20
```

**`variant="outline"`:**
```vue
border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground
```

**`variant="secondary"`:**
```vue
bg-secondary text-secondary-foreground hover:bg-secondary/80
```

**`variant="ghost"` (most used in Boardkit):**
```vue
hover:bg-accent hover:text-accent-foreground
```

**`variant="link"`:**
```vue
text-primary underline-offset-4 hover:underline
```

**Available Sizes:**

**`size="default"`:**
```vue
h-9 px-4 py-2
```

**`size="sm"` (compact):**
```vue
h-8 rounded-md gap-1.5 px-3
```

**`size="lg"` (large):**
```vue
h-10 rounded-md px-6
```

**`size="icon"` (standard circular button):**
```vue
size-9  <!-- equivalent to h-9 w-9 (36px) -->
```

**`size="icon-sm"` (compact circular button):**
```vue
size-8  <!-- equivalent to h-8 w-8 (32px) -->
```

**`size="icon-lg"` (large circular button):**
```vue
size-10  <!-- equivalent to h-10 w-10 (40px) -->
```

**Usage Examples in Boardkit:**

```vue
<!-- Primary button with icon (topbar) -->
<BkButton>
  <BkIcon icon="plus" />
  Add Widget
</BkButton>

<!-- Circular icon button (undo/redo) -->
<BkButton variant="ghost" size="icon">
  <BkIcon icon="rotate-ccw" />
</BkButton>

<!-- Destructive button in widget -->
<BkButton variant="ghost" size="icon-sm">
  <BkIcon icon="trash-2" />
</BkButton>
```

### Inputs

**Complete Input Anatomy:**

```vue
<!-- Base classes -->
h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1
text-sm transition-colors outline-none

<!-- Border and background -->
border-border

<!-- Focus states (Chalk Edition: border-based) -->
focus-visible:outline-none focus-visible:border-border-strong

<!-- Placeholder -->
placeholder:text-muted-foreground

<!-- Disabled states -->
disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
```

**Size:** `h-9` (36px)

**Padding:** `px-3` (12px horizontal)

**Usage in Boardkit:**
```vue
<BkInput
  placeholder="Board name"
  class="border-border"
/>
```

**With leading icon (search, etc.):**
```vue
<div class="relative">
  <BkIcon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  <BkInput class="pl-9" placeholder="Search..." />
</div>
```

### Textarea

**Complete Anatomy:**

```vue
<!-- Inherits all Input classes, plus: -->
min-h-[80px] resize-none

<!-- Allows vertical resize if needed -->
resize-y  <!-- alternative variant -->
```

**Usage in Boardkit (text note widget):**
```vue
<BkTextarea
  placeholder="Type your note here..."
  class="min-h-[200px]"
/>
```

### Dialogs

**Complete Dialog Anatomy:**

**DialogOverlay (backdrop):**
```vue
fixed inset-0 z-50 bg-black/50
```

**DialogContent (main content):**
```vue
<!-- Positioning -->
fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]

<!-- Size and spacing -->
w-full max-w-[calc(100%-2rem)] sm:max-w-lg
gap-4 p-6

<!-- Style -->
bg-background border rounded-lg shadow-lg

<!-- Layout -->
grid  <!-- for children (header, body, footer) -->
```

**DialogHeader:**
```vue
flex flex-col gap-2 text-center sm:text-left
```

**DialogTitle:**
```vue
text-lg leading-none font-semibold
```

**DialogDescription:**
```vue
text-muted-foreground text-sm
```

**DialogFooter:**
```vue
flex flex-col-reverse gap-2 sm:flex-row sm:justify-end
```

**Close button (X):**
```vue
<!-- Position -->
absolute top-4 right-4

<!-- Style -->
rounded-sm opacity-70 transition-opacity hover:opacity-100

<!-- Focus -->
focus:outline-none focus:border-border-strong
```

**Complete Dialog Structure in Boardkit:**
```vue
<BkModal :open="isOpen" @close="close">
  <template #header>
    <h2 class="text-lg font-semibold">Add Widget</h2>
    <p class="text-sm text-muted-foreground">
      Choose a widget type to add to your board
    </p>
  </template>

  <div class="flex flex-col gap-4">
    <!-- Content -->
  </div>

  <template #footer>
    <BkButton variant="outline" @click="close">
      Cancel
    </BkButton>
    <BkButton @click="handleSubmit">
      Add Widget
    </BkButton>
  </template>
</BkModal>
```

---

## Component Classes Reference

### Dropdown Menu / Context Menu

```vue
<!-- DropdownMenuContent / ContextMenuContent -->
z-50 min-w-[8rem] overflow-hidden rounded-md border
bg-popover p-1 text-popover-foreground shadow-md

<!-- DropdownMenuItem / ContextMenuItem -->
relative flex cursor-default select-none items-center
gap-2 rounded-sm px-2 py-1.5 text-sm outline-none
transition-colors
focus:bg-accent focus:text-accent-foreground
data-[disabled]:pointer-events-none data-[disabled]:opacity-50

<!-- DropdownMenuSeparator -->
-mx-1 my-1 h-px bg-muted

<!-- DropdownMenuLabel -->
px-2 py-1.5 text-sm font-semibold

<!-- DropdownMenuShortcut (keyboard shortcuts display) -->
ml-auto text-xs tracking-widest opacity-60
```

### Tooltip

```vue
<!-- TooltipContent -->
z-50 overflow-hidden rounded-md border bg-popover
px-3 py-1.5 text-sm text-popover-foreground shadow-md
```

### Command Palette (Cmd+K)

```vue
<!-- CommandInput -->
flex h-10 w-full rounded-md bg-transparent py-3 text-sm
outline-none placeholder:text-muted-foreground
disabled:cursor-not-allowed disabled:opacity-50

<!-- CommandList -->
max-h-[300px] overflow-y-auto overflow-x-hidden

<!-- CommandEmpty -->
py-6 text-center text-sm text-muted-foreground

<!-- CommandGroup -->
overflow-hidden p-1 text-foreground

<!-- CommandGroup heading -->
px-2 py-1.5 text-xs font-medium text-muted-foreground

<!-- CommandItem -->
relative flex cursor-default select-none items-center
gap-2 rounded-sm px-2 py-1.5 text-sm outline-none
aria-selected:bg-accent aria-selected:text-accent-foreground
data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50

<!-- CommandSeparator -->
-mx-1 h-px bg-border
```

### Separator (Divider)

```vue
<!-- Horizontal (default) -->
shrink-0 bg-border h-px w-full

<!-- Vertical -->
shrink-0 bg-border w-px h-full
```

### Checkbox

```vue
<!-- Base -->
h-4 w-4 shrink-0 rounded-sm border border-primary
focus-visible:outline-none focus-visible:border-border-strong
disabled:cursor-not-allowed disabled:opacity-50

<!-- Checked state -->
data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground
```

---

## Custom Boardkit Components

### Widget Container

```vue
<!-- Main container -->
absolute  <!-- dynamic positioning with left/top -->
w-80      <!-- fixed width 320px -->
bg-muted  <!-- dark gray background -->
border border-border
rounded-lg
p-4
cursor-move  <!-- indicates draggable -->
transition-colors

<!-- Selected state -->
border-2 border-primary  <!-- when widget.selected === true -->

<!-- Hover state (when not selected) -->
hover:border-muted-foreground/50

<!-- Header (drag handle) -->
flex items-center justify-between mb-2

<!-- Title -->
text-lg font-medium

<!-- Delete button -->
<BkButton variant="ghost" size="icon-sm">
  <BkIcon icon="trash-2" />
</BkButton>
```

### Board Canvas

```vue
<!-- Container -->
absolute inset-0  <!-- fills all space below topbar -->
overflow-hidden

<!-- Background with grid -->
bg-background
background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)
background-size: 20px 20px

<!-- Transform for pan/zoom -->
transform: translate(Xpx, Ypx) scale(zoom)
transform-origin: center
```

### Topbar

```vue
<!-- Container -->
fixed top-0 left-0 right-0 z-50
h-14
border-b border-border bg-background
flex items-center justify-between
px-4 gap-4

<!-- Logo -->
h-6 w-6 text-primary

<!-- Board name -->
text-sm font-medium

<!-- Button group -->
flex items-center gap-2
```

---

## Icons

All icons use Lucide via `lucide-vue-next`. The `BkIcon` component wraps Lucide icons with consistent sizing.

```vue
<BkIcon icon="plus" size="sm" />
```

**Sizes:**
- `xs`: 12px (`size-3`)
- `sm`: 16px (`size-4`) - default
- `md`: 20px (`size-5`)
- `lg`: 24px (`size-6`)

**Rules:**
- Default icon size in UI controls: 16px
- StrokeWidth: 1.5 (thinner for modern look)
- Secondary icons: `opacity-50`

---

## Dark Mode

Dark mode is the default for Boardkit (canvas-first design).

- Components must rely on semantic tokens (no hard-coded grays)
- Deep black background (#0a0a0a) for maximum contrast
- Subtle borders (#262626)

---

## Accessibility

### Focus states

All interactive elements must have visible focus states:

```vue
focus-visible:outline-none focus-visible:border-border-strong
```

### ARIA

Icon buttons require `aria-label`:

```vue
<BkIconButton aria-label="Delete item">
  <BkIcon icon="trash-2" />
</BkIconButton>
```

### Keyboard

- `Tab` / `Shift+Tab`: focus traversal
- `Enter` / `Space`: activate
- `Escape`: close dialogs/menus/context menus
- `Arrow keys`: navigate menu items / command palette

---

## Conclusion

This design system prioritizes:
- **Consistency** through semantic tokens
- **Density** with compact but comfortable sizing
- **Clarity** via minimal shadows and strong contrast
- **Accessibility** with proper focus states and keyboard navigation
- **Scalability** through modular component architecture

Every design decision supports the core goal: an infinite canvas workspace that feels professional, performant, and pleasant to use.
