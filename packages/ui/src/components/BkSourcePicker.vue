<script setup lang="ts">
/**
 * BkSourcePicker
 *
 * Inline component for selecting data sources in the configuration panel.
 * Supports both single and multi-select modes.
 */
import { computed } from 'vue'
import BkIcon from './BkIcon.vue'
import BkCheckbox from './BkCheckbox.vue'
import BkFormSection from './BkFormSection.vue'

export interface SourcePickerProvider {
  /** Widget ID */
  id: string
  /** Module ID */
  moduleId: string
  /** Display title */
  title: string
  /** Icon name */
  icon?: string
  /** Metadata text (e.g., "5 tasks") */
  meta?: string
}

interface Props {
  /** Section title */
  title?: string
  /** Section icon */
  icon?: string
  /** Description text */
  description?: string
  /** Available providers */
  providers: SourcePickerProvider[]
  /** Selected provider ID(s) */
  modelValue: string | string[] | null
  /** Selection mode */
  mode?: 'single' | 'multi'
  /** Empty state text */
  emptyText?: string
  /** Empty state hint */
  emptyHint?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Data Source',
  icon: 'link',
  description: undefined,
  mode: 'single',
  emptyText: 'No data sources available',
  emptyHint: 'Add a widget that provides data first',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

// Normalize selection to Set for easier handling
const selectedSet = computed(() => {
  if (!props.modelValue) return new Set<string>()
  if (Array.isArray(props.modelValue)) return new Set(props.modelValue)
  return new Set([props.modelValue])
})

// Check if a provider is selected
function isSelected(providerId: string): boolean {
  return selectedSet.value.has(providerId)
}

// Toggle selection
function toggleSelection(providerId: string) {
  if (props.mode === 'multi') {
    const newSet = new Set(selectedSet.value)
    if (newSet.has(providerId)) {
      newSet.delete(providerId)
    } else {
      newSet.add(providerId)
    }
    emit('update:modelValue', Array.from(newSet))
  } else {
    // Single select
    if (isSelected(providerId)) {
      emit('update:modelValue', null)
    } else {
      emit('update:modelValue', providerId)
    }
  }
}

// Get default icon for provider
function getProviderIcon(provider: SourcePickerProvider): string {
  if (provider.icon) return provider.icon
  // Default icons based on module type
  const moduleIcons: Record<string, string> = {
    'todo': 'list-todo',
    'counter': 'hash',
    'timer': 'timer',
    'kanban': 'columns',
    'habit-tracker': 'calendar-check',
  }
  return moduleIcons[provider.moduleId] || 'box'
}

// Summary text
const summaryText = computed(() => {
  const count = selectedSet.value.size
  if (count === 0) return null
  if (props.mode === 'single') return null
  return `${count} source${count > 1 ? 's' : ''} selected`
})
</script>

<template>
  <BkFormSection :title="title" no-dividers>
    <template #title>
      <span class="flex items-center gap-1.5">
        <BkIcon v-if="icon" :icon="icon" :size="12" />
        {{ title }}
      </span>
    </template>

    <div class="p-3 space-y-3">
      <!-- Description -->
      <p v-if="description" class="text-xs text-muted-foreground">
        {{ description }}
      </p>

      <!-- Empty state -->
      <div v-if="providers.length === 0" class="py-4 text-center">
        <BkIcon icon="inbox" :size="24" class="mx-auto mb-2 text-muted-foreground" />
        <p class="text-xs text-muted-foreground">{{ emptyText }}</p>
        <p v-if="emptyHint" class="text-xs text-muted-foreground/70 mt-1">
          {{ emptyHint }}
        </p>
      </div>

      <!-- Provider list -->
      <div v-else class="space-y-1.5">
        <button
          v-for="provider in providers"
          :key="provider.id"
          type="button"
          class="w-full flex items-center gap-2.5 p-2 rounded-md border transition-all text-left"
          :class="[
            isSelected(provider.id)
              ? 'border-primary bg-primary/10'
              : 'border-transparent hover:bg-accent/50',
          ]"
          @click="toggleSelection(provider.id)"
        >
          <!-- Selection indicator -->
          <div v-if="mode === 'multi'" class="shrink-0" @click.stop>
            <BkCheckbox
              :model-value="isSelected(provider.id)"
              @update:model-value="toggleSelection(provider.id)"
            />
          </div>
          <div v-else class="shrink-0">
            <div
              class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors"
              :class="[
                isSelected(provider.id)
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/40',
              ]"
            >
              <div
                v-if="isSelected(provider.id)"
                class="w-1.5 h-1.5 rounded-full bg-primary-foreground"
              />
            </div>
          </div>

          <!-- Icon -->
          <div
            class="shrink-0 w-7 h-7 rounded flex items-center justify-center"
            :class="[
              isSelected(provider.id)
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground',
            ]"
          >
            <BkIcon :icon="getProviderIcon(provider)" :size="14" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-foreground truncate">
              {{ provider.title }}
            </div>
            <div v-if="provider.meta" class="text-xs text-muted-foreground">
              {{ provider.meta }}
            </div>
          </div>

          <!-- Check icon -->
          <BkIcon
            v-if="isSelected(provider.id)"
            icon="check"
            :size="14"
            class="shrink-0 text-primary"
          />
        </button>
      </div>

      <!-- Summary -->
      <div v-if="summaryText" class="text-xs text-muted-foreground text-center pt-1">
        {{ summaryText }}
      </div>
    </div>
  </BkFormSection>
</template>
