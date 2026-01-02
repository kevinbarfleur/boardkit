<script setup lang="ts">
import { ref, computed } from 'vue'
import { BkIcon, BkContextMenu, BkInput, BkTooltip } from '@boardkit/ui'
import type { DocumentInfo } from '@boardkit/platform'

interface Props {
  documents: DocumentInfo[]
  activeDocumentId: string | null
  isLoading?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  collapsed: false,
})

const emit = defineEmits<{
  select: [id: string]
  create: []
  delete: [id: string]
  rename: [id: string, newTitle: string]
  duplicate: [id: string]
  openSettings: []
  toggleCollapse: []
}>()

// Context menu state
const contextMenuDocument = ref<DocumentInfo | null>(null)
const contextMenuPosition = ref({ x: 0, y: 0 })
const showContextMenu = ref(false)

// Rename state
const renamingDocument = ref<DocumentInfo | null>(null)
const renameValue = ref('')

// Computed
const sortedDocuments = computed(() => {
  return props.documents
})

// Get initials from document title
const getDocumentInitials = (title: string): string => {
  const words = title.split(/[\s-_]+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return title.slice(0, 2).toUpperCase()
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
const handleDocumentClick = (doc: DocumentInfo) => {
  if (renamingDocument.value?.id === doc.id) return
  emit('select', doc.id)
}

const handleContextMenu = (event: MouseEvent, doc: DocumentInfo) => {
  event.preventDefault()
  contextMenuDocument.value = doc
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const handleCloseContextMenu = () => {
  showContextMenu.value = false
  contextMenuDocument.value = null
}

const handleRenameStart = () => {
  if (!contextMenuDocument.value) return
  renamingDocument.value = contextMenuDocument.value
  renameValue.value = contextMenuDocument.value.title
  handleCloseContextMenu()
}

const handleRenameSubmit = () => {
  if (!renamingDocument.value || !renameValue.value.trim()) {
    renamingDocument.value = null
    return
  }

  const newTitle = renameValue.value.trim()
  if (newTitle !== renamingDocument.value.title) {
    emit('rename', renamingDocument.value.id, newTitle)
  }
  renamingDocument.value = null
}

const handleRenameCancel = () => {
  renamingDocument.value = null
}

const handleDuplicate = () => {
  if (!contextMenuDocument.value) return
  emit('duplicate', contextMenuDocument.value.id)
  handleCloseContextMenu()
}

const handleDelete = () => {
  if (!contextMenuDocument.value) return
  emit('delete', contextMenuDocument.value.id)
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
          <!-- Boardkit Logo - BK Overlapping -->
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-foreground shrink-0 select-none" style="font-family: 'Source Serif 4', serif;">
            <span class="relative z-10 text-sm font-semibold text-background">B</span>
            <span class="-ml-1 text-sm font-semibold text-background/55">K</span>
          </div>
          <span class="text-sm font-medium text-foreground truncate">
            Boardkit
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
        <BkTooltip content="Boardkit" side="right">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full bg-foreground hover:scale-105 transition-transform select-none"
            style="font-family: 'Source Serif 4', serif;"
            @click="emit('toggleCollapse')"
          >
            <span class="relative z-10 text-sm font-semibold text-background">B</span>
            <span class="-ml-1 text-sm font-semibold text-background/55">K</span>
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

    <!-- Document List -->
    <div class="flex-1 overflow-y-auto py-2" :class="collapsed ? 'px-3' : ''">
      <!-- Loading state -->
      <div v-if="props.isLoading" class="flex items-center justify-center py-8">
        <BkIcon icon="loader" class="w-5 h-5 text-muted-foreground animate-spin" />
      </div>

      <!-- Empty state -->
      <div v-else-if="sortedDocuments.length === 0" class="py-8 text-center" :class="collapsed ? '' : 'px-2'">
        <template v-if="collapsed">
          <BkIcon icon="file-text" class="w-5 h-5 text-muted-foreground/50 mx-auto" />
        </template>
        <template v-else>
          <BkIcon icon="file-text" class="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">No boards yet</p>
          <p class="text-xs text-muted-foreground/70 mt-1">Create a new board to get started</p>
        </template>
      </div>

      <!-- Document list - Expanded -->
      <div v-else-if="!collapsed" class="space-y-0.5 px-2">
        <div
          v-for="doc in sortedDocuments"
          :key="doc.id"
          class="group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors"
          :class="[
            doc.id === props.activeDocumentId
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50 text-foreground'
          ]"
          @click="handleDocumentClick(doc)"
          @contextmenu="handleContextMenu($event, doc)"
        >
          <!-- Active indicator -->
          <div
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-opacity"
            :class="doc.id === props.activeDocumentId ? 'bg-primary opacity-100' : 'opacity-0'"
          />

          <!-- Document icon -->
          <BkIcon
            :icon="doc.id === props.activeDocumentId ? 'check' : 'file-text'"
            class="w-4 h-4 shrink-0"
            :class="doc.id === props.activeDocumentId ? 'text-primary' : 'text-muted-foreground'"
          />

          <!-- Document title (or rename input) -->
          <div v-if="renamingDocument?.id === doc.id" class="flex-1 min-w-0" @click.stop>
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
            <p class="text-sm truncate">{{ doc.title }}</p>
            <p class="text-xs text-muted-foreground truncate">
              {{ formatRelativeTime(doc.updatedAt) }}
            </p>
          </div>

          <!-- More button (visible on hover) -->
          <button
            class="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-background/50 transition-opacity"
            @click.stop="handleContextMenu($event, doc)"
          >
            <BkIcon icon="more-horizontal" class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- Document list - Collapsed (initials) -->
      <div v-else class="space-y-1">
        <BkTooltip
          v-for="doc in sortedDocuments"
          :key="doc.id"
          :content="doc.title"
          side="right"
        >
          <button
            class="relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors mx-auto"
            :class="[
              doc.id === props.activeDocumentId
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 text-foreground'
            ]"
            @click="handleDocumentClick(doc)"
            @contextmenu="handleContextMenu($event, doc)"
          >
            <!-- Active indicator -->
            <div
              v-if="doc.id === props.activeDocumentId"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary"
            />
            <span class="text-xs font-medium">{{ getDocumentInitials(doc.title) }}</span>
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
