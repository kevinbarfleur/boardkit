<script setup lang="ts">
/**
 * BkFormModal
 *
 * A modal dialog that renders a form based on a SettingsField schema.
 * Used internally by BkModalProvider.
 */
import { computed, watch, onUnmounted } from 'vue'
import type { ModalConfig } from '../types/modal'
import BkButton from './BkButton.vue'
import BkIcon from './BkIcon.vue'
import BkSchemaForm from './BkSchemaForm.vue'

interface Props {
  /** Whether the modal is open */
  open: boolean
  /** Modal configuration */
  config: ModalConfig
  /** Current form values */
  values: Record<string, unknown>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: []
  cancel: []
  update: [key: string, value: unknown]
}>()

// Modal size classes
const sizeClass = computed(() => {
  switch (props.config.size) {
    case 'sm':
      return 'max-w-sm'
    case 'lg':
      return 'max-w-2xl'
    default:
      return 'max-w-md'
  }
})

// Labels with defaults
const submitLabel = computed(() => props.config.submitLabel || 'Submit')
const cancelLabel = computed(() => props.config.cancelLabel || 'Cancel')

function handleSubmit() {
  emit('submit')
}

function handleCancel() {
  emit('cancel')
}

function handleFieldUpdate(key: string, value: unknown) {
  emit('update', key, value)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleCancel()
  } else if (e.key === 'Enter' && e.metaKey) {
    handleSubmit()
  }
}

// Scroll lock when modal is open
watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
  { immediate: true }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" @keydown="handleKeydown">
        <!-- Overlay -->
        <div
          class="fixed inset-0 z-50 bg-overlay/80 backdrop-blur-sm"
          @click="handleCancel"
        />

        <!-- Modal -->
        <div
          class="fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover shadow-lg"
          :class="sizeClass"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4">
            <div>
              <h3 class="text-base font-medium text-foreground">{{ config.title }}</h3>
              <p v-if="config.description" class="mt-0.5 text-sm text-muted-foreground">
                {{ config.description }}
              </p>
            </div>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              @click="handleCancel"
            >
              <BkIcon icon="x" :size="16" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            <BkSchemaForm
              :fields="config.fields"
              :values="values"
              variant="card"
              @update="handleFieldUpdate"
            />
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-border">
            <!-- Keyboard hint -->
            <span class="text-xs text-muted-foreground/60">
              <kbd class="px-1 py-0.5 bg-muted rounded text-[10px]">⌘</kbd> + <kbd class="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd> to submit
            </span>

            <div class="flex items-center gap-2">
              <BkButton variant="ghost" size="sm" @click="handleCancel">
                {{ cancelLabel }}
              </BkButton>
              <BkButton
                :variant="config.destructive ? 'destructive' : 'default'"
                size="sm"
                @click="handleSubmit"
              >
                {{ submitLabel }}
              </BkButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
