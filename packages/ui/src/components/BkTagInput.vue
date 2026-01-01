<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import BkIcon from './BkIcon.vue'

interface Props {
  modelValue: string[]
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
  allowCreate?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  suggestions: () => [],
  placeholder: 'Add tag...',
  maxTags: undefined,
  allowCreate: true,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

// Tag color palette
const tagColorPalette = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

// Hash-based color assignment for consistent tag colors
function getTagColor(tag: string): string {
  const hash = tag.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return tagColorPalette[hash % tagColorPalette.length]
}

// Local state
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)

// Computed
const canAddMore = computed(() => {
  if (props.maxTags === undefined) return true
  return props.modelValue.length < props.maxTags
})

const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) return []
  const query = inputValue.value.toLowerCase().trim()
  return props.suggestions
    .filter(s => s.toLowerCase().includes(query))
    .filter(s => !props.modelValue.includes(s))
    .slice(0, 6)
})

const showDropdown = computed(() => {
  return showSuggestions.value && filteredSuggestions.value.length > 0
})

// Watch for suggestion list changes
watch(filteredSuggestions, () => {
  selectedSuggestionIndex.value = -1
})

// Methods
function addTag(tag: string) {
  const trimmed = tag.trim()
  if (!trimmed) return
  if (props.modelValue.includes(trimmed)) return
  if (!canAddMore.value) return

  // Check if allowed (either in suggestions or allowCreate is true)
  if (!props.allowCreate && !props.suggestions.includes(trimmed)) return

  emit('update:modelValue', [...props.modelValue, trimmed])
  inputValue.value = ''
  showSuggestions.value = false
}

function removeTag(index: number) {
  const newTags = [...props.modelValue]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags)
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      if (selectedSuggestionIndex.value >= 0 && showDropdown.value) {
        addTag(filteredSuggestions.value[selectedSuggestionIndex.value])
      } else if (inputValue.value.trim()) {
        addTag(inputValue.value)
      }
      break
    case 'Backspace':
      if (!inputValue.value && props.modelValue.length > 0) {
        removeTag(props.modelValue.length - 1)
      }
      break
    case 'ArrowDown':
      if (showDropdown.value) {
        event.preventDefault()
        selectedSuggestionIndex.value = Math.min(
          selectedSuggestionIndex.value + 1,
          filteredSuggestions.value.length - 1
        )
      }
      break
    case 'ArrowUp':
      if (showDropdown.value) {
        event.preventDefault()
        selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
      break
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  showSuggestions.value = true
}

function handleFocus() {
  if (filteredSuggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

function handleBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 150)
}

function handleSuggestionClick(suggestion: string) {
  addTag(suggestion)
  nextTick(() => inputRef.value?.focus())
}

function handleContainerClick() {
  inputRef.value?.focus()
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex flex-wrap items-center gap-1 min-h-9 px-2 py-1.5 rounded-lg border border-border bg-background transition-colors"
    :class="[
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
      'focus-within:ring-2 focus-within:ring-ring'
    ]"
    @click="handleContainerClick"
  >
    <!-- Tags -->
    <span
      v-for="(tag, index) in modelValue"
      :key="tag"
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
      :style="{
        backgroundColor: getTagColor(tag) + '20',
        color: getTagColor(tag),
        border: `1px solid ${getTagColor(tag)}30`
      }"
    >
      {{ tag }}
      <button
        v-if="!disabled"
        type="button"
        class="flex items-center justify-center w-3 h-3 rounded-full hover:bg-black/10 transition-colors"
        @click.stop="removeTag(index)"
      >
        <BkIcon icon="x" :size="10" />
      </button>
    </span>

    <!-- Input -->
    <input
      ref="inputRef"
      :value="inputValue"
      type="text"
      :placeholder="modelValue.length === 0 ? placeholder : ''"
      :disabled="disabled || !canAddMore"
      class="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      @input="handleInput"
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Suggestions dropdown -->
    <div
      v-if="showDropdown"
      class="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
    >
      <div class="py-1">
        <button
          v-for="(suggestion, index) in filteredSuggestions"
          :key="suggestion"
          type="button"
          class="w-full px-3 py-1.5 text-left text-sm transition-colors"
          :class="[
            index === selectedSuggestionIndex
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-muted'
          ]"
          @mousedown.prevent="handleSuggestionClick(suggestion)"
        >
          <span
            class="inline-block w-2 h-2 rounded-full mr-2"
            :style="{ backgroundColor: getTagColor(suggestion) }"
          />
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>
