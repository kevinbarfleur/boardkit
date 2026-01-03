<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useBoardStore,
  useToolStore,
  actionRegistry,
  FONT_FAMILY_CSS,
  FONT_FAMILY_LABELS,
  type ToolType,
  type FontFamily,
  type ActionContext,
  TOOL_SHORTCUTS,
  type ElementStyle,
  type StrokeDashType,
  isTextElement as isTextElementType,
} from '@boardkit/core'
import {
  BkToolbar,
  BkToolButton,
  BkDivider,
  BkColorPicker,
  BkSlider,
  BkIcon,
} from '@boardkit/ui'

/**
 * ToolToolbar
 *
 * Floating toolbar for canvas tool selection and styling.
 */

const emit = defineEmits<{
  backgroundClick: []
}>()

const boardStore = useBoardStore()
const toolStore = useToolStore()

const activeTool = computed(() => toolStore.activeTool)
const defaultStyle = computed(() => toolStore.defaultStyle)
const selectedElement = computed(() => boardStore.selectedElement)
const hasSelectedElement = computed(() => selectedElement.value !== null)

// Check if selected element is a text element
const isTextElement = computed(() => selectedElement.value?.type === 'text')

// Current style: uses selected element's style if available, otherwise default style
const currentStyle = computed((): ElementStyle => {
  if (selectedElement.value) {
    return selectedElement.value.style
  }
  return defaultStyle.value
})

// Text-specific properties
const currentFontSize = computed(() => {
  if (selectedElement.value && isTextElementType(selectedElement.value)) {
    return selectedElement.value.fontSize ?? 16
  }
  return 16
})

const currentTextAlign = computed(() => {
  if (selectedElement.value && isTextElementType(selectedElement.value)) {
    return selectedElement.value.textAlign ?? 'left'
  }
  return 'left'
})

const currentFontWeight = computed(() => {
  if (selectedElement.value && isTextElementType(selectedElement.value)) {
    return selectedElement.value.fontWeight ?? 'normal'
  }
  return 'normal'
})

const currentFontFamily = computed((): FontFamily => {
  if (selectedElement.value && isTextElementType(selectedElement.value)) {
    return selectedElement.value.fontFamily ?? 'system'
  }
  return 'system'
})

// Font family options for the selector
const fontFamilyOptions: FontFamily[] = ['system', 'handwritten', 'code', 'serif']

// Stroke dash property
const currentStrokeDash = computed((): StrokeDashType => {
  if (selectedElement.value) {
    return selectedElement.value.style.strokeDash ?? 'solid'
  }
  return defaultStyle.value.strokeDash ?? 'solid'
})

// Roughness property (0-3, default 1)
const currentRoughness = computed((): number => {
  if (selectedElement.value) {
    return selectedElement.value.style.roughness ?? 1
  }
  return defaultStyle.value.roughness ?? 1
})

// Style panel visibility
const showStylePanel = ref(false)

// Close style panel when selection changes
watch(
  () => boardStore.selectedElementId,
  () => {
    showStylePanel.value = false
  }
)

// Tool definitions
const tools: Array<{
  id: ToolType
  icon: string
  label: string
}> = [
  { id: 'select', icon: 'mouse-pointer-2', label: 'Select' },
  { id: 'hand', icon: 'hand', label: 'Hand' },
  { id: 'rectangle', icon: 'square', label: 'Rectangle' },
  { id: 'ellipse', icon: 'circle', label: 'Ellipse' },
  { id: 'line', icon: 'minus', label: 'Line' },
  { id: 'arrow', icon: 'arrow-right', label: 'Arrow' },
  { id: 'pencil', icon: 'pencil', label: 'Pencil' },
  { id: 'text', icon: 'type', label: 'Text' },
]

function selectTool(tool: ToolType) {
  toolStore.setTool(tool)
  // Blur the button to prevent space key conflicts
  // (space should pan the canvas, not re-activate the focused button)
  ;(document.activeElement as HTMLElement)?.blur()
}

function getShortcut(tool: ToolType): string {
  return TOOL_SHORTCUTS[tool]
}

// Generic style property updater - reduces code duplication
function updateStyleProperty<K extends keyof ElementStyle>(
  property: K,
  value: ElementStyle[K]
) {
  // Always update default style for future elements
  toolStore.setDefaultStyle({ [property]: value })

  // Update all selected elements
  for (const id of boardStore.selectedElementIds) {
    const el = boardStore.elements.find(e => e.id === id)
    if (el) {
      boardStore.updateElement(id, { style: { ...el.style, [property]: value } })
    }
  }
}

// Generic text property updater for text-specific properties
function updateTextProperty<K extends 'fontSize' | 'textAlign' | 'fontWeight'>(
  property: K,
  value: K extends 'fontSize' ? number : K extends 'textAlign' ? 'left' | 'center' | 'right' : 'normal' | 'medium' | 'bold'
) {
  for (const id of boardStore.selectedElementIds) {
    const el = boardStore.elements.find(e => e.id === id)
    if (el?.type === 'text') {
      boardStore.updateElement(id, { [property]: value })
    }
  }
}

// Style panel handlers - thin wrappers for type safety
function updateStrokeColor(color: string | null) {
  if (color) updateStyleProperty('strokeColor', color)
}

function updateFillColor(color: string | null) {
  updateStyleProperty('fillColor', color)
}

function updateStrokeWidth(width: number) {
  updateStyleProperty('strokeWidth', width)
}

function updateOpacity(opacity: number) {
  updateStyleProperty('opacity', opacity / 100)
}

function updateStrokeDash(dash: StrokeDashType) {
  updateStyleProperty('strokeDash', dash)
}

function updateRoughness(roughness: number) {
  updateStyleProperty('roughness', roughness)
}

// Text-specific update functions
function updateFontSize(size: number) {
  updateTextProperty('fontSize', size)
}

function updateTextAlign(align: 'left' | 'center' | 'right') {
  updateTextProperty('textAlign', align)
}

function updateFontWeight(weight: 'normal' | 'medium' | 'bold') {
  updateTextProperty('fontWeight', weight)
}

function updateFontFamily(family: FontFamily) {
  for (const id of boardStore.selectedElementIds) {
    const el = boardStore.elements.find(e => e.id === id)
    if (el?.type === 'text') {
      boardStore.updateElement(id, { fontFamily: family })
    }
  }
}

function toggleStylePanel() {
  showStylePanel.value = !showStylePanel.value
}

function handleBackgroundClick() {
  emit('backgroundClick')
}

function handleAddImage() {
  const ctx: ActionContext = {
    selectedWidget: boardStore.selectedWidget,
    selectedWidgetId: boardStore.selectedWidgetId,
    selectedWidgetIds: boardStore.selectedWidgetIds,
    selectedElement: boardStore.selectedElement,
    selectedElementId: boardStore.selectedElementId,
    selectedElementIds: boardStore.selectedElementIds,
    isMultiSelection: boardStore.isMultiSelection,
    selectionCount: boardStore.selectedWidgetIds.length + boardStore.selectedElementIds.length,
    activeTool: toolStore.activeTool,
    viewport: boardStore.viewport,
    widgets: boardStore.widgets,
    elements: boardStore.elements,
    platform: 'web',
    isDirty: boardStore.isDirty,
  }
  actionRegistry.execute('element.add-image', ctx)
}
</script>

<template>
  <BkToolbar position="bottom-center">
    <!-- Tool buttons -->
    <template v-for="(tool, index) in tools" :key="tool.id">
      <!-- Add divider after Hand tool -->
      <BkDivider v-if="index === 2" orientation="vertical" class="mx-1 h-6" />

      <BkToolButton
        :icon="tool.icon"
        :active="activeTool === tool.id"
        :tooltip="tool.label"
        :shortcut="getShortcut(tool.id)"
        @click="selectTool(tool.id)"
      />
    </template>

    <BkDivider orientation="vertical" class="mx-1 h-6" />

    <!-- Image button (action, not a tool) -->
    <BkToolButton
      icon="image"
      tooltip="Add Image"
      @click="handleAddImage"
    />

    <BkDivider orientation="vertical" class="mx-1 h-6" />

    <!-- Style button -->
    <div class="relative">
      <BkToolButton
        icon="palette"
        :active="showStylePanel"
        tooltip="Style"
        @click="toggleStylePanel"
      />

      <!-- Style panel dropdown -->
      <Transition name="fade">
        <div v-if="showStylePanel" class="style-panel">
          <div v-if="hasSelectedElement" class="panel-header">
            Editing selection
          </div>
          <div class="style-section">
            <BkColorPicker
              :model-value="currentStyle.strokeColor"
              label="Stroke"
              @update:model-value="updateStrokeColor"
            />
          </div>

          <div class="style-section">
            <BkColorPicker
              :model-value="currentStyle.fillColor"
              label="Fill"
              show-none
              @update:model-value="updateFillColor"
            />
          </div>

          <div class="style-section">
            <BkSlider
              :model-value="currentStyle.strokeWidth"
              label="Width"
              :min="1"
              :max="8"
              :step="1"
              @update:model-value="updateStrokeWidth"
            />
          </div>

          <div class="style-section">
            <div class="picker-label">Stroke</div>
            <div class="button-group">
              <button
                type="button"
                class="stroke-button"
                :class="{ active: currentStrokeDash === 'solid' }"
                title="Solid"
                @click="updateStrokeDash('solid')"
              >
                <svg width="24" height="4" viewBox="0 0 24 4">
                  <line x1="0" y1="2" x2="24" y2="2" stroke="currentColor" stroke-width="2" />
                </svg>
              </button>
              <button
                type="button"
                class="stroke-button"
                :class="{ active: currentStrokeDash === 'dashed' }"
                title="Dashed"
                @click="updateStrokeDash('dashed')"
              >
                <svg width="24" height="4" viewBox="0 0 24 4">
                  <line x1="0" y1="2" x2="24" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="6 3" />
                </svg>
              </button>
              <button
                type="button"
                class="stroke-button"
                :class="{ active: currentStrokeDash === 'dotted' }"
                title="Dotted"
                @click="updateStrokeDash('dotted')"
              >
                <svg width="24" height="4" viewBox="0 0 24 4">
                  <line x1="0" y1="2" x2="24" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="2 4" />
                </svg>
              </button>
            </div>
          </div>

          <div class="style-section">
            <BkSlider
              :model-value="Math.round(currentStyle.opacity * 100)"
              label="Opacity"
              :min="25"
              :max="100"
              :step="25"
              @update:model-value="updateOpacity"
            />
          </div>

          <div class="style-section">
            <BkSlider
              :model-value="currentRoughness"
              label="Roughness"
              :min="0"
              :max="3"
              :step="0.5"
              @update:model-value="updateRoughness"
            />
          </div>

          <!-- Text-specific options -->
          <template v-if="isTextElement">
            <div class="section-divider" />

            <!-- Font Family Selector -->
            <div class="style-section">
              <div class="picker-label">Font</div>
              <div class="font-family-grid">
                <button
                  v-for="family in fontFamilyOptions"
                  :key="family"
                  type="button"
                  class="font-button"
                  :class="{ active: currentFontFamily === family }"
                  :style="{ fontFamily: FONT_FAMILY_CSS[family] }"
                  :title="FONT_FAMILY_LABELS[family]"
                  @click="updateFontFamily(family)"
                >
                  Aa
                </button>
              </div>
            </div>

            <div class="style-section">
              <BkSlider
                :model-value="currentFontSize"
                label="Font Size"
                :min="12"
                :max="72"
                :step="4"
                @update:model-value="updateFontSize"
              />
            </div>

            <div class="style-section">
              <div class="picker-label">Align</div>
              <div class="button-group">
                <button
                  type="button"
                  class="align-button"
                  :class="{ active: currentTextAlign === 'left' }"
                  title="Align Left"
                  @click="updateTextAlign('left')"
                >
                  <BkIcon icon="align-left" :size="14" />
                </button>
                <button
                  type="button"
                  class="align-button"
                  :class="{ active: currentTextAlign === 'center' }"
                  title="Align Center"
                  @click="updateTextAlign('center')"
                >
                  <BkIcon icon="align-center" :size="14" />
                </button>
                <button
                  type="button"
                  class="align-button"
                  :class="{ active: currentTextAlign === 'right' }"
                  title="Align Right"
                  @click="updateTextAlign('right')"
                >
                  <BkIcon icon="align-right" :size="14" />
                </button>
              </div>
            </div>

            <div class="style-section">
              <div class="picker-label">Weight</div>
              <div class="button-group">
                <button
                  type="button"
                  class="weight-button"
                  :class="{ active: currentFontWeight === 'normal' }"
                  title="Normal"
                  @click="updateFontWeight('normal')"
                >
                  Aa
                </button>
                <button
                  type="button"
                  class="weight-button medium"
                  :class="{ active: currentFontWeight === 'medium' }"
                  title="Medium"
                  @click="updateFontWeight('medium')"
                >
                  Aa
                </button>
                <button
                  type="button"
                  class="weight-button bold"
                  :class="{ active: currentFontWeight === 'bold' }"
                  title="Bold"
                  @click="updateFontWeight('bold')"
                >
                  Aa
                </button>
              </div>
            </div>
          </template>
        </div>
      </Transition>
    </div>

    <!-- Background button -->
    <BkToolButton icon="grid" tooltip="Background" @click="handleBackgroundClick" />
  </BkToolbar>
</template>

<style scoped>
.style-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 180px;
  padding: 12px;
  background-color: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.style-section {
  margin-bottom: 12px;
}

.style-section:last-child {
  margin-bottom: 0;
}

.panel-header {
  font-size: 10px;
  font-weight: 600;
  color: hsl(var(--primary));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid hsl(var(--border));
}

.section-divider {
  height: 1px;
  background: hsl(var(--border));
  margin: 12px 0;
}

.picker-label {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.button-group {
  display: flex;
  gap: 4px;
}

.align-button,
.weight-button {
  flex: 1;
  height: 28px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.align-button:hover,
.weight-button:hover {
  background: hsl(var(--muted));
}

.align-button.active,
.weight-button.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.weight-button {
  font-size: 12px;
}

.weight-button.medium {
  font-weight: 500;
}

.weight-button.bold {
  font-weight: 700;
}

.stroke-button {
  flex: 1;
  height: 28px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.stroke-button:hover {
  background: hsl(var(--muted));
}

.stroke-button.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

/* Font family selector */
.font-family-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.font-button {
  height: 32px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s ease;
}

.font-button:hover {
  background: hsl(var(--muted));
}

.font-button.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
