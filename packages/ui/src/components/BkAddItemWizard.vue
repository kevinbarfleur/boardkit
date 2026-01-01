<script setup lang="ts">
/**
 * BkAddItemWizard
 *
 * Multi-step wizard for adding configured items.
 * Used for complex configuration flows like adding metrics to Stats Card.
 */
import { ref, computed, watch } from 'vue'
import BkIcon from './BkIcon.vue'
import BkButton from './BkButton.vue'
import BkButtonGroup from './BkButtonGroup.vue'
import BkSelect from './BkSelect.vue'
import BkFormSection from './BkFormSection.vue'

export interface WizardOption {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

export interface WizardStep {
  /** Step ID */
  id: string
  /** Step label */
  label: string
  /** Step type */
  type: 'button-group' | 'select' | 'radio'
  /** Available options */
  options: WizardOption[]
  /** Placeholder for select */
  placeholder?: string
  /**
   * Function to filter/transform options based on previous selections.
   * If not provided, all options are shown.
   */
  getOptions?: (state: Record<string, string>) => WizardOption[]
}

interface Props {
  /** Whether the wizard is open/visible */
  open: boolean
  /** Wizard title */
  title?: string
  /** Steps configuration */
  steps: WizardStep[]
  /** Initial state values */
  initialState?: Record<string, string>
  /** Confirm button label */
  confirmLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Add Item',
  initialState: () => ({}),
  confirmLabel: 'Add',
})

const emit = defineEmits<{
  close: []
  complete: [state: Record<string, string>]
}>()

// Internal state
const state = ref<Record<string, string>>({ ...props.initialState })

// Reset state when wizard opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      state.value = { ...props.initialState }
    }
  }
)

// Get current step index (first incomplete step)
const currentStepIndex = computed(() => {
  for (let i = 0; i < props.steps.length; i++) {
    if (!state.value[props.steps[i].id]) {
      return i
    }
  }
  return props.steps.length // All complete
})

// Is wizard complete?
const isComplete = computed(() => {
  return props.steps.every((step) => !!state.value[step.id])
})

// Get options for a step
function getStepOptions(step: WizardStep): WizardOption[] {
  if (step.getOptions) {
    return step.getOptions(state.value)
  }
  return step.options
}

// Handle step value change
function handleStepChange(stepId: string, value: string) {
  state.value[stepId] = value

  // Clear subsequent steps when a prior step changes
  const stepIndex = props.steps.findIndex((s) => s.id === stepId)
  for (let i = stepIndex + 1; i < props.steps.length; i++) {
    delete state.value[props.steps[i].id]
  }
}

// Handle confirm
function handleConfirm() {
  if (isComplete.value) {
    emit('complete', { ...state.value })
    emit('close')
  }
}

// Handle cancel
function handleCancel() {
  emit('close')
}
</script>

<template>
  <div v-if="open" class="bk-add-item-wizard">
    <BkFormSection :title="title" no-dividers>
      <template #title>
        <span class="flex items-center gap-1.5">
          <BkIcon icon="plus-circle" :size="12" />
          {{ title }}
        </span>
      </template>

      <div class="p-3 space-y-4">
        <!-- Steps -->
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="space-y-2"
          :class="{ 'opacity-50 pointer-events-none': index > currentStepIndex }"
        >
          <!-- Step label -->
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
              :class="[
                state[step.id]
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStepIndex
                    ? 'bg-muted text-foreground'
                    : 'bg-muted text-muted-foreground',
              ]"
            >
              <BkIcon v-if="state[step.id]" icon="check" :size="12" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="text-sm font-medium text-foreground">
              {{ step.label }}
            </span>
          </div>

          <!-- Step content -->
          <div class="pl-7">
            <!-- Button Group -->
            <BkButtonGroup
              v-if="step.type === 'button-group'"
              :model-value="state[step.id]"
              :options="getStepOptions(step).map((o) => ({ value: o.value, label: o.label }))"
              full-width
              @update:model-value="(v) => handleStepChange(step.id, v as string)"
            />

            <!-- Select -->
            <BkSelect
              v-else-if="step.type === 'select'"
              :model-value="state[step.id]"
              :options="getStepOptions(step).map((o) => ({ value: o.value, label: o.label }))"
              :placeholder="step.placeholder || 'Select...'"
              @update:model-value="(v) => handleStepChange(step.id, v as string)"
            />

            <!-- Radio list -->
            <div v-else-if="step.type === 'radio'" class="space-y-1">
              <button
                v-for="option in getStepOptions(step)"
                :key="option.value"
                type="button"
                class="w-full flex items-center gap-2 p-2 rounded-md transition-all text-left"
                :class="[
                  state[step.id] === option.value
                    ? 'bg-primary/10'
                    : 'hover:bg-accent/50',
                  option.disabled ? 'opacity-50 pointer-events-none' : '',
                ]"
                :disabled="option.disabled"
                @click="handleStepChange(step.id, option.value)"
              >
                <!-- Radio button -->
                <div
                  class="shrink-0 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                  :class="[
                    state[step.id] === option.value
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40',
                  ]"
                >
                  <div
                    v-if="state[step.id] === option.value"
                    class="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                  />
                </div>

                <!-- Icon -->
                <BkIcon
                  v-if="option.icon"
                  :icon="option.icon"
                  :size="14"
                  class="shrink-0 text-muted-foreground"
                />

                <!-- Label -->
                <span class="text-sm text-foreground">{{ option.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-2">
          <BkButton variant="outline" size="sm" class="flex-1" @click="handleCancel">
            Cancel
          </BkButton>
          <BkButton
            size="sm"
            class="flex-1"
            :disabled="!isComplete"
            @click="handleConfirm"
          >
            <BkIcon icon="plus" :size="14" class="mr-1" />
            {{ confirmLabel }}
          </BkButton>
        </div>
      </div>
    </BkFormSection>
  </div>
</template>
