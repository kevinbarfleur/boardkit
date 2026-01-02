<script setup lang="ts">
/**
 * Demo Toolbar Component
 *
 * Ultra-minimal toolbar with 8 tool buttons.
 * Uses inline SVG icons (no @nuxt/icon dependency).
 */

import { useDemoCanvas, TOOL_SHORTCUTS, type ToolType } from '~/composables/useDemoCanvas'

// Get canvas state from composable (singleton - shared with canvas)
const canvas = useDemoCanvas()

// Tool definitions (no hand tool - not useful for landing demo)
const tools: { type: ToolType; label: string }[] = [
  { type: 'select', label: 'Select' },
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'ellipse', label: 'Ellipse' },
  { type: 'line', label: 'Line' },
  { type: 'arrow', label: 'Arrow' },
  { type: 'pencil', label: 'Pencil' },
  { type: 'text', label: 'Text' },
]

function handleToolClick(tool: ToolType) {
  canvas.setTool(tool)
}
</script>

<template>
  <div class="demo-toolbar">
    <button
      v-for="tool in tools"
      :key="tool.type"
      class="tool-button"
      :class="{ active: canvas.activeTool.value === tool.type }"
      :title="`${tool.label} (${TOOL_SHORTCUTS[tool.type]})`"
      @click="handleToolClick(tool.type)"
    >
      <!-- Select (mouse pointer) -->
      <svg v-if="tool.type === 'select'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        <path d="M13 13l6 6" />
      </svg>

      <!-- Rectangle (square) -->
      <svg v-else-if="tool.type === 'rectangle'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>

      <!-- Ellipse (circle) -->
      <svg v-else-if="tool.type === 'ellipse'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
      </svg>

      <!-- Line (minus) -->
      <svg v-else-if="tool.type === 'line'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
      </svg>

      <!-- Arrow -->
      <svg v-else-if="tool.type === 'arrow'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>

      <!-- Pencil -->
      <svg v-else-if="tool.type === 'pencil'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
      </svg>

      <!-- Text (type) -->
      <svg v-else-if="tool.type === 'text'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" x2="15" y1="20" y2="20" />
        <line x1="12" x2="12" y1="4" y2="20" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.demo-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 2px;
  padding: 6px;
  background: rgba(23, 23, 23, 0.95);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  backdrop-filter: blur(8px);
}

.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-button:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.tool-button.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

/* Responsive - smaller on mobile */
@media (max-width: 520px) {
  .demo-toolbar {
    bottom: 16px;
    padding: 4px;
    gap: 1px;
  }

  .tool-button {
    width: 32px;
    height: 32px;
  }

  .tool-button svg {
    width: 16px;
    height: 16px;
  }
}
</style>
