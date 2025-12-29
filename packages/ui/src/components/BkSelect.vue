<script setup lang="ts" generic="T extends string | number">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import BkIcon from './BkIcon.vue'

export interface SelectOption<V = string> {
  value: V
  label: string
  disabled?: boolean
}

interface Props {
  modelValue: T | null
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const isOpen = ref(false)
const highlightedIndex = ref(-1)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)

// Dropdown position
const dropdownStyle = ref({
  top: '0px',
  left: '0px',
  minWidth: '0px',
})

// Get selected index
const selectedIndex = computed(() => {
  if (props.modelValue === null) return -1
  return props.options.findIndex((opt) => opt.value === props.modelValue)
})

// Get display label
const displayLabel = computed(() => {
  const selected = props.options.find((opt) => opt.value === props.modelValue)
  return selected?.label ?? props.placeholder
})

const isPlaceholder = computed(() => {
  return props.modelValue === null || !props.options.some((opt) => opt.value === props.modelValue)
})

// Get enabled options indices
const enabledIndices = computed(() => {
  return props.options
    .map((opt, idx) => ({ opt, idx }))
    .filter(({ opt }) => !opt.disabled)
    .map(({ idx }) => idx)
})

// Update dropdown position
const updatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  // Check if there's enough space below
  const spaceBelow = viewportHeight - rect.bottom
  const dropdownHeight = Math.min(props.options.length * 36 + 12, 200) // Estimate

  dropdownStyle.value = {
    top: spaceBelow > dropdownHeight
      ? `${rect.bottom + 4}px`
      : `${rect.top - dropdownHeight - 4}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
  }
}

// Open dropdown
const open = () => {
  if (props.disabled) return

  isOpen.value = true
  highlightedIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
  updatePosition()

  nextTick(() => {
    scrollToHighlighted()
  })
}

// Close dropdown
const close = () => {
  isOpen.value = false
  highlightedIndex.value = -1
}

// Toggle dropdown
const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

// Select option
const selectOption = (index: number) => {
  const option = props.options[index]
  if (option && !option.disabled) {
    emit('update:modelValue', option.value)
    close()
    triggerRef.value?.focus()
  }
}

// Navigate to next enabled option
const navigateNext = () => {
  if (enabledIndices.value.length === 0) return

  const currentEnabledIdx = enabledIndices.value.indexOf(highlightedIndex.value)
  if (currentEnabledIdx === -1 || currentEnabledIdx === enabledIndices.value.length - 1) {
    highlightedIndex.value = enabledIndices.value[0]
  } else {
    highlightedIndex.value = enabledIndices.value[currentEnabledIdx + 1]
  }
  scrollToHighlighted()
}

// Navigate to previous enabled option
const navigatePrev = () => {
  if (enabledIndices.value.length === 0) return

  const currentEnabledIdx = enabledIndices.value.indexOf(highlightedIndex.value)
  if (currentEnabledIdx <= 0) {
    highlightedIndex.value = enabledIndices.value[enabledIndices.value.length - 1]
  } else {
    highlightedIndex.value = enabledIndices.value[currentEnabledIdx - 1]
  }
  scrollToHighlighted()
}

// Scroll highlighted option into view
const scrollToHighlighted = () => {
  if (!listRef.value || highlightedIndex.value < 0) return

  const items = listRef.value.querySelectorAll('[role="option"]')
  const item = items[highlightedIndex.value] as HTMLElement
  if (item) {
    item.scrollIntoView({ block: 'nearest' })
  }
}

// Handle keyboard events on trigger
const handleTriggerKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else {
        event.key === 'ArrowDown' ? navigateNext() : navigatePrev()
      }
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (isOpen.value && highlightedIndex.value >= 0) {
        selectOption(highlightedIndex.value)
      } else {
        toggle()
      }
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        close()
      }
      break
    case 'Tab':
      if (isOpen.value) {
        close()
      }
      break
    case 'Home':
      if (isOpen.value && enabledIndices.value.length > 0) {
        event.preventDefault()
        highlightedIndex.value = enabledIndices.value[0]
        scrollToHighlighted()
      }
      break
    case 'End':
      if (isOpen.value && enabledIndices.value.length > 0) {
        event.preventDefault()
        highlightedIndex.value = enabledIndices.value[enabledIndices.value.length - 1]
        scrollToHighlighted()
      }
      break
  }
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (
    isOpen.value &&
    triggerRef.value &&
    dropdownRef.value &&
    !triggerRef.value.contains(target) &&
    !dropdownRef.value.contains(target)
  ) {
    close()
  }
}

// Handle scroll - close dropdown
const handleScroll = () => {
  if (isOpen.value) {
    close()
  }
}

// Handle resize - update position
const handleResize = () => {
  if (isOpen.value) {
    updatePosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
})

// Watch for external close
watch(isOpen, (value) => {
  if (!value) {
    highlightedIndex.value = -1
  }
})

// Trigger classes
const triggerClasses = computed(() => {
  const base = [
    'inline-flex items-center justify-between gap-2',
    'rounded-md border border-input bg-background',
    'text-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ]

  if (props.size === 'sm') {
    base.push('h-8 px-2.5 min-w-32')
  } else {
    base.push('h-9 px-3 min-w-36')
  }

  if (props.disabled) {
    base.push('cursor-not-allowed opacity-50')
  } else {
    base.push('cursor-pointer hover:bg-accent hover:text-accent-foreground')
  }

  return base.join(' ')
})

// Option classes
const getOptionClasses = (index: number) => {
  const option = props.options[index]
  const base = [
    'relative flex cursor-pointer items-center px-3 py-2 text-sm rounded-sm',
    'transition-colors outline-none',
  ]

  if (option.disabled) {
    base.push('opacity-50 cursor-not-allowed')
  } else if (index === highlightedIndex.value) {
    base.push('bg-accent text-accent-foreground')
  } else {
    base.push('text-foreground hover:bg-accent hover:text-accent-foreground')
  }

  return base.join(' ')
}
</script>

<template>
  <div class="relative inline-block">
    <!-- Trigger button -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      aria-autocomplete="none"
      :class="triggerClasses"
      @click="toggle"
      @keydown="handleTriggerKeydown"
    >
      <span :class="isPlaceholder ? 'text-muted-foreground' : 'text-foreground'" class="truncate">
        {{ displayLabel }}
      </span>
      <BkIcon
        icon="chevron-down"
        :size="14"
        class="shrink-0 text-muted-foreground transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="fixed z-50"
        :style="dropdownStyle"
      >
        <div
          ref="listRef"
          role="listbox"
          :aria-activedescendant="highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined"
          class="rounded-lg border border-border bg-popover py-1 shadow-lg max-h-52 overflow-auto"
        >
          <div
            v-for="(option, index) in options"
            :key="String(option.value)"
            :id="`option-${index}`"
            role="option"
            :aria-selected="option.value === modelValue"
            :aria-disabled="option.disabled"
            :class="getOptionClasses(index)"
            @click="!option.disabled && selectOption(index)"
            @mouseenter="!option.disabled && (highlightedIndex = index)"
          >
            <span class="flex-1 truncate">{{ option.label }}</span>
            <BkIcon
              v-if="option.value === modelValue"
              icon="check"
              :size="14"
              class="shrink-0 text-primary"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
