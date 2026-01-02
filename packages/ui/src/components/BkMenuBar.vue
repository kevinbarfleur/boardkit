<script setup lang="ts">
/**
 * BkMenuBar - Unified app bar component
 *
 * Combines:
 * - Editable board title
 * - Menu dropdowns (via MenuRegistry)
 * - Command palette trigger
 * - Undo/Redo with history dropdowns
 * - View controls (reset view, theme toggle)
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { menuRegistry, actionRegistry, useBoardStore, useToolStore } from '@boardkit/core'
import type { MenuDefinition, MenuItem, ActionContext } from '@boardkit/core'
import BkIcon from './BkIcon.vue'
import BkIconButton from './BkIconButton.vue'
import BkTooltip from './BkTooltip.vue'
import BkDivider from './BkDivider.vue'
import BkEditableText from './BkEditableText.vue'
import BkHistoryList, { type HistoryItem } from './BkHistoryList.vue'
import { useTheme } from '../composables/useTheme'

interface Props {
  /** Platform for filtering menus ('web' | 'desktop') */
  platform?: 'web' | 'desktop'
  /** Whether document is currently saving */
  isSaving?: boolean
  /** Timestamp of last save */
  lastSaved?: number | null
  /** Whether undo is available */
  canUndo?: boolean
  /** Whether redo is available */
  canRedo?: boolean
  /** History entries for undo dropdown */
  undoEntries?: HistoryItem[]
  /** History entries for redo dropdown */
  redoEntries?: HistoryItem[]
}

const props = withDefaults(defineProps<Props>(), {
  platform: 'web',
  isSaving: false,
  lastSaved: null,
  canUndo: false,
  canRedo: false,
  undoEntries: () => [],
  redoEntries: () => [],
})

const emit = defineEmits<{
  /** Emitted when title is changed */
  'update:title': [title: string]
  /** Emitted when title change should rename file (desktop) */
  'title-change': [title: string]
  /** Emitted when command palette should open */
  'open-command-palette': []
  /** Emitted when undo is requested */
  'undo': []
  /** Emitted when redo is requested */
  'redo': []
  /** Emitted when navigating to a specific history entry */
  'go-to-history': [id: string]
  /** Emitted when going to latest version */
  'go-to-latest': []
}>()

// State
const openMenuId = ref<string | null>(null)
const menus = ref<MenuDefinition[]>([])
const showUndoDropdown = ref(false)
const showRedoDropdown = ref(false)

// Get stores
const boardStore = useBoardStore()
const toolStore = useToolStore()
const { theme, toggleTheme } = useTheme()

// Local title ref synced with store
const title = ref(boardStore.title)

watch(() => boardStore.title, (newTitle) => {
  title.value = newTitle
})

/**
 * Build the action context for menu item execution
 */
function createActionContext(): ActionContext {
  return {
    selectedWidget: boardStore.selectedWidget,
    selectedWidgetId: boardStore.selectedWidgetId,
    selectedWidgetIds: boardStore.selectedWidgetIds,
    selectedElement: boardStore.selectedElement,
    selectedElementId: boardStore.selectedElementId,
    selectedElementIds: boardStore.selectedElementIds,
    isMultiSelection: boardStore.isMultiSelection,
    selectionCount: boardStore.selectionCount,
    activeTool: toolStore.activeTool,
    viewport: boardStore.viewport,
    widgets: boardStore.widgets,
    elements: boardStore.elements,
    platform: props.platform,
    isDirty: boardStore.isDirty,
  }
}

/**
 * Refresh menus from registry
 */
function refreshMenus(): void {
  menus.value = menuRegistry.getMenus(props.platform)
}

/**
 * Handle title update
 */
function handleTitleUpdate(newTitle: string): void {
  boardStore.setTitle(newTitle)
  emit('update:title', newTitle)
  emit('title-change', newTitle)
}

/**
 * Handle menu trigger click
 */
function handleMenuClick(menuId: string): void {
  if (openMenuId.value === menuId) {
    openMenuId.value = null
  } else {
    openMenuId.value = menuId
  }
}

/**
 * Handle menu item click
 */
async function handleItemClick(item: MenuItem): Promise<void> {
  if (item.separator) return

  const ctx = createActionContext()

  // Check if item is disabled
  if (item.when && !item.when(ctx)) {
    return
  }

  // Execute action
  if (item.actionId) {
    try {
      await actionRegistry.execute(item.actionId, ctx)
    } catch (error) {
      console.error(`[BkMenuBar] Failed to execute action "${item.actionId}":`, error)
    }
  } else if (item.run) {
    try {
      await item.run(ctx)
    } catch (error) {
      console.error(`[BkMenuBar] Failed to run menu item "${item.id}":`, error)
    }
  }

  // Close menu after action
  openMenuId.value = null
}

/**
 * Check if menu item is disabled
 */
function isItemDisabled(item: MenuItem): boolean {
  if (item.separator) return false
  if (!item.when) return false
  return !item.when(createActionContext())
}

/**
 * Close menu when clicking outside
 */
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.bk-appbar')) {
    openMenuId.value = null
  }
}

/**
 * Reset view to default
 */
function resetView(): void {
  boardStore.updateViewport({ x: 0, y: 0, zoom: 1 })
}

/**
 * Handle undo click
 */
function handleUndoClick(): void {
  if (props.canUndo) {
    emit('undo')
  }
}

/**
 * Handle redo click
 */
function handleRedoClick(): void {
  if (props.canRedo) {
    emit('redo')
  }
}

/**
 * Handle history entry selection
 */
function handleHistorySelect(id: string): void {
  emit('go-to-history', id)
  showUndoDropdown.value = false
  showRedoDropdown.value = false
}

/**
 * Handle go to latest
 */
function handleGoToLatest(): void {
  emit('go-to-latest')
  showRedoDropdown.value = false
}

// Lifecycle
onMounted(() => {
  refreshMenus()
  const unsubscribe = menuRegistry.subscribe(refreshMenus)
  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    unsubscribe()
    document.removeEventListener('click', handleClickOutside)
  })
})

// Watch for platform changes
watch(() => props.platform, refreshMenus)
</script>

<template>
  <header class="bk-appbar">
    <!-- Left section: Editable Title -->
    <div class="appbar-title">
      <BkEditableText
        v-model="title"
        placeholder="Untitled Board"
        variant="title"
        max-width="240px"
        @update:model-value="handleTitleUpdate"
      />
    </div>

    <!-- Separator between title and menus -->
    <BkDivider orientation="vertical" class="appbar-title-separator" />

    <!-- Center-left section: Menus -->
    <nav class="appbar-menus">
      <div
        v-for="menu in menus"
        :key="menu.id"
        class="menu-trigger"
        :class="{ open: openMenuId === menu.id }"
        @click.stop="handleMenuClick(menu.id)"
      >
        {{ menu.label }}

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div
            v-if="openMenuId === menu.id"
            class="dropdown-menu"
            @click.stop
          >
            <template v-for="item in menu.items" :key="item.id">
              <!-- Separator -->
              <div v-if="item.separator" class="dropdown-separator" />

              <!-- Submenu -->
              <div
                v-else-if="item.submenu && item.submenu.length > 0"
                class="dropdown-item has-submenu"
                :class="{ disabled: isItemDisabled(item) }"
              >
                <BkIcon v-if="item.icon" :icon="item.icon" class="item-icon" />
                <span class="item-label">{{ item.label }}</span>
                <BkIcon icon="chevron-right" class="submenu-arrow" />

                <div class="submenu">
                  <button
                    v-for="subitem in item.submenu"
                    :key="subitem.id"
                    class="dropdown-item"
                    :class="{ disabled: isItemDisabled(subitem), destructive: subitem.destructive }"
                    :disabled="isItemDisabled(subitem)"
                    @click="handleItemClick(subitem)"
                  >
                    <BkIcon v-if="subitem.icon" :icon="subitem.icon" class="item-icon" />
                    <span class="item-label">{{ subitem.label }}</span>
                    <span v-if="subitem.shortcutHint" class="item-shortcut">{{ subitem.shortcutHint }}</span>
                  </button>
                </div>
              </div>

              <!-- Regular item -->
              <button
                v-else
                class="dropdown-item"
                :class="{ disabled: isItemDisabled(item), destructive: item.destructive }"
                :disabled="isItemDisabled(item)"
                @click="handleItemClick(item)"
              >
                <BkIcon v-if="item.icon" :icon="item.icon" class="item-icon" />
                <span class="item-label">{{ item.label }}</span>
                <span v-if="item.shortcutHint" class="item-shortcut">{{ item.shortcutHint }}</span>
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Spacer -->
    <div class="appbar-spacer" />

    <!-- Center-right section: Command Palette trigger -->
    <button
      class="appbar-search"
      @click="emit('open-command-palette')"
    >
      <BkIcon icon="search" :size="14" />
      <span>Search...</span>
      <kbd>&#8984;K</kbd>
    </button>

    <!-- Right section: Actions -->
    <div class="appbar-actions">
      <!-- Undo Button with dropdown -->
      <div
        class="history-control"
        @mouseenter="showUndoDropdown = true"
        @mouseleave="showUndoDropdown = false"
      >
        <BkTooltip :content="canUndo ? 'Undo' : 'Nothing to undo'">
          <BkIconButton
            ariaLabel="Undo"
            :disabled="!canUndo"
            size="sm"
            @click="handleUndoClick"
          >
            <BkIcon icon="undo-2" :size="16" />
          </BkIconButton>
        </BkTooltip>

        <!-- Undo Dropdown -->
        <Transition name="dropdown">
          <div
            v-if="showUndoDropdown && undoEntries.length > 0"
            class="history-dropdown"
          >
            <BkHistoryList
              :items="undoEntries"
              title="Previous versions"
              @select="handleHistorySelect"
            />
          </div>
        </Transition>
      </div>

      <!-- Redo Button with dropdown -->
      <div
        class="history-control"
        @mouseenter="showRedoDropdown = true"
        @mouseleave="showRedoDropdown = false"
      >
        <BkTooltip :content="canRedo ? 'Redo' : 'Up to date'">
          <BkIconButton
            ariaLabel="Redo"
            :disabled="!canRedo"
            size="sm"
            @click="handleRedoClick"
          >
            <BkIcon icon="redo-2" :size="16" />
          </BkIconButton>
        </BkTooltip>

        <!-- Redo Dropdown -->
        <Transition name="dropdown">
          <div
            v-if="showRedoDropdown"
            class="history-dropdown"
          >
            <BkHistoryList
              :items="redoEntries"
              :title="canRedo ? 'Newer versions' : 'Status'"
              empty-text="Up to date"
              :show-go-to-latest="redoEntries.length > 0"
              @select="handleHistorySelect"
              @go-to-latest="handleGoToLatest"
            />
          </div>
        </Transition>
      </div>

      <BkDivider orientation="vertical" class="appbar-divider" />

      <!-- Reset view -->
      <BkTooltip content="Reset view">
        <BkIconButton ariaLabel="Reset view" size="sm" @click="resetView">
          <BkIcon icon="rotate-ccw" :size="16" />
        </BkIconButton>
      </BkTooltip>

      <!-- Theme toggle -->
      <BkTooltip :content="theme === 'dark' ? 'Light mode' : 'Dark mode'">
        <BkIconButton ariaLabel="Toggle theme" size="sm" @click="toggleTheme">
          <BkIcon v-if="theme === 'dark'" icon="sun" :size="16" />
          <BkIcon v-else icon="moon" :size="16" />
        </BkIconButton>
      </BkTooltip>
    </div>
  </header>
</template>

<style scoped>
.bk-appbar {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  user-select: none;
  gap: 12px;
}

/* Title section */
.appbar-title {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.appbar-title-separator {
  height: 20px;
  margin: 0;
  opacity: 0.4;
}

/* Navigation menus */
.appbar-menus {
  display: flex;
  align-items: center;
  gap: 2px;
}

.menu-trigger {
  position: relative;
  padding: 4px 10px;
  font-size: 13px;
  color: hsl(var(--foreground));
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.1s;
}

.menu-trigger:hover,
.menu-trigger.open {
  background: hsl(var(--accent));
}

/* Spacer */
.appbar-spacer {
  flex: 1;
}

/* Search trigger */
.appbar-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.appbar-search:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.appbar-search kbd {
  padding: 2px 5px;
  font-size: 10px;
  font-family: system-ui, sans-serif;
  background: hsl(var(--muted));
  border-radius: 3px;
  color: hsl(var(--muted-foreground));
}

/* Actions section */
.appbar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.appbar-divider {
  height: 20px;
  margin: 0 6px;
}

/* History control with dropdown */
.history-control {
  position: relative;
}

.history-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 1000;
}

/* Dropdown styles */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 200px;
  padding: 4px;
  background: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.dropdown-separator {
  height: 1px;
  margin: 4px 8px;
  background: hsl(var(--border));
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  font-size: 13px;
  color: hsl(var(--popover-foreground));
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s;
}

.dropdown-item:hover:not(.disabled) {
  background: hsl(var(--accent));
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item.destructive {
  color: hsl(var(--destructive));
}

.item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.7;
}

.item-label {
  flex: 1;
}

.item-shortcut {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  font-family: system-ui, sans-serif;
}

/* Submenu */
.has-submenu {
  position: relative;
}

.submenu-arrow {
  width: 12px;
  height: 12px;
  opacity: 0.5;
}

.submenu {
  position: absolute;
  left: 100%;
  top: -4px;
  min-width: 180px;
  padding: 4px;
  background: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s, visibility 0.15s;
}

.has-submenu:hover .submenu {
  opacity: 1;
  visibility: visible;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
