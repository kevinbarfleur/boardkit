<script setup lang="ts">
import { ref, computed } from 'vue'
import BkModal from './BkModal.vue'
import BkButton from './BkButton.vue'
import BkIcon from './BkIcon.vue'
import BkCheckbox from './BkCheckbox.vue'

/**
 * Provider info passed to the picker.
 * The parent component is responsible for fetching this data.
 */
export interface ProviderInfo {
  /** Widget ID of the provider */
  id: string
  /** Module ID (e.g., 'todo') */
  moduleId: string
  /** Display title (from widget state or module displayName) */
  title: string
  /** Optional description or subtitle */
  description?: string
  /** Icon name to display */
  icon?: string
  /** Preview data for visual context */
  preview?: {
    /** e.g., "5 tasks" or "12 items" */
    itemCount?: string
    /** e.g., "3/5 completed" */
    progress?: string
  }
}

interface Props {
  /** Whether the modal is open */
  open: boolean
  /** Modal title */
  title?: string
  /** Description text */
  description?: string
  /** Available providers to choose from */
  providers: ProviderInfo[]
  /** Currently connected provider IDs */
  currentConnections: string[]
  /** Whether to allow multiple selections */
  multiSelect?: boolean
  /** Text for the confirm button */
  confirmText?: string
  /** Text for empty state */
  emptyText?: string
  /** Hint text for empty state */
  emptyHint?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Connect Data Source',
  description: 'Select a data source to connect:',
  multiSelect: false,
  confirmText: 'Connect',
  emptyText: 'No data sources available',
  emptyHint: 'Add a widget that provides data first',
})

const emit = defineEmits<{
  close: []
  'update:connections': [providerIds: string[]]
}>()

// Local selection state
const selectedIds = ref<Set<string>>(new Set(props.currentConnections))

// Reset selection when modal opens
const handleOpen = () => {
  selectedIds.value = new Set(props.currentConnections)
}

// Toggle selection
function toggleSelection(providerId: string) {
  if (props.multiSelect) {
    const newSet = new Set(selectedIds.value)
    if (newSet.has(providerId)) {
      newSet.delete(providerId)
    } else {
      newSet.add(providerId)
    }
    selectedIds.value = newSet
  } else {
    // Single select: clear and set
    selectedIds.value = new Set([providerId])
  }
}

// Check if a provider is selected
function isSelected(providerId: string): boolean {
  return selectedIds.value.has(providerId)
}

// Check if a provider was already connected
function wasConnected(providerId: string): boolean {
  return props.currentConnections.includes(providerId)
}

// Has selection changed from initial state?
const hasChanges = computed(() => {
  const current = new Set(props.currentConnections)
  if (selectedIds.value.size !== current.size) return true
  for (const id of selectedIds.value) {
    if (!current.has(id)) return true
  }
  return false
})

// Handle confirm
function handleConfirm() {
  emit('update:connections', Array.from(selectedIds.value))
  emit('close')
}

// Handle close
function handleClose() {
  emit('close')
}

// Get icon for a provider
function getProviderIcon(provider: ProviderInfo): string {
  if (provider.icon) return provider.icon
  // Default icons based on module type
  if (provider.moduleId === 'todo') return 'list-todo'
  return 'box'
}
</script>

<template>
  <BkModal :open="open" :title="title" @close="handleClose" @vue:mounted="handleOpen">
    <div class="space-y-4">
      <!-- Description -->
      <p v-if="description" class="text-sm text-muted-foreground">
        {{ description }}
      </p>

      <!-- Empty state -->
      <div v-if="providers.length === 0" class="py-8 text-center">
        <BkIcon icon="inbox" :size="32" class="mx-auto mb-3 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">{{ emptyText }}</p>
        <p v-if="emptyHint" class="text-xs text-muted-foreground/70 mt-1">
          {{ emptyHint }}
        </p>
      </div>

      <!-- Provider list -->
      <div v-else class="space-y-2 max-h-72 overflow-y-auto">
        <button
          v-for="provider in providers"
          :key="provider.id"
          class="w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left"
          :class="[
            isSelected(provider.id)
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-muted-foreground/50 hover:bg-accent/50',
          ]"
          @click="toggleSelection(provider.id)"
        >
          <!-- Selection indicator -->
          <div v-if="multiSelect" class="shrink-0">
            <BkCheckbox :model-value="isSelected(provider.id)" @click.stop />
          </div>
          <div v-else class="shrink-0">
            <div
              class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
              :class="[
                isSelected(provider.id)
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/50',
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
            class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            :class="[
              isSelected(provider.id)
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground',
            ]"
          >
            <BkIcon :icon="getProviderIcon(provider)" :size="20" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-foreground truncate">{{ provider.title }}</span>
              <span
                v-if="wasConnected(provider.id)"
                class="shrink-0 text-xs text-green-500 font-medium"
              >
                Connected
              </span>
            </div>
            <div v-if="provider.description || provider.preview" class="text-xs text-muted-foreground mt-0.5">
              <span v-if="provider.description">{{ provider.description }}</span>
              <span v-else-if="provider.preview?.itemCount">
                {{ provider.preview.itemCount }}
                <span v-if="provider.preview.progress" class="mx-1">·</span>
                <span v-if="provider.preview.progress">{{ provider.preview.progress }}</span>
              </span>
            </div>
          </div>

          <!-- Selection check -->
          <BkIcon
            v-if="isSelected(provider.id)"
            icon="check"
            :size="16"
            class="shrink-0 text-primary"
          />
        </button>
      </div>
    </div>

    <template #footer>
      <BkButton variant="outline" @click="handleClose">
        Cancel
      </BkButton>
      <BkButton
        :disabled="providers.length === 0 || selectedIds.size === 0"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </BkButton>
    </template>
  </BkModal>
</template>
