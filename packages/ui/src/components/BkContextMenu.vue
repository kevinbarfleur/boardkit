<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import BkMenu, { type MenuItem, type MenuContent } from './BkMenu.vue'

// Re-export types for convenience
export type { MenuItem, MenuContent }

// Legacy types for backward compatibility
export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
}

export interface ContextMenuSeparator {
  separator: true
}

export type ContextMenuItemOrSeparator = ContextMenuItem | ContextMenuSeparator

interface Props {
  open: boolean
  x: number
  y: number
  items?: ContextMenuItemOrSeparator[]
  groups?: MenuContent
  minWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 200,
})

const emit = defineEmits<{
  close: []
  select: [item: MenuItem]
}>()

const menuRef = ref<HTMLDivElement | null>(null)
const selectedIndex = ref(-1)

// Convert legacy items format to groups
const menuGroups = computed<MenuContent>(() => {
  if (props.groups) {
    return props.groups
  }

  if (props.items) {
    // Split items by separators into groups
    const groups: MenuContent = []
    let currentGroup: MenuItem[] = []

    for (const item of props.items) {
      if ('separator' in item && item.separator) {
        if (currentGroup.length > 0) {
          groups.push({ items: currentGroup })
          currentGroup = []
        }
      } else {
        currentGroup.push(item as MenuItem)
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ items: currentGroup })
    }

    return groups
  }

  return []
})

// Flatten for keyboard navigation
const flatItems = computed(() => {
  const items: MenuItem[] = []
  for (const group of menuGroups.value) {
    items.push(...group.items)
  }
  return items
})

// Calculate menu position to keep it in viewport
const menuStyle = computed(() => {
  const padding = 8
  const menuWidth = props.minWidth + 20
  const estimatedHeight = flatItems.value.length * 40 + menuGroups.value.length * 20 + 16

  let finalX = props.x
  let finalY = props.y

  if (typeof window !== 'undefined') {
    if (finalX + menuWidth > window.innerWidth - padding) {
      finalX = window.innerWidth - menuWidth - padding
    }
    if (finalY + estimatedHeight > window.innerHeight - padding) {
      finalY = window.innerHeight - estimatedHeight - padding
    }
    finalX = Math.max(padding, finalX)
    finalY = Math.max(padding, finalY)
  }

  return {
    left: `${finalX}px`,
    top: `${finalY}px`,
  }
})

const handleSelect = (item: MenuItem) => {
  if (!item.disabled) {
    emit('select', item)
    emit('close')
  }
}

const handleHover = (index: number) => {
  selectedIndex.value = index
}

const handleKeydown = (e: KeyboardEvent) => {
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
      emit('close')
      break
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      selectedIndex.value = -1
      await nextTick()
      menuRef.value?.focus()
    }
  }
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="props.open"
        ref="menuRef"
        tabindex="0"
        class="fixed z-50 outline-none"
        :style="menuStyle"
        @keydown="handleKeydown"
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
  </Teleport>
</template>
