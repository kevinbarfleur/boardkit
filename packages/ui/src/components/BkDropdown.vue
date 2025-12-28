<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BkMenu, { type MenuItem, type MenuGroup, type MenuContent } from './BkMenu.vue'

// Support both simple items and grouped items
export interface DropdownItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
}

interface Props {
  items?: DropdownItem[]
  groups?: MenuContent
  align?: 'left' | 'right'
  minWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
  minWidth: 200,
})

const emit = defineEmits<{
  select: [item: MenuItem]
}>()

const isOpen = ref(false)
const selectedIndex = ref(-1)
const dropdownRef = ref<HTMLElement | null>(null)

// Convert simple items to groups if needed
const menuGroups = computed<MenuContent>(() => {
  if (props.groups) {
    return props.groups
  }
  if (props.items) {
    return [{ items: props.items }]
  }
  return []
})

// Flatten for keyboard nav
const flatItems = computed(() => {
  const items: MenuItem[] = []
  for (const group of menuGroups.value) {
    items.push(...group.items)
  }
  return items
})

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    selectedIndex.value = -1
  }
}

const close = () => {
  isOpen.value = false
  selectedIndex.value = -1
}

const handleSelect = (item: MenuItem) => {
  emit('select', item)
  close()
}

const handleHover = (index: number) => {
  selectedIndex.value = index
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return

  const items = flatItems.value

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      do {
        selectedIndex.value = (selectedIndex.value + 1) % items.length
      } while (items[selectedIndex.value]?.disabled)
      break
    case 'ArrowUp':
      e.preventDefault()
      do {
        selectedIndex.value = (selectedIndex.value - 1 + items.length) % items.length
      } while (items[selectedIndex.value]?.disabled)
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (selectedIndex.value >= 0 && !items[selectedIndex.value]?.disabled) {
        handleSelect(items[selectedIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      close()
      break
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <div @click="toggle">
      <slot name="trigger" />
    </div>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2"
        :class="props.align === 'right' ? 'right-0' : 'left-0'"
      >
        <BkMenu
          :groups="menuGroups"
          :selected-index="selectedIndex"
          :min-width="minWidth"
          @select="handleSelect"
          @hover="handleHover"
        />
      </div>
    </Transition>
  </div>
</template>
