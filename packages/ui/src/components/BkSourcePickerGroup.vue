<script setup lang="ts">
/**
 * BkSourcePickerGroup
 *
 * A group of source pickers organized by contract type.
 * Displays as collapsible sections, one per contract.
 * Used by modules that consume multiple contract types (e.g., Stats Card).
 */
import { computed } from 'vue'
import BkIcon from './BkIcon.vue'
import BkFormSection from './BkFormSection.vue'
import BkSourcePicker, { type SourcePickerProvider } from './BkSourcePicker.vue'

export interface ContractGroup {
  /** Contract ID */
  contractId: string
  /** State key where connections are stored */
  stateKey: string
  /** Display label */
  label: string
  /** Icon name */
  icon: string
  /** Available providers */
  providers: SourcePickerProvider[]
  /** Current connections */
  connections: string[]
}

interface Props {
  /** Section title */
  title?: string
  /** Section icon */
  icon?: string
  /** Contract groups to display */
  groups: ContractGroup[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Data Sources',
  icon: 'database',
})

const emit = defineEmits<{
  'update:connections': [stateKey: string, connections: string[]]
}>()

// Count total connections
const totalConnections = computed(() => {
  return props.groups.reduce((sum, group) => sum + group.connections.length, 0)
})

// Handle connection change for a specific group
function handleGroupChange(stateKey: string, connections: string | string[] | null) {
  const normalized = connections
    ? Array.isArray(connections)
      ? connections
      : [connections]
    : []
  emit('update:connections', stateKey, normalized)
}
</script>

<template>
  <BkFormSection :title="title" no-dividers>
    <template #title>
      <span class="flex items-center gap-1.5">
        <BkIcon v-if="icon" :icon="icon" :size="12" />
        {{ title }}
        <span v-if="totalConnections > 0" class="text-primary">
          ({{ totalConnections }})
        </span>
      </span>
    </template>

    <div class="divide-y divide-border">
      <div
        v-for="group in groups"
        :key="group.contractId"
        class="py-2"
      >
        <!-- Group header -->
        <div class="px-3 pb-2 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-foreground">
            <BkIcon :icon="group.icon" :size="14" class="text-muted-foreground" />
            <span>{{ group.label }}</span>
          </div>
          <span
            v-if="group.connections.length > 0"
            class="text-xs text-primary font-medium"
          >
            {{ group.connections.length }} connected
          </span>
        </div>

        <!-- Provider list -->
        <div v-if="group.providers.length > 0" class="px-3 space-y-1">
          <button
            v-for="provider in group.providers"
            :key="provider.id"
            type="button"
            class="w-full flex items-center gap-2 p-2 rounded-md transition-all text-left"
            :class="[
              group.connections.includes(provider.id)
                ? 'bg-primary/10'
                : 'hover:bg-accent/50',
            ]"
            @click="
              handleGroupChange(
                group.stateKey,
                group.connections.includes(provider.id)
                  ? group.connections.filter((id) => id !== provider.id)
                  : [...group.connections, provider.id]
              )
            "
          >
            <!-- Checkbox -->
            <div
              class="shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
              :class="[
                group.connections.includes(provider.id)
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/40',
              ]"
            >
              <BkIcon
                v-if="group.connections.includes(provider.id)"
                icon="check"
                :size="10"
                class="text-primary-foreground"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="text-sm text-foreground truncate">
                {{ provider.title }}
              </div>
              <div v-if="provider.meta" class="text-xs text-muted-foreground">
                {{ provider.meta }}
              </div>
            </div>
          </button>
        </div>

        <!-- Empty state for this group -->
        <div v-else class="px-3 py-2 text-xs text-muted-foreground text-center">
          No {{ group.label.toLowerCase() }} widgets on board
        </div>
      </div>
    </div>
  </BkFormSection>
</template>
