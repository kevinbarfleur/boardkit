<script setup lang="ts">
import BkIcon from './BkIcon.vue'
import BkToggle from './BkToggle.vue'
import BkButton from './BkButton.vue'

export interface PluginInfo {
  id: string
  name: string
  version: string
  author: string
  description: string
  icon?: string
  enabled: boolean
  updateAvailable?: string
  source?: string
}

const props = defineProps<{
  plugin: PluginInfo
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', enabled: boolean): void
  (e: 'update'): void
  (e: 'uninstall'): void
  (e: 'open-source'): void
}>()

function handleToggle(enabled: boolean) {
  emit('toggle', enabled)
}

function handleUpdate() {
  emit('update')
}

function handleUninstall() {
  emit('uninstall')
}

function handleOpenSource() {
  emit('open-source')
}
</script>

<template>
  <div
    class="rounded-lg border border-border bg-card p-3 transition-colors"
    :class="{ 'opacity-60': !plugin.enabled }"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        :class="plugin.enabled ? 'bg-primary/10' : 'bg-muted'"
      >
        <BkIcon
          :icon="plugin.icon || 'puzzle'"
          :size="18"
          :class="plugin.enabled ? 'text-primary' : 'text-muted-foreground'"
        />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-foreground truncate">
            {{ plugin.name }}
          </h3>
          <span class="text-xs text-muted-foreground">v{{ plugin.version }}</span>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5">
          by {{ plugin.author }}
        </p>
      </div>

      <!-- Toggle -->
      <BkToggle
        :model-value="plugin.enabled"
        :disabled="loading"
        size="sm"
        @update:model-value="handleToggle"
      />
    </div>

    <!-- Description -->
    <p class="mt-2 text-xs text-muted-foreground line-clamp-2">
      {{ plugin.description }}
    </p>

    <!-- Actions -->
    <div class="mt-3 flex items-center gap-2">
      <!-- Update available -->
      <BkButton
        v-if="plugin.updateAvailable"
        size="sm"
        variant="default"
        :disabled="loading"
        @click="handleUpdate"
      >
        <BkIcon icon="download" :size="12" class="mr-1" />
        Update to v{{ plugin.updateAvailable }}
      </BkButton>

      <!-- Source link -->
      <button
        v-if="plugin.source"
        class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        @click="handleOpenSource"
      >
        <BkIcon icon="github" :size="12" />
        <span>Source</span>
      </button>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Uninstall -->
      <button
        class="inline-flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors"
        :disabled="loading"
        @click="handleUninstall"
      >
        <BkIcon icon="trash-2" :size="12" />
        <span>Uninstall</span>
      </button>
    </div>
  </div>
</template>
