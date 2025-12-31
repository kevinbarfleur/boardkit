<script setup lang="ts">
/**
 * BkSchemaForm
 *
 * Generic form renderer based on SettingsField schema.
 * Used by both BkSettingsPanelGeneric (for settings) and BkFormModal (for modals).
 */
import type {
  SettingsField,
  ToggleField,
  SelectField,
  ButtonGroupField,
  SliderField,
  NumberField,
  TextInputField,
  TextareaField,
  DateField,
  ColorField,
  CheckboxField,
  SecretField,
} from '@boardkit/core'
import BkFormRow from './BkFormRow.vue'
import BkToggle from './BkToggle.vue'
import BkSelect from './BkSelect.vue'
import BkButtonGroup from './BkButtonGroup.vue'
import BkSlider from './BkSlider.vue'
import BkInput from './BkInput.vue'
import BkTextarea from './BkTextarea.vue'
import BkDatePicker from './BkDatePicker.vue'
import BkColorPicker from './BkColorPicker.vue'
import BkCheckbox from './BkCheckbox.vue'
import BkSecretInput from './BkSecretInput.vue'

interface Props {
  /** Fields to render */
  fields: SettingsField[]
  /** Current values */
  values: Record<string, unknown>
  /** Visual variant: 'plain' (no wrapper) or 'card' (with border, bg, dividers) */
  variant?: 'plain' | 'card'
  /**
   * Map of secret field keys to whether they have a stored secret.
   * Used by BkSecretInput to show the "stored" indicator.
   */
  secretStatus?: Record<string, boolean>
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'plain',
  secretStatus: () => ({}),
})

const wrapperClass = computed(() => {
  if (props.variant === 'card') {
    return 'rounded-md border border-border bg-card divide-y divide-border'
  }
  return ''
})

const emit = defineEmits<{
  /** Emitted when a field value changes */
  update: [key: string, value: unknown]
  /** Emitted when a secret should be saved (key from field, value to store) */
  saveSecret: [key: string, value: string]
  /** Emitted when a secret should be cleared (key from field) */
  clearSecret: [key: string]
}>()

// Get current value for a field
function getFieldValue(field: SettingsField): unknown {
  return props.values[field.key]
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
    return fn(props.values)
  } catch {
    console.warn(`Failed to evaluate condition: ${field.condition}`)
    return true
  }
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

function isTextarea(field: SettingsField): field is TextareaField {
  return field.type === 'textarea'
}

function isDate(field: SettingsField): field is DateField {
  return field.type === 'date'
}

function isColor(field: SettingsField): field is ColorField {
  return field.type === 'color'
}

function isCheckbox(field: SettingsField): field is CheckboxField {
  return field.type === 'checkbox'
}

function isSecret(field: SettingsField): field is SecretField {
  return field.type === 'secret'
}

// Secret field helpers
function hasStoredSecret(field: SettingsField): boolean {
  return props.secretStatus?.[field.key] ?? false
}

function handleSaveSecret(key: string, value: string) {
  emit('saveSecret', key, value)
}

function handleClearSecret(key: string) {
  emit('clearSecret', key)
}

// Computed visible fields
const visibleFields = computed(() => props.fields.filter(isFieldVisible))
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <div class="bk-schema-form" :class="wrapperClass">
    <template v-for="field in visibleFields" :key="field.key">
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

      <!-- Checkbox Field -->
      <BkFormRow
        v-else-if="isCheckbox(field)"
        :label="field.label"
        :icon="field.icon"
        :hint="field.hint"
        layout="inline"
      >
        <BkCheckbox
          :model-value="getFieldValue(field) as boolean"
          :disabled="field.disabled"
          @update:model-value="(v) => handleUpdate(field.key, v)"
        >
          {{ field.checkboxLabel }}
        </BkCheckbox>
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

      <!-- Textarea Field -->
      <BkFormRow
        v-else-if="isTextarea(field)"
        :label="field.label"
        :icon="field.icon"
        :hint="field.hint"
        layout="stacked"
      >
        <BkTextarea
          :model-value="(getFieldValue(field) as string) || ''"
          :placeholder="field.placeholder"
          :rows="field.rows"
          :disabled="field.disabled"
          @update:model-value="(v) => handleUpdate(field.key, v)"
        />
      </BkFormRow>

      <!-- Date Field -->
      <BkFormRow
        v-else-if="isDate(field)"
        :label="field.label"
        :icon="field.icon"
        :hint="field.hint"
        layout="inline"
      >
        <BkDatePicker
          :model-value="(getFieldValue(field) as string | null)"
          :placeholder="field.placeholder"
          :show-presets="field.showPresets"
          :disabled="field.disabled"
          @update:model-value="(v) => handleUpdate(field.key, v)"
        />
      </BkFormRow>

      <!-- Color Field -->
      <BkFormRow
        v-else-if="isColor(field)"
        :label="field.label"
        :icon="field.icon"
        :hint="field.hint"
        layout="stacked"
      >
        <BkColorPicker
          :model-value="(getFieldValue(field) as string | null)"
          :show-none="field.allowNone"
          :disabled="field.disabled"
          @update:model-value="(v) => handleUpdate(field.key, v)"
        />
      </BkFormRow>

      <!-- Secret Field -->
      <BkFormRow
        v-else-if="isSecret(field)"
        :label="field.label"
        :icon="field.icon"
        layout="stacked"
      >
        <BkSecretInput
          :model-value="(getFieldValue(field) as string | null)"
          :placeholder="field.placeholder"
          :stored-label="field.storedLabel"
          :has-stored-secret="hasStoredSecret(field)"
          :disabled="field.disabled"
          @save-secret="(v) => handleSaveSecret(field.key, v)"
          @clear-secret="() => handleClearSecret(field.key)"
        />
      </BkFormRow>
    </template>
  </div>
</template>
