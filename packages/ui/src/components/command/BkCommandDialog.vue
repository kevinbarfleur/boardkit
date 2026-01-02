<script setup lang="ts">
import { watch, ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { createCommandState, provideCommandState } from '../../composables/useCommandState'

interface Props {
  open: boolean
  loop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loop: true,
})

const emit = defineEmits<{
  close: []
  select: [value: string]
}>()

// Create and provide command state
const state = createCommandState({ loop: props.loop })
provideCommandState(state)

const dialogRef = ref<HTMLDivElement | null>(null)
const dialogId = `cmd-dialog-${Math.random().toString(36).slice(2, 9)}`
const listboxId = `${dialogId}-listbox`

// Computed active descendant for ARIA
const activeDescendant = computed(() => {
  const item = state.selectedItem.value
  return item ? item.id : undefined
})

// Close the dialog
const close = () => {
  state.search.value = ''
  state.selectedIndex.value = 0
  emit('close')
}

// Handle keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      e.stopPropagation()
      close()
      break

    case 'ArrowDown':
      e.preventDefault()
      if (e.metaKey || e.ctrlKey) {
        state.last()
      } else {
        state.next()
      }
      scrollSelectedIntoView()
      break

    case 'ArrowUp':
      e.preventDefault()
      if (e.metaKey || e.ctrlKey) {
        state.first()
      } else {
        state.prev()
      }
      scrollSelectedIntoView()
      break

    case 'Home':
      e.preventDefault()
      state.first()
      scrollSelectedIntoView()
      break

    case 'End':
      e.preventDefault()
      state.last()
      scrollSelectedIntoView()
      break

    case 'Enter':
      e.preventDefault()
      const selectedItem = state.selectedItem.value
      if (selectedItem && !selectedItem.disabled) {
        emit('select', selectedItem.value)
        close()
      }
      break

    case 'Tab':
      // Prevent tab from leaving the dialog - trap focus
      e.preventDefault()
      if (e.shiftKey) {
        state.prev()
      } else {
        state.next()
      }
      scrollSelectedIntoView()
      break
  }
}

// Scroll selected item into view
const scrollSelectedIntoView = async () => {
  await nextTick()

  const listEl = state.listRef.value
  if (!listEl) return

  const selectedItem = state.selectedItem.value
  if (!selectedItem) return

  const itemEl = listEl.querySelector(`[data-value="${CSS.escape(selectedItem.value)}"]`) as HTMLElement
  if (!itemEl) return

  // Get the scroll container (the listbox)
  const scrollContainer = listEl

  // Get positions relative to scroll container
  const containerRect = scrollContainer.getBoundingClientRect()
  const itemRect = itemEl.getBoundingClientRect()

  // Calculate if item is outside visible area
  const itemTop = itemRect.top - containerRect.top + scrollContainer.scrollTop
  const itemBottom = itemTop + itemRect.height
  const visibleTop = scrollContainer.scrollTop
  const visibleBottom = visibleTop + scrollContainer.clientHeight

  // Scroll padding for better UX
  const scrollPadding = 8

  if (itemTop < visibleTop + scrollPadding) {
    // Item is above visible area - scroll up
    scrollContainer.scrollTop = itemTop - scrollPadding
  } else if (itemBottom > visibleBottom - scrollPadding) {
    // Item is below visible area - scroll down
    scrollContainer.scrollTop = itemBottom - scrollContainer.clientHeight + scrollPadding
  }
}

// Reset state when dialog opens
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      state.search.value = ''
      state.selectedIndex.value = 0
      await nextTick()
      // Focus will be managed by the input
    } else {
      document.body.style.overflow = ''
    }
  }
)

// Reset selection when search changes
watch(
  () => state.search.value,
  () => {
    state.selectedIndex.value = 0
  }
)

// Keep selection in bounds when filtered items change
watch(
  () => state.filteredItems.value.length,
  (length) => {
    if (state.selectedIndex.value >= length) {
      state.selectedIndex.value = Math.max(0, length - 1)
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        :id="dialogId"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        class="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]"
        @keydown="handleKeydown"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-overlay/80 backdrop-blur-sm"
          aria-hidden="true"
          @click="close"
        />

        <!-- Dialog content -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="props.open"
            ref="dialogRef"
            class="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <slot
              :listbox-id="listboxId"
              :active-descendant="activeDescendant"
            />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
