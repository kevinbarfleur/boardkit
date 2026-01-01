<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BkIcon from './BkIcon.vue'

interface Props {
  /**
   * The current secret reference (e.g., "secret:my_api_key") or null if not set.
   * This is NOT the actual secret value, just the reference stored in module state.
   */
  modelValue?: string | null

  /** Placeholder text for the input */
  placeholder?: string

  /** Whether the input is disabled */
  disabled?: boolean

  /**
   * Whether a secret is currently stored in the vault.
   * Parent component should check this via hasSecret().
   */
  hasStoredSecret?: boolean

  /** Label to show when a secret is stored */
  storedLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Enter secret...',
  disabled: false,
  hasStoredSecret: false,
  storedLabel: 'Secret stored securely',
})

const emit = defineEmits<{
  /**
   * Emitted when the user saves a new secret value.
   * Parent should call setSecret() and then update modelValue with the reference.
   */
  saveSecret: [value: string]

  /**
   * Emitted when the user clears the secret.
   * Parent should call deleteSecret() and set modelValue to null.
   */
  clearSecret: []
}>()

// Local state
const inputValue = ref('')
const showPassword = ref(false)
const isEditing = ref(false)

// Whether we're showing the stored secret indicator
const showStoredIndicator = computed(() => {
  return props.hasStoredSecret && !isEditing.value
})

// Start editing mode
const startEditing = () => {
  if (props.disabled) return
  isEditing.value = true
  inputValue.value = ''
  showPassword.value = false
}

// Cancel editing
const cancelEditing = () => {
  isEditing.value = false
  inputValue.value = ''
  showPassword.value = false
}

// Save the secret
const saveSecret = () => {
  const value = inputValue.value.trim()
  if (!value) {
    cancelEditing()
    return
  }
  emit('saveSecret', value)
  isEditing.value = false
  inputValue.value = ''
  showPassword.value = false
}

// Clear the secret
const clearSecret = () => {
  emit('clearSecret')
  isEditing.value = false
  inputValue.value = ''
}

// Handle Enter key
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveSecret()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEditing()
  }
}

// Reset editing state when modelValue changes externally
watch(
  () => props.modelValue,
  () => {
    if (!isEditing.value) {
      inputValue.value = ''
    }
  }
)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <!-- Stored secret indicator -->
    <div
      v-if="showStoredIndicator"
      class="flex items-center gap-2 h-9 px-3 py-2 rounded-lg border border-border bg-muted/50"
    >
      <BkIcon icon="lock" :size="14" class="text-success shrink-0" />
      <span class="text-sm text-foreground flex-1 truncate">{{ storedLabel }}</span>
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
        title="Change secret"
        :disabled="disabled"
        @click="startEditing"
      >
        <BkIcon icon="pencil" :size="14" />
      </button>
      <button
        type="button"
        class="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1"
        title="Clear secret"
        :disabled="disabled"
        @click="clearSecret"
      >
        <BkIcon icon="x" :size="14" />
      </button>
    </div>

    <!-- Input mode (editing or no secret stored) -->
    <div v-else class="flex items-center gap-2">
      <div class="relative flex-1">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="inputValue"
          :placeholder="placeholder"
          :disabled="disabled"
          class="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          @keydown="onKeydown"
          @focus="isEditing = true"
        />
        <button
          v-if="inputValue"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          :title="showPassword ? 'Hide' : 'Show'"
          @click="showPassword = !showPassword"
        >
          <BkIcon :icon="showPassword ? 'eye-off' : 'eye'" :size="14" />
        </button>
      </div>

      <!-- Save/Cancel buttons when editing -->
      <template v-if="isEditing && inputValue.trim()">
        <button
          type="button"
          class="h-9 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          @click="saveSecret"
        >
          Save
        </button>
      </template>
      <template v-else-if="isEditing && hasStoredSecret">
        <button
          type="button"
          class="h-9 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          @click="cancelEditing"
        >
          Cancel
        </button>
      </template>
    </div>

    <!-- Helper text -->
    <p class="text-xs text-muted-foreground">
      <BkIcon icon="shield-check" :size="12" class="inline-block mr-1" />
      Stored locally, never included in shared files
    </p>
  </div>
</template>
