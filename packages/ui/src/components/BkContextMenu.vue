<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import BkIcon from './BkIcon.vue'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  separator?: false
}

export interface ContextMenuSeparator {
  separator: true
}

export type ContextMenuItemOrSeparator = ContextMenuItem | ContextMenuSeparator

interface Props {
  open: boolean
  x: number
  y: number
  items: ContextMenuItemOrSeparator[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  select: [item: ContextMenuItem]
}>()

const menuRef = ref<HTMLDivElement | null>(null)
const selectedIndex = ref(-1)

const selectableItems = computed(() =>
  props.items.filter((item): item is ContextMenuItem => !('separator' in item && item.separator))
)

const menuStyle = computed(() => {
  const padding = 8
  const menuWidth = 180
  const menuHeight = props.items.length * 32 + 8

  let finalX = props.x
  let finalY = props.y

  if (typeof window !== 'undefined') {
    if (finalX + menuWidth > window.innerWidth - padding) {
      finalX = window.innerWidth - menuWidth - padding
    }
    if (finalY + menuHeight > window.innerHeight - padding) {
      finalY = window.innerHeight - menuHeight - padding
    }
    finalX = Math.max(padding, finalX)
    finalY = Math.max(padding, finalY)
  }

  return {
    left: `${finalX}px`,
    top: `${finalY}px`,
  }
})

const handleItemClick = (item: ContextMenuItem) => {
  if (!item.disabled) {
    emit('select', item)
    emit('close')
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  const items = selectableItems.value

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
        handleItemClick(items[selectedIndex.value])
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
        role="menu"
        tabindex="0"
        class="fixed z-50 min-w-[140px] rounded-lg border border-border bg-popover p-1 shadow-lg outline-none"
        :style="menuStyle"
        @keydown="handleKeydown"
      >
        <template v-for="(item, index) in props.items" :key="index">
          <div
            v-if="'separator' in item && item.separator"
            class="my-1 h-px bg-border"
          />

          <div
            v-else
            role="menuitem"
            :aria-disabled="item.disabled"
            class="relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
            :class="[
              item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : selectableItems.indexOf(item) === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            ]"
            @click="handleItemClick(item)"
            @mouseenter="selectedIndex = selectableItems.indexOf(item)"
          >
            <BkIcon
              v-if="item.icon"
              :icon="item.icon"
              class="text-muted-foreground"
            />
            <span class="flex-1">{{ item.label }}</span>
            <span
              v-if="item.shortcut"
              class="ml-auto text-xs text-muted-foreground"
            >
              {{ item.shortcut }}
            </span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
