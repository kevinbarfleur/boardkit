<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useBoardStore,
  useToolStore,
  type ElementStyle,
  type StrokeDashType,
  type FontFamily,
  type FontWeight,
  type TextAlign,
  type TextElement,
  type ImageElement,
  type ImageObjectFit,
  isTextElement,
  isShapeElement,
  isImageElement,
  FONT_FAMILY_LABELS,
  IMAGE_OBJECT_FIT_LABELS,
} from '@boardkit/core'
import {
  BkFormSection,
  BkFormRow,
  BkColorPicker,
  BkSlider,
  BkSelect,
  BkButtonGroup,
  BkIcon,
} from '@boardkit/ui'

/**
 * ElementPropertiesPanel
 *
 * Left sidebar panel for editing element properties.
 * Adapts dynamically based on the current selection:
 * - Shows stroke, fill, opacity, roughness for all elements
 * - Shows text properties for text elements
 * - Handles multi-selection with mixed values
 */

const boardStore = useBoardStore()
const toolStore = useToolStore()

const selectedElements = computed(() => boardStore.selectedElements)
const hasSelection = computed(() => selectedElements.value.length > 0)
const isMultiSelection = computed(() => selectedElements.value.length > 1)

// Check if selection contains text elements
const hasTextElements = computed(() =>
  selectedElements.value.some((el) => el.type === 'text')
)

// Check if selection is ONLY text elements
const isTextOnly = computed(() =>
  selectedElements.value.length > 0 &&
  selectedElements.value.every((el) => el.type === 'text')
)

// Check if selection contains shapes (rectangles/ellipses)
const hasShapeElements = computed(() =>
  selectedElements.value.some((el) => isShapeElement(el))
)

// Check if selection contains images
const hasImageElements = computed(() =>
  selectedElements.value.some((el) => isImageElement(el))
)

// Panel collapsed state
const isCollapsed = ref(false)

// ============================================================================
// Mixed value detection for multi-selection
// ============================================================================

const MIXED = Symbol('mixed')

function getMixedValue<T>(
  getter: (el: typeof selectedElements.value[0]) => T | undefined
): T | typeof MIXED | undefined {
  if (selectedElements.value.length === 0) return undefined
  const first = getter(selectedElements.value[0])
  for (const el of selectedElements.value) {
    if (getter(el) !== first) return MIXED
  }
  return first
}

// ============================================================================
// Style property getters (with mixed value handling)
// ============================================================================

// Stroke color
const strokeColor = computed(() => {
  const value = getMixedValue((el) => el.style.strokeColor)
  return value === MIXED ? undefined : (value ?? '#ffffff')
})
const isStrokeColorMixed = computed(() =>
  getMixedValue((el) => el.style.strokeColor) === MIXED
)

// Stroke width
const strokeWidth = computed(() => {
  const value = getMixedValue((el) => el.style.strokeWidth)
  return value === MIXED ? undefined : (value ?? 2)
})
const isStrokeWidthMixed = computed(() =>
  getMixedValue((el) => el.style.strokeWidth) === MIXED
)

// Fill color
const fillColor = computed((): string | null => {
  const value = getMixedValue((el) => el.style.fillColor)
  return value === MIXED ? null : (value ?? null)
})
const isFillColorMixed = computed(() =>
  getMixedValue((el) => el.style.fillColor) === MIXED
)

// Opacity
const opacity = computed(() => {
  const value = getMixedValue((el) => el.style.opacity)
  return value === MIXED ? undefined : (value ?? 1)
})
const isOpacityMixed = computed(() =>
  getMixedValue((el) => el.style.opacity) === MIXED
)

// Roughness
const roughness = computed(() => {
  const value = getMixedValue((el) => el.style.roughness)
  return value === MIXED ? undefined : (value ?? 1)
})
const isRoughnessMixed = computed(() =>
  getMixedValue((el) => el.style.roughness) === MIXED
)

// Stroke dash
const strokeDash = computed(() => {
  const value = getMixedValue((el) => el.style.strokeDash)
  return value === MIXED ? undefined : (value ?? 'solid')
})
const isStrokeDashMixed = computed(() =>
  getMixedValue((el) => el.style.strokeDash) === MIXED
)

// Rotation (in degrees for display)
const rotationDegrees = computed(() => {
  const value = getMixedValue((el) => el.angle ?? 0)
  if (value === MIXED) return undefined
  return value !== undefined ? Math.round((value * 180) / Math.PI) : 0
})
const isRotationMixed = computed(() =>
  getMixedValue((el) => el.angle) === MIXED
)

// ============================================================================
// Text-specific property getters (ONLY looks at text elements)
// ============================================================================

// Filter to get only text elements from selection
const textElements = computed(() =>
  selectedElements.value.filter((el): el is TextElement => isTextElement(el))
)

// Helper to get mixed value only from text elements
function getTextMixedValue<T>(
  getter: (el: TextElement) => T | undefined
): T | typeof MIXED | undefined {
  const elements = textElements.value
  if (elements.length === 0) return undefined
  const first = getter(elements[0])
  for (const el of elements) {
    if (getter(el) !== first) return MIXED
  }
  return first
}

const fontSize = computed(() => {
  const value = getTextMixedValue((el) => el.fontSize)
  return value === MIXED ? undefined : (value ?? 16)
})
const isFontSizeMixed = computed(() =>
  getTextMixedValue((el) => el.fontSize) === MIXED
)

const fontFamily = computed((): FontFamily | undefined => {
  const value = getTextMixedValue((el) => el.fontFamily)
  return value === MIXED ? undefined : (value ?? 'system')
})
const isFontFamilyMixed = computed(() =>
  getTextMixedValue((el) => el.fontFamily) === MIXED
)

const textAlign = computed((): TextAlign | undefined => {
  const value = getTextMixedValue((el) => el.textAlign)
  return value === MIXED ? undefined : (value ?? 'left')
})
const isTextAlignMixed = computed(() =>
  getTextMixedValue((el) => el.textAlign) === MIXED
)

const fontWeight = computed((): FontWeight | undefined => {
  const value = getTextMixedValue((el) => el.fontWeight)
  return value === MIXED ? undefined : (value ?? 'normal')
})
const isFontWeightMixed = computed(() =>
  getTextMixedValue((el) => el.fontWeight) === MIXED
)

// ============================================================================
// Image-specific property getters (ONLY looks at image elements)
// ============================================================================

// Filter to get only image elements from selection
const imageElements = computed(() =>
  selectedElements.value.filter((el): el is ImageElement => isImageElement(el))
)

// Helper to get mixed value only from image elements
function getImageMixedValue<T>(
  getter: (el: ImageElement) => T | undefined
): T | typeof MIXED | undefined {
  const elements = imageElements.value
  if (elements.length === 0) return undefined
  const first = getter(elements[0])
  for (const el of elements) {
    if (getter(el) !== first) return MIXED
  }
  return first
}

const objectFit = computed((): ImageObjectFit | undefined => {
  const value = getImageMixedValue((el) => el.objectFit)
  return value === MIXED ? undefined : (value ?? 'contain')
})
const isObjectFitMixed = computed(() =>
  getImageMixedValue((el) => el.objectFit) === MIXED
)

const flipX = computed(() => {
  const value = getImageMixedValue((el) => el.flipX)
  return value === MIXED ? undefined : (value ?? false)
})
const isFlipXMixed = computed(() =>
  getImageMixedValue((el) => el.flipX) === MIXED
)

const flipY = computed(() => {
  const value = getImageMixedValue((el) => el.flipY)
  return value === MIXED ? undefined : (value ?? false)
})
const isFlipYMixed = computed(() =>
  getImageMixedValue((el) => el.flipY) === MIXED
)

// ============================================================================
// Update handlers
// ============================================================================

function updateStyleProperty<K extends keyof ElementStyle>(
  property: K,
  value: ElementStyle[K]
) {
  // Update default style for future elements
  toolStore.setDefaultStyle({ [property]: value })

  // Update all selected elements
  for (const el of selectedElements.value) {
    boardStore.updateElement(el.id, {
      style: { ...el.style, [property]: value },
    })
  }
}

function updateStrokeColor(color: string | null) {
  if (color !== null) {
    updateStyleProperty('strokeColor', color)
  }
}

function updateFillColor(color: string | null) {
  updateStyleProperty('fillColor', color)
}

function updateTextProperty(
  property: 'fontSize' | 'fontFamily' | 'textAlign' | 'fontWeight',
  value: number | FontFamily | TextAlign | FontWeight
) {
  for (const el of selectedElements.value) {
    if (isTextElement(el)) {
      boardStore.updateElement(el.id, { [property]: value })
    }
  }
}

function updateRotation(degrees: number) {
  const radians = (degrees * Math.PI) / 180
  for (const el of selectedElements.value) {
    boardStore.updateElement(el.id, { angle: radians })
  }
}

function updateImageProperty(
  property: 'objectFit' | 'flipX' | 'flipY',
  value: ImageObjectFit | boolean
) {
  for (const el of selectedElements.value) {
    if (isImageElement(el)) {
      boardStore.updateElement(el.id, { [property]: value })
    }
  }
}

function toggleFlip(axis: 'x' | 'y') {
  for (const el of selectedElements.value) {
    if (isImageElement(el)) {
      if (axis === 'x') {
        boardStore.updateElement(el.id, { flipX: !el.flipX })
      } else {
        boardStore.updateElement(el.id, { flipY: !el.flipY })
      }
    }
  }
}

// ============================================================================
// Options
// ============================================================================

const strokeDashOptions = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

const fontFamilyOptions: Array<{ value: FontFamily; label: string }> = [
  { value: 'system', label: FONT_FAMILY_LABELS.system },
  { value: 'handwritten', label: FONT_FAMILY_LABELS.handwritten },
  { value: 'code', label: FONT_FAMILY_LABELS.code },
  { value: 'serif', label: FONT_FAMILY_LABELS.serif },
]

const textAlignOptions = [
  { value: 'left' as TextAlign, label: 'L' },
  { value: 'center' as TextAlign, label: 'C' },
  { value: 'right' as TextAlign, label: 'R' },
]

const fontWeightOptions = [
  { value: 'normal' as FontWeight, label: 'R' },
  { value: 'medium' as FontWeight, label: 'M' },
  { value: 'bold' as FontWeight, label: 'B' },
]

const objectFitOptions: Array<{ value: ImageObjectFit; label: string }> = [
  { value: 'contain', label: IMAGE_OBJECT_FIT_LABELS.contain },
  { value: 'cover', label: IMAGE_OBJECT_FIT_LABELS.cover },
  { value: 'fill', label: IMAGE_OBJECT_FIT_LABELS.fill },
]
</script>

<template>
  <Transition name="slide">
    <div
      v-if="hasSelection"
      class="element-properties-panel absolute left-4 top-4 z-[120]"
      :class="{ collapsed: isCollapsed }"
    >
      <div class="panel-container">
        <!-- Panel header -->
        <div class="panel-header">
          <div class="flex items-center gap-2">
            <BkIcon icon="sliders-horizontal" :size="14" class="text-muted-foreground" />
            <span class="text-xs font-medium text-foreground">
              {{ isMultiSelection ? `${selectedElements.length} elements` : 'Properties' }}
            </span>
          </div>
          <button
            class="collapse-btn"
            @click="isCollapsed = !isCollapsed"
          >
            <BkIcon
              :icon="isCollapsed ? 'chevron-down' : 'chevron-up'"
              :size="14"
            />
          </button>
        </div>

        <!-- Panel content -->
        <div v-show="!isCollapsed" class="panel-content">
          <!-- Stroke Section -->
          <BkFormSection title="Stroke" no-dividers>
            <BkFormRow label="Color" icon="palette">
              <BkColorPicker
                :model-value="strokeColor ?? '#ffffff'"
                :is-mixed="isStrokeColorMixed"
                @update:model-value="updateStrokeColor"
              />
            </BkFormRow>

            <BkFormRow label="Width" icon="minus">
              <BkSlider
                :model-value="strokeWidth ?? 2"
                :min="1"
                :max="8"
                :step="1"
                @update:model-value="updateStyleProperty('strokeWidth', $event)"
              />
            </BkFormRow>

            <BkFormRow label="Style" icon="more-horizontal">
              <BkSelect
                :model-value="strokeDash ?? 'solid'"
                :options="strokeDashOptions"
                size="sm"
                @update:model-value="updateStyleProperty('strokeDash', $event as StrokeDashType)"
              />
            </BkFormRow>
          </BkFormSection>

          <!-- Fill Section -->
          <BkFormSection title="Fill" no-dividers>
            <BkFormRow label="Color" icon="paint-bucket">
              <BkColorPicker
                :model-value="fillColor"
                :is-mixed="isFillColorMixed"
                :show-none="true"
                @update:model-value="updateFillColor"
              />
            </BkFormRow>
          </BkFormSection>

          <!-- Appearance Section -->
          <BkFormSection title="Appearance" no-dividers>
            <BkFormRow label="Opacity" icon="eye">
              <BkSlider
                :model-value="(opacity ?? 1) * 100"
                :min="0"
                :max="100"
                :step="5"
                @update:model-value="updateStyleProperty('opacity', $event / 100)"
              />
            </BkFormRow>

            <BkFormRow label="Roughness" icon="brush">
              <BkSlider
                :model-value="roughness ?? 1"
                :min="0"
                :max="3"
                :step="0.5"
                @update:model-value="updateStyleProperty('roughness', $event)"
              />
            </BkFormRow>
          </BkFormSection>

          <!-- Transform Section -->
          <BkFormSection title="Transform" no-dividers>
            <BkFormRow label="Rotation" icon="rotate-cw">
              <BkSlider
                :model-value="rotationDegrees ?? 0"
                :min="-180"
                :max="180"
                :step="15"
                @update:model-value="updateRotation($event)"
              />
            </BkFormRow>
          </BkFormSection>

          <!-- Text Section (only for text elements) -->
          <BkFormSection v-if="hasTextElements" title="Text" no-dividers>
            <BkFormRow label="Font" icon="type">
              <BkSelect
                :model-value="fontFamily ?? 'system'"
                :options="fontFamilyOptions"
                size="sm"
                @update:model-value="updateTextProperty('fontFamily', $event as FontFamily)"
              />
            </BkFormRow>

            <BkFormRow label="Size" icon="text">
              <BkSlider
                :model-value="fontSize ?? 16"
                :min="12"
                :max="72"
                :step="2"
                @update:model-value="updateTextProperty('fontSize', $event)"
              />
            </BkFormRow>

            <BkFormRow label="Align" icon="align-left">
              <BkButtonGroup
                :model-value="textAlign ?? 'left'"
                :options="textAlignOptions"
                size="sm"
                @update:model-value="updateTextProperty('textAlign', $event as TextAlign)"
              />
            </BkFormRow>

            <BkFormRow label="Weight" icon="bold">
              <BkButtonGroup
                :model-value="fontWeight ?? 'normal'"
                :options="fontWeightOptions"
                size="sm"
                @update:model-value="updateTextProperty('fontWeight', $event as FontWeight)"
              />
            </BkFormRow>
          </BkFormSection>

          <!-- Image Section (only for image elements) -->
          <BkFormSection v-if="hasImageElements" title="Image" no-dividers>
            <BkFormRow label="Fit" icon="maximize-2">
              <BkSelect
                :model-value="objectFit ?? 'contain'"
                :options="objectFitOptions"
                size="sm"
                @update:model-value="updateImageProperty('objectFit', $event as ImageObjectFit)"
              />
            </BkFormRow>

            <BkFormRow label="Flip" icon="flip-horizontal">
              <div class="flex gap-1">
                <button
                  class="flip-btn"
                  :class="{ active: flipX }"
                  title="Flip Horizontal"
                  @click="toggleFlip('x')"
                >
                  <BkIcon icon="flip-horizontal" :size="14" />
                </button>
                <button
                  class="flip-btn"
                  :class="{ active: flipY }"
                  title="Flip Vertical"
                  @click="toggleFlip('y')"
                >
                  <BkIcon icon="flip-vertical" :size="14" />
                </button>
              </div>
            </BkFormRow>
          </BkFormSection>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ==========================================================================
   Panel Container
   Height constraint: viewport - topbar (48px) - top margin (8px) - bottom margin (16px)
   ========================================================================== */
.element-properties-panel {
  width: 320px;
  max-height: calc(100vh - 48px - 8px - 16px);
}

.panel-container {
  width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  background: hsl(var(--background) / 0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid hsl(var(--border));
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  overflow: hidden;
}

/* ==========================================================================
   Panel Header
   ========================================================================== */
.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.5);
}

.collapse-btn {
  padding: 4px;
  border-radius: 4px;
  color: hsl(var(--muted-foreground));
  transition: all 0.15s ease;
}

.collapse-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

/* ==========================================================================
   Panel Content
   ========================================================================== */
.panel-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

/* ==========================================================================
   Transition Animation
   ========================================================================== */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* ==========================================================================
   Image Flip Buttons
   ========================================================================== */
.flip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.5);
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.flip-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.flip-btn.active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}
</style>
