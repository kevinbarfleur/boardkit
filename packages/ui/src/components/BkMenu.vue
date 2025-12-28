<script setup lang="ts">
import BkIcon from './BkIcon.vue'

// Types
export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
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
}

const props = withDefaults(defineProps<Props>(), {
  selectedIndex: -1,
  minWidth: 200,
})

const emit = defineEmits<{
  select: [item: MenuItem]
  hover: [index: number]
}>()

const getGlobalIndex = (groupIndex: number, itemIndex: number): number => {
  let idx = 0
  for (let g = 0; g < groupIndex; g++) {
    idx += props.groups[g].items.length
  }
  return idx + itemIndex
}

const handleClick = (item: MenuItem) => {
  if (!item.disabled) {
    emit('select', item)
  }
}

const handleMouseEnter = (globalIndex: number) => {
  emit('hover', globalIndex)
}
</script>

<template>
  <div
    class="rounded-lg border border-border bg-popover py-1.5 shadow-lg"
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
        role="menuitem"
        :aria-disabled="item.disabled"
        class="relative flex cursor-pointer items-center gap-3 mx-1.5 px-2.5 py-2 rounded-md text-sm transition-colors"
        :class="[
          item.disabled
            ? 'opacity-50 cursor-not-allowed'
            : getGlobalIndex(groupIndex, itemIndex) === selectedIndex
              ? 'bg-accent text-accent-foreground'
              : item.destructive
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
        ]"
        @click="handleClick(item)"
        @mouseenter="handleMouseEnter(getGlobalIndex(groupIndex, itemIndex))"
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
        <span class="flex-1">{{ item.label }}</span>

        <!-- Shortcut -->
        <span
          v-if="item.shortcut"
          class="ml-4 text-xs text-muted-foreground font-mono"
        >
          {{ item.shortcut }}
        </span>
      </div>
    </template>
  </div>
</template>
