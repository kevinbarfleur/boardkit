<script setup lang="ts">
import { ref, computed } from 'vue'
import { BkIcon, BkContextMenu, BkInput, BkTooltip } from '@boardkit/ui'
import type { VaultFile } from '../composables/useVault'

interface Props {
  files: VaultFile[]
  activeFilePath: string | null
  vaultName: string | null
  isLoading?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  collapsed: false,
})

const emit = defineEmits<{
  select: [path: string]
  create: []
  delete: [path: string]
  rename: [path: string, newName: string]
  duplicate: [path: string]
  openSettings: []
  toggleCollapse: []
}>()

// Context menu state
const contextMenuFile = ref<VaultFile | null>(null)
const contextMenuPosition = ref({ x: 0, y: 0 })
const showContextMenu = ref(false)

// Rename state
const renamingFile = ref<VaultFile | null>(null)
const renameValue = ref('')

// Computed
const sortedFiles = computed(() => {
  return props.files
})

// Get initials from file name
const getFileInitials = (name: string): string => {
  const words = name.split(/[\s-_]+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString()
}

// Handlers
const handleFileClick = (file: VaultFile) => {
  if (renamingFile.value?.path === file.path) return
  emit('select', file.path)
}

const handleContextMenu = (event: MouseEvent, file: VaultFile) => {
  event.preventDefault()
  contextMenuFile.value = file
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const handleCloseContextMenu = () => {
  showContextMenu.value = false
  contextMenuFile.value = null
}

const handleRenameStart = () => {
  if (!contextMenuFile.value) return
  renamingFile.value = contextMenuFile.value
  renameValue.value = contextMenuFile.value.name
  handleCloseContextMenu()
}

const handleRenameSubmit = () => {
  if (!renamingFile.value || !renameValue.value.trim()) {
    renamingFile.value = null
    return
  }

  const newName = renameValue.value.trim()
  if (newName !== renamingFile.value.name) {
    emit('rename', renamingFile.value.path, newName)
  }
  renamingFile.value = null
}

const handleRenameCancel = () => {
  renamingFile.value = null
}

const handleDuplicate = () => {
  if (!contextMenuFile.value) return
  emit('duplicate', contextMenuFile.value.path)
  handleCloseContextMenu()
}

const handleDelete = () => {
  if (!contextMenuFile.value) return
  emit('delete', contextMenuFile.value.path)
  handleCloseContextMenu()
}

// Context menu items
const contextMenuItems = computed(() => [
  { id: 'rename', label: 'Rename', icon: 'pencil' },
  { id: 'duplicate', label: 'Duplicate', icon: 'copy' },
  { separator: true as const },
  { id: 'delete', label: 'Delete', icon: 'trash-2', destructive: true },
])

const handleContextMenuSelect = (item: { id: string }) => {
  switch (item.id) {
    case 'rename':
      handleRenameStart()
      break
    case 'duplicate':
      handleDuplicate()
      break
    case 'delete':
      handleDelete()
      break
  }
}
</script>

<template>
  <aside
    class="h-full flex flex-col bg-card border-r border-border shrink-0 transition-all duration-200"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Header -->
    <div
      class="flex items-center border-b border-border shrink-0 h-14"
      :class="collapsed ? 'justify-center px-3' : 'justify-between px-4'"
    >
      <!-- Expanded header -->
      <template v-if="!collapsed">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Boardkit Logo -->
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted p-1.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" class="w-full h-full">
              <rect x="3" y="3" width="8" height="8" rx="1.5" class="fill-foreground/30" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" class="fill-foreground/45" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" class="fill-foreground/60" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" class="fill-foreground/80" />
            </svg>
          </div>
          <span class="text-sm font-medium text-foreground truncate">
            {{ props.vaultName || 'Vault' }}
          </span>
        </div>
        <button
          class="shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          title="Collapse sidebar"
          @click="emit('toggleCollapse')"
        >
          <BkIcon icon="chevron-left" class="w-4 h-4 text-muted-foreground" />
        </button>
      </template>

      <!-- Collapsed header -->
      <template v-else>
        <BkTooltip :content="props.vaultName || 'Vault'" side="right">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-md bg-muted p-1.5 hover:bg-accent transition-colors"
            @click="emit('toggleCollapse')"
          >
            <svg viewBox="0 0 24 24" fill="none" class="w-full h-full">
              <rect x="3" y="3" width="8" height="8" rx="1.5" class="fill-foreground/30" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" class="fill-foreground/45" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" class="fill-foreground/60" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" class="fill-foreground/80" />
            </svg>
          </button>
        </BkTooltip>
      </template>
    </div>

    <!-- New Board Button -->
    <div class="border-b border-border shrink-0" :class="collapsed ? 'p-3' : 'px-3 py-2'">
      <BkTooltip v-if="collapsed" content="New Board" side="right">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mx-auto"
          @click="emit('create')"
        >
          <BkIcon icon="plus" class="w-5 h-5" />
        </button>
      </BkTooltip>
      <button
        v-else
        class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        @click="emit('create')"
      >
        <BkIcon icon="plus" class="w-4 h-4" />
        New Board
      </button>
    </div>

    <!-- File List -->
    <div class="flex-1 overflow-y-auto py-2" :class="collapsed ? 'px-3' : ''">
      <!-- Loading state -->
      <div v-if="props.isLoading" class="flex items-center justify-center py-8">
        <BkIcon icon="loader" class="w-5 h-5 text-muted-foreground animate-spin" />
      </div>

      <!-- Empty state -->
      <div v-else-if="sortedFiles.length === 0" class="py-8 text-center" :class="collapsed ? '' : 'px-2'">
        <template v-if="collapsed">
          <BkIcon icon="file-text" class="w-5 h-5 text-muted-foreground/50 mx-auto" />
        </template>
        <template v-else>
          <BkIcon icon="file-text" class="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">No boards yet</p>
          <p class="text-xs text-muted-foreground/70 mt-1">Create a new board to get started</p>
        </template>
      </div>

      <!-- File list - Expanded -->
      <div v-else-if="!collapsed" class="space-y-0.5 px-2">
        <div
          v-for="file in sortedFiles"
          :key="file.path"
          class="group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors"
          :class="[
            file.path === props.activeFilePath
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50 text-foreground'
          ]"
          @click="handleFileClick(file)"
          @contextmenu="handleContextMenu($event, file)"
        >
          <!-- Active indicator -->
          <div
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-opacity"
            :class="file.path === props.activeFilePath ? 'bg-primary opacity-100' : 'opacity-0'"
          />

          <!-- File icon -->
          <BkIcon
            :icon="file.path === props.activeFilePath ? 'check' : 'file-text'"
            class="w-4 h-4 shrink-0"
            :class="file.path === props.activeFilePath ? 'text-primary' : 'text-muted-foreground'"
          />

          <!-- File name (or rename input) -->
          <div v-if="renamingFile?.path === file.path" class="flex-1 min-w-0" @click.stop>
            <BkInput
              v-model="renameValue"
              class="h-7 text-sm"
              autofocus
              @keydown.enter="handleRenameSubmit"
              @keydown.escape="handleRenameCancel"
              @blur="handleRenameSubmit"
            />
          </div>
          <div v-else class="flex-1 min-w-0">
            <p class="text-sm truncate">{{ file.name }}</p>
            <p class="text-xs text-muted-foreground truncate">
              {{ formatRelativeTime(file.modifiedAt) }}
            </p>
          </div>

          <!-- More button (visible on hover) -->
          <button
            class="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-background/50 transition-opacity"
            @click.stop="handleContextMenu($event, file)"
          >
            <BkIcon icon="more-horizontal" class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- File list - Collapsed (initials) -->
      <div v-else class="space-y-1">
        <BkTooltip
          v-for="file in sortedFiles"
          :key="file.path"
          :content="file.name"
          side="right"
        >
          <button
            class="relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors mx-auto"
            :class="[
              file.path === props.activeFilePath
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 text-foreground'
            ]"
            @click="handleFileClick(file)"
            @contextmenu="handleContextMenu($event, file)"
          >
            <!-- Active indicator -->
            <div
              v-if="file.path === props.activeFilePath"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary"
            />
            <span class="text-xs font-medium">{{ getFileInitials(file.name) }}</span>
          </button>
        </BkTooltip>
      </div>
    </div>

    <!-- Footer - Settings -->
    <div class="border-t border-border shrink-0" :class="collapsed ? 'p-3' : 'px-3 py-2'">
      <BkTooltip v-if="collapsed" content="Settings" side="right">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors mx-auto"
          @click="emit('openSettings')"
        >
          <BkIcon icon="settings" class="w-5 h-5 text-muted-foreground" />
        </button>
      </BkTooltip>
      <button
        v-else
        class="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        @click="emit('openSettings')"
      >
        <BkIcon icon="settings" class="w-4 h-4" />
        Settings
      </button>
    </div>

    <!-- Context Menu -->
    <BkContextMenu
      :open="showContextMenu"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      :items="contextMenuItems"
      @close="handleCloseContextMenu"
      @select="handleContextMenuSelect"
    />
  </aside>
</template>
