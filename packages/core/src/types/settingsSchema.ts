/**
 * Settings Schema Types
 *
 * These types define how modules declare their settings/preferences.
 * Settings are optional customizations for a module that is already functional.
 *
 * This is distinct from Configuration which is the initial setup required
 * before a module becomes functional.
 */

// ============================================================================
// Main Schema
// ============================================================================

/**
 * Schema defining the settings/preferences for a module.
 * Used to automatically generate the Settings panel UI.
 */
export interface SettingsSchema {
  /**
   * Settings sections.
   * Each section groups related settings together.
   */
  sections: SettingsSection[]
}

// ============================================================================
// Section
// ============================================================================

/**
 * A section of related settings.
 */
export interface SettingsSection {
  /** Unique section ID */
  id: string

  /** Section title */
  title: string

  /** Section icon (Lucide icon name) */
  icon?: string

  /** Whether the section can be collapsed */
  collapsible?: boolean

  /** Whether the section starts collapsed */
  defaultCollapsed?: boolean

  /** Fields in this section */
  fields: SettingsField[]
}

// ============================================================================
// Field Types
// ============================================================================

/**
 * Union type of all possible settings field types.
 */
export type SettingsField =
  | ToggleField
  | SelectField
  | ButtonGroupField
  | SliderField
  | NumberField
  | TextInputField

/**
 * Base interface for all settings fields.
 */
interface SettingsFieldBase {
  /** Key in the module state where the value is stored */
  key: string

  /** Display label */
  label: string

  /** Optional icon (Lucide icon name) */
  icon?: string

  /** Optional hint/description shown below the field */
  hint?: string

  /**
   * Conditional display expression.
   * Field is only shown if this evaluates to true.
   * Example: "state.mode === 'pomodoro'"
   */
  condition?: string

  /** Whether this field is disabled */
  disabled?: boolean
}

// ============================================================================
// Toggle Field
// ============================================================================

/**
 * Boolean toggle switch.
 */
export interface ToggleField extends SettingsFieldBase {
  type: 'toggle'
}

// ============================================================================
// Select Field
// ============================================================================

/**
 * Dropdown select.
 */
export interface SelectField extends SettingsFieldBase {
  type: 'select'

  /** Available options */
  options: SelectOption[]

  /** Placeholder text when no value selected */
  placeholder?: string
}

export interface SelectOption {
  /** Value stored when selected */
  value: string | number

  /** Display label */
  label: string

  /** Optional icon */
  icon?: string

  /** Whether this option is disabled */
  disabled?: boolean
}

// ============================================================================
// Button Group Field
// ============================================================================

/**
 * Segmented button group for mutually exclusive options.
 * Better than select for 2-4 options.
 */
export interface ButtonGroupField extends SettingsFieldBase {
  type: 'button-group'

  /** Available options */
  options: ButtonGroupOption[]

  /** Whether buttons should take full width */
  fullWidth?: boolean
}

export interface ButtonGroupOption {
  /** Value stored when selected */
  value: string | number

  /** Display label */
  label: string

  /** Optional icon (shown instead of or with label) */
  icon?: string
}

// ============================================================================
// Slider Field
// ============================================================================

/**
 * Numeric slider for range values.
 */
export interface SliderField extends SettingsFieldBase {
  type: 'slider'

  /** Minimum value */
  min: number

  /** Maximum value */
  max: number

  /** Step increment */
  step?: number

  /** Unit label (e.g., "px", "s", "%") */
  unit?: string

  /** Show current value */
  showValue?: boolean
}

// ============================================================================
// Number Field
// ============================================================================

/**
 * Numeric input field.
 */
export interface NumberField extends SettingsFieldBase {
  type: 'number'

  /** Minimum value */
  min?: number

  /** Maximum value */
  max?: number

  /** Step increment */
  step?: number

  /** Placeholder text */
  placeholder?: string

  /** Unit label */
  unit?: string
}

// ============================================================================
// Text Input Field
// ============================================================================

/**
 * Text input field.
 */
export interface TextInputField extends SettingsFieldBase {
  type: 'text'

  /** Placeholder text */
  placeholder?: string

  /** Maximum character length */
  maxLength?: number

  /** Input pattern for validation */
  pattern?: string
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract the value type from a settings field.
 */
export type SettingsFieldValue<T extends SettingsField> = T extends ToggleField
  ? boolean
  : T extends SliderField | NumberField
    ? number
    : T extends SelectField | ButtonGroupField
      ? T['options'][number]['value']
      : T extends TextInputField
        ? string
        : unknown

/**
 * Standard settings categories.
 * Modules should use these IDs when possible for consistency.
 */
export const SETTINGS_SECTION_IDS = {
  DISPLAY: 'display',
  BEHAVIOR: 'behavior',
  ADVANCED: 'advanced',
} as const

/**
 * Standard icons for settings sections.
 */
export const SETTINGS_SECTION_ICONS = {
  display: 'eye',
  behavior: 'settings-2',
  advanced: 'sliders-horizontal',
} as const
