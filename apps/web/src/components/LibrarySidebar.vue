<script setup lang="ts">
import { computed } from 'vue'
import { BkIcon, BkTooltip } from '@boardkit/ui'
import type { ModuleTypeInfo } from '../composables/useLibraryView'

interface Props {
  /** Module types with counts */
  moduleTypes: ModuleTypeInfo[]
  /** Currently selected module type (null = all) */
  selectedType: string | null
  /** Total widget count */
  totalCount: number
  /** Whether sidebar is collapsed */
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
})

const emit = defineEmits<{
  /** Emitted when a module type is selected */
  'select-type': [moduleId: string | null]
  /** Emitted when toggle collapse is clicked */
  'toggle-collapse': []
}>()

// Computed
const isAllSelected = computed(() => props.selectedType === null)
</script>

<template>
  <aside
    class="h-full flex flex-col bg-card border-r border-border shrink-0 transition-all duration-200"
    :class="collapsed ? 'w-16' : 'w-56'"
  >
    <!-- Header -->
    <div
      class="flex items-center border-b border-border shrink-0 h-14"
      :class="collapsed ? 'justify-center px-3' : 'justify-between px-4'"
    >
      <template v-if="!collapsed">
        <div class="flex items-center gap-2 min-w-0">
          <BkIcon icon="library" class="w-5 h-5 text-primary shrink-0" />
          <span class="text-sm font-medium text-foreground truncate">
            Library
          </span>
        </div>
        <button
          class="shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          title="Collapse sidebar"
          @click="emit('toggle-collapse')"
        >
          <BkIcon icon="chevron-left" class="w-4 h-4 text-muted-foreground" />
        </button>
      </template>

      <template v-else>
        <BkTooltip content="Library" side="right">
          <button
            class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            @click="emit('toggle-collapse')"
          >
            <BkIcon icon="library" class="w-5 h-5 text-primary" />
          </button>
        </BkTooltip>
      </template>
    </div>

    <!-- Module Types List -->
    <div class="flex-1 overflow-y-auto py-2" :class="collapsed ? 'px-3' : 'px-2'">
      <!-- All Modules Option -->
      <template v-if="!collapsed">
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group"
          :class="[
            isAllSelected
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent text-foreground'
          ]"
          @click="emit('select-type', null)"
        >
          <BkIcon
            icon="grid-2x2"
            class="w-4 h-4 shrink-0"
            :class="isAllSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
          />
          <span class="flex-1 text-sm font-medium truncate">All Modules</span>
          <span
            class="text-xs px-1.5 py-0.5 rounded-md"
            :class="isAllSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'"
          >
            {{ totalCount }}
          </span>
        </button>

        <div class="h-px bg-border my-2" />

        <!-- Module Types -->
        <div class="space-y-0.5">
          <button
            v-for="moduleType in moduleTypes"
            :key="moduleType.moduleId"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group"
            :class="[
              selectedType === moduleType.moduleId
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-foreground'
            ]"
            @click="emit('select-type', moduleType.moduleId)"
          >
            <BkIcon
              :icon="moduleType.icon"
              class="w-4 h-4 shrink-0"
              :class="selectedType === moduleType.moduleId ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
            />
            <span class="flex-1 text-sm font-medium truncate">{{ moduleType.displayName }}</span>
            <span
              class="text-xs px-1.5 py-0.5 rounded-md"
              :class="selectedType === moduleType.moduleId ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'"
            >
              {{ moduleType.count }}
            </span>
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-if="moduleTypes.length === 0"
          class="py-8 text-center"
        >
          <BkIcon icon="inbox" class="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">No modules yet</p>
          <p class="text-xs text-muted-foreground/70 mt-1">
            Add modules from the canvas
          </p>
        </div>
      </template>

      <!-- Collapsed View -->
      <template v-else>
        <BkTooltip content="All Modules" side="right">
          <button
            class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors mx-auto mb-1"
            :class="[
              isAllSelected
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-muted-foreground'
            ]"
            @click="emit('select-type', null)"
          >
            <BkIcon icon="grid-2x2" class="w-5 h-5" />
          </button>
        </BkTooltip>

        <div class="h-px bg-border my-2" />

        <div class="space-y-1">
          <BkTooltip
            v-for="moduleType in moduleTypes"
            :key="moduleType.moduleId"
            :content="`${moduleType.displayName} (${moduleType.count})`"
            side="right"
          >
            <button
              class="relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors mx-auto"
              :class="[
                selectedType === moduleType.moduleId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent text-muted-foreground'
              ]"
              @click="emit('select-type', moduleType.moduleId)"
            >
              <BkIcon :icon="moduleType.icon" class="w-5 h-5" />
              <!-- Badge -->
              <span
                class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center text-[10px] font-medium rounded-full px-1"
                :class="selectedType === moduleType.moduleId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ moduleType.count }}
              </span>
            </button>
          </BkTooltip>
        </div>
      </template>
    </div>
  </aside>
</template>
