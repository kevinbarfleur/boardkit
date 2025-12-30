/**
 * Configuration Schema Types
 *
 * These types define how modules declare their configuration requirements.
 * Configuration is the initial setup needed before a module becomes functional
 * (e.g., connecting data sources, selecting metrics).
 *
 * This is distinct from Settings (preferences) which customize behavior
 * after the module is already functional.
 */

// ============================================================================
// Main Schema
// ============================================================================

/**
 * Schema defining the configuration requirements for a module.
 * If a module has a configurationSchema, it requires setup before use.
 */
export interface ConfigurationSchema {
  /**
   * Function to check if the module is properly configured.
   * Returns true if the module is ready to use.
   */
  isConfigured: (state: unknown) => boolean

  /**
   * Message displayed in the setup required empty state.
   */
  setupMessage: string

  /**
   * Icon for the setup required empty state.
   */
  setupIcon: string

  /**
   * Configuration sections to render in the Configure panel.
   */
  sections: ConfigurationSection[]
}

// ============================================================================
// Section Types
// ============================================================================

/**
 * Union type of all possible configuration section types.
 */
export type ConfigurationSection =
  | SourcePickerSection
  | SourcePickerGroupSection
  | ItemBuilderSection
  | CustomConfigurationSection

/**
 * Base interface for all configuration sections.
 */
interface ConfigurationSectionBase {
  /** Section title */
  title: string

  /** Section icon (Lucide icon name) */
  icon: string

  /** Optional description */
  description?: string
}

// ============================================================================
// Source Picker Section
// ============================================================================

/**
 * Configuration section for selecting a single or multiple data sources
 * from a specific contract type.
 *
 * Use cases:
 * - Focus Lens: single todo list
 * - Task Radar: multiple todo lists
 */
export interface SourcePickerSection extends ConfigurationSectionBase {
  type: 'source-picker'

  /** Contract ID to show providers for */
  contractId: string

  /** Key in widget state where selection is stored */
  stateKey: string

  /** Selection mode */
  mode: 'single' | 'multi'

  /**
   * Optional function to format provider label.
   * If not provided, uses provider widget title or ID.
   */
  providerLabel?: string // Expression like "provider.title || provider.id"

  /**
   * Optional function to format provider metadata.
   * Example: "12 tasks" for a todo list.
   */
  providerMeta?: string // Expression like "data.progress.total + ' tasks'"
}

// ============================================================================
// Source Picker Group Section
// ============================================================================

/**
 * Configuration section for selecting sources from multiple contract types.
 * Displays as an accordion with one source picker per contract.
 *
 * Use case: Stats Card (5 different source types)
 */
export interface SourcePickerGroupSection extends ConfigurationSectionBase {
  type: 'source-picker-group'

  /** Contract configurations */
  contracts: SourcePickerGroupContract[]
}

export interface SourcePickerGroupContract {
  /** Contract ID */
  contractId: string

  /** Key in widget state */
  stateKey: string

  /** Display label for this contract type */
  label: string

  /** Icon for this contract type */
  icon: string

  /** Provider metadata expression */
  providerMeta?: string
}

// ============================================================================
// Item Builder Section
// ============================================================================

/**
 * Configuration section for building a list of items through a wizard flow.
 * Displays current items and an "Add" button that opens a multi-step wizard.
 *
 * Use case: Stats Card metrics configuration
 */
export interface ItemBuilderSection extends ConfigurationSectionBase {
  type: 'item-builder'

  /** Key in widget state where items are stored */
  stateKey: string

  /** Allow drag-drop reordering */
  draggable?: boolean

  /** How to display items in the list */
  itemDisplay: ItemDisplayConfig

  /** Configuration for the add item wizard */
  addItemFlow: AddItemFlowConfig
}

export interface ItemDisplayConfig {
  /** Key in item object for the main label */
  labelKey: string

  /** Key in item object for secondary text (metadata) */
  metaKey?: string

  /** Key in item object for icon */
  iconKey?: string
}

export interface AddItemFlowConfig {
  /** Button label (e.g., "Add Metric") */
  buttonLabel: string

  /** Wizard steps */
  steps: AddItemStep[]

  /**
   * Function to create the final item from wizard state.
   * Called when user completes the wizard.
   */
  createItem?: string // Expression evaluated with wizard state
}

/**
 * A single step in the add item wizard.
 */
export type AddItemStep =
  | SelectSourceTypeStep
  | SelectSourceStep
  | SelectFieldStep
  | SelectOptionStep

export interface SelectSourceTypeStep {
  type: 'select-source-type'

  /** Step label */
  label: string

  /** Available source types */
  options: SourceTypeOption[]

  /** Key to store selection in wizard state */
  stateKey: string
}

export interface SourceTypeOption {
  /** Value stored when selected */
  value: string

  /** Display label */
  label: string

  /** Icon */
  icon: string

  /** Associated contract ID */
  contractId: string
}

export interface SelectSourceStep {
  type: 'select-source'

  /** Step label */
  label: string

  /** Key in wizard state that contains the selected source type */
  sourceTypeKey: string

  /** Key to store selected provider ID */
  stateKey: string
}

export interface SelectFieldStep {
  type: 'select-field'

  /** Step label */
  label: string

  /** Key in wizard state that determines which fields to show */
  sourceTypeKey: string

  /** Key to store selected field */
  stateKey: string

  /** Available fields per source type */
  fieldsBySourceType: Record<string, FieldOption[]>
}

export interface FieldOption {
  /** Field key/path */
  value: string

  /** Display label */
  label: string

  /** Icon */
  icon?: string

  /** Format type for display */
  format?: 'number' | 'percent' | 'duration' | 'text'
}

export interface SelectOptionStep {
  type: 'select-option'

  /** Step label */
  label: string

  /** Available options */
  options: Array<{ value: string; label: string; icon?: string }>

  /** Key to store selection */
  stateKey: string
}

// ============================================================================
// Custom Section
// ============================================================================

/**
 * Escape hatch for highly custom configuration UIs.
 * Use sparingly - prefer declarative sections when possible.
 */
export interface CustomConfigurationSection extends ConfigurationSectionBase {
  type: 'custom'

  /** Vue component name to render */
  component: string

  /** Props to pass to the component */
  props?: Record<string, unknown>
}

// ============================================================================
// Provider Info (for UI rendering)
// ============================================================================

/**
 * Information about an available data provider.
 * Used by source picker components.
 */
export interface ProviderInfo {
  /** Widget ID of the provider */
  id: string

  /** Module ID */
  moduleId: string

  /** Contract ID */
  contractId: string

  /** Widget title (if available) */
  title?: string

  /** Current data from the provider */
  data?: unknown
}
