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
  | TextareaField
  | DateField
  | ColorField
  | CheckboxField
  | SecretField

/**
 * Base interface for all settings fields.
 */
export interface SettingsFieldBase {
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
// Textarea Field
// ============================================================================

/**
 * Multi-line text input field.
 */
export interface TextareaField extends SettingsFieldBase {
  type: 'textarea'

  /** Placeholder text */
  placeholder?: string

  /** Number of visible rows */
  rows?: number

  /** Maximum character length */
  maxLength?: number
}

// ============================================================================
// Date Field
// ============================================================================

/**
 * Date picker field.
 */
export interface DateField extends SettingsFieldBase {
  type: 'date'

  /** Placeholder text when no date selected */
  placeholder?: string

  /** Show quick preset buttons (Today, Tomorrow, etc.) */
  showPresets?: boolean
}

// ============================================================================
// Color Field
// ============================================================================

/**
 * Color picker field.
 */
export interface ColorField extends SettingsFieldBase {
  type: 'color'

  /** Custom color palette (hex values) */
  colors?: string[]

  /** Allow clearing the color (nullable) */
  allowNone?: boolean
}

// ============================================================================
// Checkbox Field
// ============================================================================

/**
 * Single checkbox field.
 * Similar to toggle but with checkbox styling.
 */
export interface CheckboxField extends SettingsFieldBase {
  type: 'checkbox'

  /** Label displayed next to the checkbox (can differ from main label) */
  checkboxLabel?: string
}

// ============================================================================
// Secret Field
// ============================================================================

/**
 * Secret input field for sensitive data (API keys, tokens, etc.).
 *
 * Values are stored in a secure vault, separate from the .boardkit file.
 * The module state stores a reference (e.g., "secret:my_api_key")
 * which is resolved at runtime via useSecrets().
 *
 * This allows .boardkit files to be shared as templates without
 * exposing sensitive credentials.
 */
export interface SecretField extends SettingsFieldBase {
  type: 'secret'

  /** Placeholder text */
  placeholder?: string

  /**
   * Label shown when a secret is stored.
   * Defaults to "Secret stored securely"
   */
  storedLabel?: string
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract the value type from a settings field.
 */
export type SettingsFieldValue<T extends SettingsField> = T extends ToggleField
  ? boolean
  : T extends CheckboxField
    ? boolean
    : T extends SliderField | NumberField
      ? number
      : T extends SelectField | ButtonGroupField
        ? T['options'][number]['value']
        : T extends TextInputField | TextareaField
          ? string
          : T extends DateField
            ? string | null
            : T extends ColorField
              ? string | null
              : T extends SecretField
                ? string | null
                : unknown

// ============================================================================
// Type Guards
// ============================================================================

export const isToggle = (field: SettingsField): field is ToggleField => field.type === 'toggle'
export const isSelect = (field: SettingsField): field is SelectField => field.type === 'select'
export const isButtonGroup = (field: SettingsField): field is ButtonGroupField =>
  field.type === 'button-group'
export const isSlider = (field: SettingsField): field is SliderField => field.type === 'slider'
export const isNumber = (field: SettingsField): field is NumberField => field.type === 'number'
export const isText = (field: SettingsField): field is TextInputField => field.type === 'text'
export const isTextarea = (field: SettingsField): field is TextareaField => field.type === 'textarea'
export const isDate = (field: SettingsField): field is DateField => field.type === 'date'
export const isColor = (field: SettingsField): field is ColorField => field.type === 'color'
export const isCheckbox = (field: SettingsField): field is CheckboxField => field.type === 'checkbox'
export const isSecret = (field: SettingsField): field is SecretField => field.type === 'secret'

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
