<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCommandState, generateItemId } from '../../composables/useCommandState'
import BkIcon from '../BkIcon.vue'

interface Props {
  value: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  keywords?: string[]
  group?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  select: [value: string]
}>()

const state = useCommandState()
const itemId = generateItemId()
const itemRef = ref<HTMLDivElement | null>(null)

// Check if this item is selected
const isSelected = computed(() => {
  const selectedItem = state.selectedItem.value
  return selectedItem?.value === props.value
})

// Register item with the state
onMounted(() => {
  state.registerItem({
    id: itemId,
    value: props.value,
    disabled: props.disabled,
    keywords: props.keywords,
    group: props.group,
  })
})

// Unregister on unmount
onUnmounted(() => {
  state.unregisterItem(itemId)
})

// Update registration when props change
watch(
  () => [props.value, props.disabled, props.keywords, props.group],
  () => {
    state.registerItem({
      id: itemId,
      value: props.value,
      disabled: props.disabled,
      keywords: props.keywords,
      group: props.group,
    })
  }
)

// Handle click
const handleClick = () => {
  if (!props.disabled) {
    emit('select', props.value)
  }
}

// Handle mouse enter - select this item
const handleMouseEnter = () => {
  if (!props.disabled) {
    state.selectItem(props.value)
  }
}
</script>

<template>
  <div
    ref="itemRef"
    :id="itemId"
    role="option"
    :aria-selected="isSelected"
    :aria-disabled="props.disabled"
    :data-value="props.value"
    :data-disabled="props.disabled || undefined"
    :data-selected="isSelected || undefined"
    class="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors"
    :class="[
      props.disabled
        ? 'opacity-50 pointer-events-none'
        : isSelected
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
    ]"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseEnter"
  >
    <BkIcon
      v-if="props.icon"
      :icon="props.icon"
      :size="16"
      class="shrink-0 text-muted-foreground"
    />
    <div class="flex-1 min-w-0 truncate">
      <slot />
    </div>
    <kbd
      v-if="props.shortcut"
      class="ml-auto text-xs text-muted-foreground tracking-widest"
    >
      {{ props.shortcut }}
    </kbd>
  </div>
</template>
