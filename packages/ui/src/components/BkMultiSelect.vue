<script setup lang="ts">
/**
 * BkMultiSelect
 *
 * Multi-select dropdown component matching BkSelect styling.
 * Allows selecting multiple options from a list.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import BkIcon from './BkIcon.vue'

export interface MultiSelectOption {
  value: string
  label: string
  color?: string
  disabled?: boolean
}

interface Props {
  modelValue: string[]
  options: MultiSelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'default'
  /** Maximum items to show before showing "+N more" */
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  disabled: false,
  size: 'default',
  maxDisplay: 2,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
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

// Get selected options
const selectedOptions = computed(() => {
  return props.options.filter(opt => props.modelValue.includes(opt.value))
})

// Display label
const displayLabel = computed(() => {
  if (selectedOptions.value.length === 0) {
    return props.placeholder
  }
  if (selectedOptions.value.length <= props.maxDisplay) {
    return selectedOptions.value.map(o => o.label).join(', ')
  }
  const shown = selectedOptions.value.slice(0, props.maxDisplay).map(o => o.label).join(', ')
  return `${shown} +${selectedOptions.value.length - props.maxDisplay}`
})

const isPlaceholder = computed(() => {
  return props.modelValue.length === 0
})

// Get enabled options indices
const enabledIndices = computed(() => {
  return props.options
    .map((opt, idx) => ({ opt, idx }))
    .filter(({ opt }) => !opt.disabled)
    .map(({ idx }) => idx)
})

// Check if option is selected
function isSelected(value: string): boolean {
  return props.modelValue.includes(value)
}

// Update dropdown position
const updatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  const spaceBelow = viewportHeight - rect.bottom
  const dropdownHeight = Math.min(props.options.length * 36 + 12, 240)

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
  highlightedIndex.value = 0
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

// Toggle option selection
const toggleOption = (value: string) => {
  const option = props.options.find(o => o.value === value)
  if (option?.disabled) return

  const newValue = isSelected(value)
    ? props.modelValue.filter(v => v !== value)
    : [...props.modelValue, value]

  emit('update:modelValue', newValue)
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
        const option = props.options[highlightedIndex.value]
        if (option && !option.disabled) {
          toggleOption(option.value)
        }
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
    'rounded-lg border border-border bg-background',
    'text-sm transition-colors',
    'focus-visible:outline-none focus-visible:border-border-strong',
  ]

  if (props.size === 'sm') {
    base.push('h-8 px-3 min-w-32')
  } else {
    base.push('h-9 px-3 min-w-36')
  }

  if (props.disabled) {
    base.push('cursor-not-allowed opacity-50')
  } else {
    base.push('cursor-pointer hover:bg-accent hover:text-accent-foreground')
  }

  // Highlight when has selections
  if (props.modelValue.length > 0) {
    base.push('border-primary/30 bg-primary/5')
  }

  return base.join(' ')
})

// Option classes
const getOptionClasses = (index: number) => {
  const option = props.options[index]
  const base = [
    'relative flex cursor-pointer items-center gap-2 mx-1.5 px-2.5 py-2 text-sm rounded-md',
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
      <div class="flex items-center gap-1 shrink-0">
        <span
          v-if="modelValue.length > 0"
          class="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-medium bg-primary text-primary-foreground rounded"
        >
          {{ modelValue.length }}
        </span>
        <BkIcon
          icon="chevron-down"
          :size="14"
          class="text-muted-foreground transition-transform duration-200"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </div>
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
          aria-multiselectable="true"
          :aria-activedescendant="highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined"
          class="rounded-lg border border-border bg-popover py-1.5 shadow-lg max-h-60 overflow-auto"
        >
          <div
            v-for="(option, index) in options"
            :key="option.value"
            :id="`option-${index}`"
            role="option"
            :aria-selected="isSelected(option.value)"
            :aria-disabled="option.disabled"
            :class="getOptionClasses(index)"
            @click="!option.disabled && toggleOption(option.value)"
            @mouseenter="!option.disabled && (highlightedIndex = index)"
          >
            <!-- Checkbox indicator -->
            <div
              class="flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0"
              :class="isSelected(option.value)
                ? 'bg-primary border-primary'
                : 'border-border'"
            >
              <BkIcon
                v-if="isSelected(option.value)"
                icon="check"
                :size="12"
                class="text-primary-foreground"
              />
            </div>

            <!-- Color indicator (if provided) -->
            <span
              v-if="option.color"
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ backgroundColor: option.color }"
            />

            <!-- Label -->
            <span class="flex-1 truncate">{{ option.label }}</span>
          </div>

          <!-- Empty state -->
          <div
            v-if="options.length === 0"
            class="px-3 py-2 text-sm text-muted-foreground text-center"
          >
            No options
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
