<script setup lang="ts">
/**
 * BkConfigurationPanel
 *
 * Renders configuration UI based on a ConfigurationSchema.
 * Interprets the schema sections and renders the appropriate components.
 */
import { ref, computed } from 'vue'
import type {
  ConfigurationSchema,
  ConfigurationSection,
  SourcePickerSection,
  SourcePickerGroupSection,
  ItemBuilderSection,
} from '@boardkit/core'
import BkSourcePicker, { type SourcePickerProvider } from './BkSourcePicker.vue'
import BkConfiguredItemsList, { type ConfiguredItem } from './BkConfiguredItemsList.vue'
import BkAddItemWizard, { type WizardStep } from './BkAddItemWizard.vue'
import BkFormSection from './BkFormSection.vue'
import BkIcon from './BkIcon.vue'

/**
 * Provider info needed for source pickers
 */
export interface ConfigPanelProvider {
  id: string
  moduleId: string
  contractId: string
  title: string
  icon?: string
  meta?: string
}

interface Props {
  /** Configuration schema to render */
  schema: ConfigurationSchema
  /** Current module state */
  state: Record<string, unknown>
  /** Available providers for data source sections */
  providers: ConfigPanelProvider[]
  /** Custom components for 'custom' type sections */
  customComponents?: Record<string, unknown>
  /** Module context (passed to custom components) */
  moduleContext?: unknown
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Emitted when a state field should be updated */
  update: [key: string, value: unknown]
}>()

// Track which add wizard is open
const openWizardSection = ref<string | null>(null)

// Filter providers by contract ID
function getProvidersForContract(contractId: string): SourcePickerProvider[] {
  return props.providers
    .filter((p) => p.contractId === contractId)
    .map((p) => ({
      id: p.id,
      moduleId: p.moduleId,
      title: p.title,
      icon: p.icon,
      meta: p.meta,
    }))
}

// Get current value for a state key
function getStateValue(key: string): unknown {
  return props.state[key]
}

// Handle source picker update
function handleSourceUpdate(stateKey: string, value: string | string[] | null) {
  emit('update', stateKey, value)
}

// Convert state items to ConfiguredItems for display
function getConfiguredItems(section: ItemBuilderSection): ConfiguredItem[] {
  const items = props.state[section.stateKey] as Array<Record<string, unknown>> | undefined
  if (!items) return []

  return items.map((item) => ({
    id: item.id as string,
    label: item[section.itemDisplay.labelKey] as string,
    meta: section.itemDisplay.metaKey
      ? (item[section.itemDisplay.metaKey] as string)
      : undefined,
    icon: section.itemDisplay.iconKey
      ? (item[section.itemDisplay.iconKey] as string)
      : undefined,
  }))
}

// Handle item removal
function handleItemRemove(section: ItemBuilderSection, itemId: string) {
  const items = props.state[section.stateKey] as Array<Record<string, unknown>> | undefined
  if (!items) return

  emit(
    'update',
    section.stateKey,
    items.filter((item) => item.id !== itemId)
  )
}

// Handle item reorder
function handleItemReorder(section: ItemBuilderSection, newItems: ConfiguredItem[]) {
  const currentItems = props.state[section.stateKey] as Array<Record<string, unknown>> | undefined
  if (!currentItems) return

  // Reorder based on new order
  const reordered = newItems.map((newItem) =>
    currentItems.find((item) => item.id === newItem.id)
  ).filter(Boolean)

  emit('update', section.stateKey, reordered)
}

// Handle wizard completion
function handleWizardComplete(section: ItemBuilderSection, wizardState: Record<string, string>) {
  const currentItems = (props.state[section.stateKey] as Array<Record<string, unknown>>) || []

  // Create new item from wizard state
  // This is a simplified version - in a full implementation,
  // this would use the section's createItem function or template
  const newItem = {
    id: crypto.randomUUID(),
    ...wizardState,
    label: wizardState.label || wizardState.field || 'New Item',
  }

  emit('update', section.stateKey, [...currentItems, newItem])
  openWizardSection.value = null
}

// Build wizard steps from section config
function getWizardSteps(section: ItemBuilderSection): WizardStep[] {
  // This is a simplified implementation
  // In a full implementation, this would be built from section.addItemFlow.steps
  return section.addItemFlow.steps.map((step) => {
    if (step.type === 'select-source-type') {
      return {
        id: step.stateKey,
        label: step.label,
        type: 'button-group' as const,
        options: step.options.map((o) => ({
          value: o.value,
          label: o.label,
          icon: o.icon,
        })),
      }
    }

    if (step.type === 'select-source') {
      return {
        id: step.stateKey,
        label: step.label,
        type: 'select' as const,
        options: [], // Will be populated dynamically
        placeholder: 'Select a source...',
      }
    }

    if (step.type === 'select-field') {
      return {
        id: step.stateKey,
        label: step.label,
        type: 'radio' as const,
        options: [], // Will be populated based on source type
      }
    }

    // Default
    return {
      id: 'unknown',
      label: 'Unknown Step',
      type: 'select' as const,
      options: [],
    }
  })
}

// Type guard functions
function isSourcePicker(section: ConfigurationSection): section is SourcePickerSection {
  return section.type === 'source-picker'
}

function isSourcePickerGroup(section: ConfigurationSection): section is SourcePickerGroupSection {
  return section.type === 'source-picker-group'
}

function isItemBuilder(section: ConfigurationSection): section is ItemBuilderSection {
  return section.type === 'item-builder'
}

// Handle source picker group updates
// Each contract in the group may share the same stateKey, so we need to merge selections
function handleSourceGroupUpdate(
  section: SourcePickerGroupSection,
  contractId: string,
  value: string | string[] | null
) {
  // Find all contracts that share the same stateKey
  const contract = section.contracts.find((c) => c.contractId === contractId)
  if (!contract) return

  // Get current value for this stateKey
  const currentValue = getStateValue(contract.stateKey) as string[] | null

  // Check if other contracts share this stateKey
  const sharedContracts = section.contracts.filter(
    (c) => c.stateKey === contract.stateKey && c.contractId !== contractId
  )

  if (sharedContracts.length === 0) {
    // No sharing - just update directly
    emit('update', contract.stateKey, value)
    return
  }

  // With sharing, we need to merge values from all contracts
  // The new value replaces selections from this contract,
  // but we keep selections from other contracts

  // Get providers for other contracts to identify which values belong to them
  const otherContractProviderIds = new Set<string>()
  for (const otherContract of sharedContracts) {
    const providers = getProvidersForContract(otherContract.contractId)
    for (const p of providers) {
      otherContractProviderIds.add(p.id)
    }
  }

  // Filter current value to keep only other contracts' selections
  const keptSelections = (currentValue || []).filter((id) => otherContractProviderIds.has(id))

  // Merge with new value
  const newSelections = Array.isArray(value) ? value : value ? [value] : []
  const mergedValue = [...keptSelections, ...newSelections]

  emit('update', contract.stateKey, mergedValue.length > 0 ? mergedValue : null)
}

// Get current selections for a specific contract within a group
function getGroupContractValue(
  section: SourcePickerGroupSection,
  contractId: string
): string[] | null {
  const contract = section.contracts.find((c) => c.contractId === contractId)
  if (!contract) return null

  const value = getStateValue(contract.stateKey) as string[] | null
  if (!value) return null

  // Filter to only include providers from this contract
  const contractProviders = getProvidersForContract(contractId)
  const contractProviderIds = new Set(contractProviders.map((p) => p.id))

  const filtered = value.filter((id) => contractProviderIds.has(id))
  return filtered.length > 0 ? filtered : null
}

// Get custom component for a section
function getCustomComponent(componentName: string): unknown | undefined {
  return props.customComponents?.[componentName]
}
</script>

<template>
  <div class="bk-configuration-panel space-y-4">
    <template v-for="section in schema.sections" :key="section.title">
      <!-- Source Picker Section -->
      <BkSourcePicker
        v-if="isSourcePicker(section)"
        :title="section.title"
        :icon="section.icon"
        :description="section.description"
        :providers="getProvidersForContract(section.contractId)"
        :model-value="getStateValue(section.stateKey) as string | string[] | null"
        :mode="section.mode"
        @update:model-value="(v) => handleSourceUpdate(section.stateKey, v)"
      />

      <!-- Source Picker Group Section -->
      <BkFormSection
        v-else-if="isSourcePickerGroup(section)"
        :title="section.title"
        no-dividers
      >
        <template #title>
          <span class="flex items-center gap-1.5">
            <BkIcon :icon="section.icon" :size="12" />
            {{ section.title }}
          </span>
        </template>
        <div class="space-y-3 p-3">
          <p v-if="section.description" class="text-sm text-muted-foreground mb-3">
            {{ section.description }}
          </p>
          <BkSourcePicker
            v-for="contract in section.contracts"
            :key="contract.contractId"
            :title="contract.label"
            :icon="contract.icon"
            :providers="getProvidersForContract(contract.contractId)"
            :model-value="getGroupContractValue(section, contract.contractId)"
            mode="multi"
            compact
            @update:model-value="(v) => handleSourceGroupUpdate(section, contract.contractId, v)"
          />
        </div>
      </BkFormSection>

      <!-- Item Builder Section -->
      <template v-else-if="isItemBuilder(section)">
        <BkConfiguredItemsList
          :title="section.title"
          :icon="section.icon"
          :items="getConfiguredItems(section)"
          :draggable="section.draggable"
          :add-button-label="section.addItemFlow.buttonLabel"
          @remove="(id) => handleItemRemove(section, id)"
          @reorder="(items) => handleItemReorder(section, items)"
          @add="openWizardSection = section.stateKey"
        />

        <!-- Add Item Wizard -->
        <BkAddItemWizard
          :open="openWizardSection === section.stateKey"
          :title="section.addItemFlow.buttonLabel"
          :steps="getWizardSteps(section)"
          @close="openWizardSection = null"
          @complete="(state) => handleWizardComplete(section, state)"
        />
      </template>

      <!-- Custom Section -->
      <template v-else-if="section.type === 'custom'">
        <!-- Render custom component if available -->
        <component
          v-if="getCustomComponent((section as any).component)"
          :is="getCustomComponent((section as any).component)"
          :context="moduleContext"
          @update="(key: string, value: unknown) => emit('update', key, value)"
        />
        <!-- Fallback if custom component not provided -->
        <BkFormSection
          v-else
          :title="section.title"
          no-dividers
        >
          <template #title>
            <span class="flex items-center gap-1.5">
              <BkIcon :icon="section.icon" :size="12" />
              {{ section.title }}
            </span>
          </template>
          <div class="p-3 text-sm text-muted-foreground">
            Custom component: {{ (section as any).component }}
          </div>
        </BkFormSection>
      </template>
    </template>
  </div>
</template>
