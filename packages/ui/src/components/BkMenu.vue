<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BkIcon from './BkIcon.vue'

// Types
export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
  /** Submenu items - if present, this item opens a submenu on hover.
   * Can be a simple list of items or grouped content with separators. */
  children?: MenuItem[] | MenuGroup[]
}

export interface MenuGroup {
  label?: string
  items: MenuItem[]
}

export type MenuContent = MenuGroup[]

interface Props {
  groups: MenuContent
  selectedIndex?: number
  minWidth?: number
  /** For submenus: which side to prefer opening */
  preferredSide?: 'left' | 'right'
  /** Depth level (0 = root menu) */
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedIndex: -1,
  minWidth: 200,
  preferredSide: 'right',
  depth: 0,
})

const emit = defineEmits<{
  select: [item: MenuItem]
  hover: [index: number]
}>()

// Track which submenu is open
const openSubmenuId = ref<string | null>(null)
const submenuPosition = ref<{ top: number; left: number; side: 'left' | 'right' }>({ top: 0, left: 0, side: 'right' })
const menuRef = ref<HTMLElement | null>(null)
const itemRefs = ref<Map<string, HTMLElement>>(new Map())

const getGlobalIndex = (groupIndex: number, itemIndex: number): number => {
  let idx = 0
  for (let g = 0; g < groupIndex; g++) {
    idx += props.groups[g].items.length
  }
  return idx + itemIndex
}

const handleClick = (item: MenuItem) => {
  if (!item.disabled && !item.children) {
    emit('select', item)
  }
}

const handleMouseEnter = (globalIndex: number, item: MenuItem, event: MouseEvent) => {
  emit('hover', globalIndex)

  if (item.children && item.children.length > 0) {
    openSubmenu(item, event)
  } else {
    openSubmenuId.value = null
  }
}

const handleMouseLeave = () => {
  // Small delay to allow moving to submenu
  setTimeout(() => {
    // Will be overridden if mouse enters submenu
  }, 100)
}

const openSubmenu = (item: MenuItem, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  if (!target || !menuRef.value) return

  const menuRect = menuRef.value.getBoundingClientRect()
  const itemRect = target.getBoundingClientRect()
  const submenuWidth = props.minWidth + 20

  // Check available space on both sides
  const spaceRight = window.innerWidth - menuRect.right
  const spaceLeft = menuRect.left

  // Determine which side to open
  let side: 'left' | 'right' = props.preferredSide
  if (side === 'right' && spaceRight < submenuWidth && spaceLeft >= submenuWidth) {
    side = 'left'
  } else if (side === 'left' && spaceLeft < submenuWidth && spaceRight >= submenuWidth) {
    side = 'right'
  }

  submenuPosition.value = {
    top: itemRect.top - menuRect.top - 6, // Align with item, account for padding
    left: side === 'right' ? menuRect.width - 4 : -submenuWidth + 4,
    side,
  }

  openSubmenuId.value = item.id
}

const closeSubmenu = () => {
  openSubmenuId.value = null
}

const handleSubmenuSelect = (item: MenuItem) => {
  emit('select', item)
  closeSubmenu()
}

const setItemRef = (id: string, el: HTMLElement | null) => {
  if (el) {
    itemRefs.value.set(id, el)
  } else {
    itemRefs.value.delete(id)
  }
}

// Helper to check if children are grouped (MenuGroup[]) vs flat (MenuItem[])
const isGroupedChildren = (children: MenuItem[] | MenuGroup[]): children is MenuGroup[] => {
  return children.length > 0 && 'items' in children[0]
}

// Find item with children by id and normalize to MenuContent format
const getSubmenuGroups = computed<MenuContent>(() => {
  if (!openSubmenuId.value) return []

  for (const group of props.groups) {
    const item = group.items.find(i => i.id === openSubmenuId.value)
    if (item?.children) {
      // If children are already grouped, use as-is; otherwise wrap in single group
      if (isGroupedChildren(item.children)) {
        return item.children
      }
      return [{ items: item.children }]
    }
  }
  return []
})
</script>

<template>
  <div
    ref="menuRef"
    class="rounded-lg border border-border bg-popover py-1.5 shadow-lg relative"
    :style="{ minWidth: `${minWidth}px` }"
  >
    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
      <!-- Group divider (not before first group) -->
      <div
        v-if="groupIndex > 0"
        class="my-1.5 h-px bg-border mx-2"
      />

      <!-- Group label -->
      <div
        v-if="group.label"
        class="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
      >
        {{ group.label }}
      </div>

      <!-- Group items -->
      <div
        v-for="(item, itemIndex) in group.items"
        :key="item.id"
        :ref="(el) => setItemRef(item.id, el as HTMLElement)"
        role="menuitem"
        :aria-disabled="item.disabled"
        :aria-haspopup="item.children ? 'menu' : undefined"
        :aria-expanded="item.children ? openSubmenuId === item.id : undefined"
        class="relative flex cursor-pointer items-center gap-3 mx-1.5 px-2.5 py-2 rounded-md text-sm transition-colors"
        :class="[
          item.disabled
            ? 'opacity-50 cursor-not-allowed'
            : getGlobalIndex(groupIndex, itemIndex) === selectedIndex || openSubmenuId === item.id
              ? 'bg-accent text-accent-foreground'
              : item.destructive
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
        ]"
        @click="handleClick(item)"
        @mouseenter="handleMouseEnter(getGlobalIndex(groupIndex, itemIndex), item, $event)"
      >
        <!-- Icon -->
        <BkIcon
          v-if="item.icon"
          :icon="item.icon"
          :size="16"
          class="shrink-0"
          :class="item.destructive ? 'text-destructive' : 'text-muted-foreground'"
        />

        <!-- Label -->
        <span class="flex-1 whitespace-nowrap">{{ item.label }}</span>

        <!-- Shortcut (only if no children) -->
        <span
          v-if="item.shortcut && !item.children"
          class="ml-4 text-xs text-muted-foreground font-mono"
        >
          {{ item.shortcut }}
        </span>

        <!-- Submenu indicator -->
        <BkIcon
          v-if="item.children && item.children.length > 0"
          icon="chevron-right"
          :size="14"
          class="ml-2 text-muted-foreground"
        />
      </div>
    </template>

    <!-- Submenu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="openSubmenuId && getSubmenuGroups.length > 0"
        class="absolute z-10"
        :style="{
          top: `${submenuPosition.top}px`,
          left: `${submenuPosition.left}px`,
        }"
        @mouseenter="() => {}"
        @mouseleave="closeSubmenu"
      >
        <BkMenu
          :groups="getSubmenuGroups"
          :min-width="minWidth"
          :preferred-side="submenuPosition.side"
          :depth="depth + 1"
          @select="handleSubmenuSelect"
        />
      </div>
    </Transition>
  </div>
</template>
