<script setup lang="ts">
import { watch } from 'vue'
import BkIcon from './BkIcon.vue'

interface Props {
  open: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '',
})

const emit = defineEmits<{
  close: []
}>()

const close = () => {
  emit('close')
}

// Prevent body scroll when modal is open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
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
      <div v-if="props.open">
        <!-- Overlay -->
        <div
          class="fixed inset-0 z-50 bg-overlay/80 backdrop-blur-sm"
          @click="close"
        />

        <!-- Modal -->
        <div
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg"
        >
          <!-- Header -->
          <div v-if="props.title || $slots.header" class="flex items-center justify-between mb-4">
            <slot name="header">
              <h3 class="text-lg font-medium text-foreground">{{ props.title }}</h3>
            </slot>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @click="close"
            >
              <BkIcon icon="x" />
            </button>
          </div>

          <!-- Body -->
          <div>
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex justify-end gap-2 mt-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
