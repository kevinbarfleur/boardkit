<script setup lang="ts">
/**
 * BkSettingsPanelGeneric
 *
 * Renders settings UI based on a SettingsSchema.
 * Interprets the schema and renders appropriate form components.
 */
import { computed } from 'vue'
import type {
  SettingsSchema,
  SettingsSection,
  SettingsField,
  ToggleField,
  SelectField,
  ButtonGroupField,
  SliderField,
  NumberField,
  TextInputField,
} from '@boardkit/core'
import BkFormSection from './BkFormSection.vue'
import BkFormRow from './BkFormRow.vue'
import BkToggle from './BkToggle.vue'
import BkSelect from './BkSelect.vue'
import BkButtonGroup from './BkButtonGroup.vue'
import BkSlider from './BkSlider.vue'
import BkInput from './BkInput.vue'
import BkIcon from './BkIcon.vue'

interface Props {
  /** Settings schema to render */
  schema: SettingsSchema
  /** Current module state */
  state: Record<string, unknown>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Emitted when a state field should be updated */
  update: [key: string, value: unknown]
}>()

// Get current value for a field
function getFieldValue(field: SettingsField): unknown {
  return props.state[field.key]
}

// Handle field update
function handleUpdate(key: string, value: unknown) {
  emit('update', key, value)
}

// Check if a field should be visible based on its condition
function isFieldVisible(field: SettingsField): boolean {
  if (!field.condition) return true

  try {
    // Simple condition evaluation
    // Supports: "state.key === 'value'" style conditions
    const fn = new Function('state', `return ${field.condition}`)
    return fn(props.state)
  } catch {
    console.warn(`Failed to evaluate condition: ${field.condition}`)
    return true
  }
}

// Filter visible fields for a section
function getVisibleFields(section: SettingsSection): SettingsField[] {
  return section.fields.filter(isFieldVisible)
}

// Check if section has any visible fields
function hasVisibleFields(section: SettingsSection): boolean {
  return getVisibleFields(section).length > 0
}

// Type guards
function isToggle(field: SettingsField): field is ToggleField {
  return field.type === 'toggle'
}

function isSelect(field: SettingsField): field is SelectField {
  return field.type === 'select'
}

function isButtonGroup(field: SettingsField): field is ButtonGroupField {
  return field.type === 'button-group'
}

function isSlider(field: SettingsField): field is SliderField {
  return field.type === 'slider'
}

function isNumber(field: SettingsField): field is NumberField {
  return field.type === 'number'
}

function isText(field: SettingsField): field is TextInputField {
  return field.type === 'text'
}
</script>

<template>
  <div class="bk-settings-panel-generic space-y-4">
    <template v-for="section in schema.sections" :key="section.id">
      <BkFormSection
        v-if="hasVisibleFields(section)"
        :title="section.title"
        :collapsible="section.collapsible"
        :default-collapsed="section.defaultCollapsed"
      >
        <template #title>
          <span class="flex items-center gap-1.5">
            <BkIcon v-if="section.icon" :icon="section.icon" :size="12" />
            {{ section.title }}
          </span>
        </template>

        <template v-for="field in getVisibleFields(section)" :key="field.key">
          <!-- Toggle Field -->
          <BkFormRow
            v-if="isToggle(field)"
            :label="field.label"
            :icon="field.icon"
            :hint="field.hint"
            layout="inline"
          >
            <BkToggle
              :model-value="getFieldValue(field) as boolean"
              :disabled="field.disabled"
              @update:model-value="(v) => handleUpdate(field.key, v)"
            />
          </BkFormRow>

          <!-- Select Field -->
          <BkFormRow
            v-else-if="isSelect(field)"
            :label="field.label"
            :icon="field.icon"
            :hint="field.hint"
            layout="inline"
          >
            <BkSelect
              :model-value="(getFieldValue(field) as string | number | null)"
              :options="field.options"
              :placeholder="field.placeholder"
              :disabled="field.disabled"
              @update:model-value="(v) => handleUpdate(field.key, v)"
            />
          </BkFormRow>

          <!-- Button Group Field -->
          <BkFormRow
            v-else-if="isButtonGroup(field)"
            :label="field.label"
            :icon="field.icon"
            :hint="field.hint"
            layout="stacked"
          >
            <BkButtonGroup
              :model-value="(getFieldValue(field) as string | number)"
              :options="field.options"
              :full-width="field.fullWidth"
              :disabled="field.disabled"
              @update:model-value="(v) => handleUpdate(field.key, v)"
            />
          </BkFormRow>

          <!-- Slider Field -->
          <BkFormRow
            v-else-if="isSlider(field)"
            :label="field.label"
            :icon="field.icon"
            :hint="field.hint"
            layout="stacked"
          >
            <div class="flex items-center gap-2">
              <BkSlider
                class="flex-1"
                :model-value="getFieldValue(field) as number"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :disabled="field.disabled"
                @update:model-value="(v) => handleUpdate(field.key, v)"
              />
              <span
                v-if="field.showValue !== false"
                class="text-xs text-muted-foreground min-w-[3rem] text-right"
              >
                {{ getFieldValue(field) }}{{ field.unit || '' }}
              </span>
            </div>
          </BkFormRow>

          <!-- Number Field -->
          <BkFormRow
            v-else-if="isNumber(field)"
            :label="field.label"
            :icon="field.icon"
            :hint="field.hint"
            layout="inline"
          >
            <div class="flex items-center gap-1">
              <BkInput
                type="number"
                :model-value="getFieldValue(field) != null ? String(getFieldValue(field)) : undefined"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                class="w-20"
                @update:model-value="(v) => handleUpdate(field.key, Number(v))"
              />
              <span v-if="field.unit" class="text-xs text-muted-foreground">
                {{ field.unit }}
              </span>
            </div>
          </BkFormRow>

          <!-- Text Field -->
          <BkFormRow
            v-else-if="isText(field)"
            :label="field.label"
            :icon="field.icon"
            :hint="field.hint"
            layout="stacked"
          >
            <BkInput
              type="text"
              :model-value="getFieldValue(field) as string"
              :placeholder="field.placeholder"
              :maxlength="field.maxLength"
              :disabled="field.disabled"
              @update:model-value="(v) => handleUpdate(field.key, v)"
            />
          </BkFormRow>
        </template>
      </BkFormSection>
    </template>
  </div>
</template>
