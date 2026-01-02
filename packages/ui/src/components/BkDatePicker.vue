<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useTheme } from '../composables/useTheme'

interface Props {
  modelValue: string | null
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'default'
  clearable?: boolean
  showPresets?: boolean
}

const slots = useSlots()
const hasTriggerSlot = computed(() => !!slots.trigger)

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date...',
  disabled: false,
  size: 'default',
  clearable: true,
  showPresets: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { resolvedTheme } = useTheme()

const isDark = computed(() => resolvedTheme.value === 'dark')

// Preset dates for quick selection
const presetDates = computed(() => {
  if (!props.showPresets) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    { label: "Aujourd'hui", value: today },
    { label: 'Demain', value: tomorrow },
    { label: 'Dans une semaine', value: nextWeek },
  ]
})

// Handle model value conversion (ISO string <-> Date)
const internalValue = computed({
  get: () => {
    if (!props.modelValue) return null
    return new Date(props.modelValue)
  },
  set: (value: Date | null) => {
    if (!value) {
      emit('update:modelValue', null)
      return
    }
    // Format as YYYY-MM-DD (ISO date only, no time)
    const isoDate = value.toISOString().split('T')[0]
    emit('update:modelValue', isoDate)
  },
})

// Input classes based on size
const inputClass = computed(() => {
  const base = 'bk-dp-input'
  return props.size === 'sm' ? `${base} bk-dp-input-sm` : base
})

// Format display value for trigger slot
const formatDisplayValue = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) return 'Today'
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <VueDatePicker
    v-model="internalValue"
    :dark="isDark"
    :preset-dates="presetDates"
    :enable-time-picker="false"
    :clearable="clearable"
    auto-apply
    :placeholder="placeholder"
    :disabled="disabled"
    :teleport="true"
    :ui="{
      input: inputClass,
      menu: 'bk-dp-menu',
    }"
    hide-input-icon
    input-class-name="bk-dp-native-input"
  >
    <!-- Pass through trigger slot if provided -->
    <template v-if="hasTriggerSlot" #trigger>
      <slot name="trigger" :value="modelValue" :formatted="formatDisplayValue(modelValue)" />
    </template>
  </VueDatePicker>
</template>

<style>
/* Custom input styling to match Boardkit design system */
.bk-dp-input {
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.bk-dp-native-input {
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: border-color 0.2s, box-shadow 0.2s;
}

.bk-dp-native-input:focus {
  outline: none;
  border-color: hsl(var(--border-strong));
}

.bk-dp-native-input::placeholder {
  color: hsl(var(--muted-foreground));
}

.bk-dp-native-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Small size variant */
.bk-dp-input-sm .bk-dp-native-input {
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

/* Menu container styling */
.bk-dp-menu {
  border-radius: 8px;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}
</style>
