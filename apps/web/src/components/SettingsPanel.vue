<script setup lang="ts">
import { computed } from 'vue'
import { useBoardStore } from '@boardkit/core'
import { useSettingsPanel } from '../composables/useSettingsPanel'
import { useWidgetSettings, type VisibilityMode } from '../composables/useWidgetSettings'
import {
  X,
  Settings,
  FileText,
  CheckSquare,
  Type,
  AlignLeft,
  Link,
  Sparkles,
  ListChecks,
  ArrowDownUp,
  GripVertical,
  BarChart3,
  EyeOff,
} from 'lucide-vue-next'

const boardStore = useBoardStore()
const { isOpen, widgetId, close } = useSettingsPanel()
const {
  visibility,
  textSettings,
  todoSettings,
  updateVisibility,
  updateTextSettings,
  updateTodoSettings,
} = useWidgetSettings()

// Get the widget from the composable's widgetId
const widget = computed(() => {
  if (!widgetId.value) return null
  return boardStore.widgets.find(w => w.id === widgetId.value) ?? null
})

const moduleType = computed(() => widget.value?.moduleId ?? null)

const moduleIcon = computed(() => {
  if (moduleType.value === 'text') return FileText
  if (moduleType.value === 'todo') return CheckSquare
  return Settings
})

const moduleLabel = computed(() => {
  if (moduleType.value === 'text') return 'Text Widget'
  if (moduleType.value === 'todo') return 'Todo Widget'
  return 'Widget'
})

// Options
const visibilityModes: { value: VisibilityMode; label: string }[] = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'subtle', label: 'Subtil' },
  { value: 'visible', label: 'Visible' },
]

const fontSizes = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
]

const lineHeights = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'spacious', label: 'Aéré' },
]

const progressOptions = [
  { value: 'none', label: 'Aucun' },
  { value: 'bar', label: 'Barre' },
  { value: 'counter', label: 'Compteur' },
]
</script>

<template>
  <!-- Overlay for click-outside-to-close -->
  <Transition
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-30"
      @click="close"
    />
  </Transition>

  <!-- Panel -->
  <Transition
    enter-active-class="transition-transform duration-200 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-150 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="isOpen && widget"
      class="fixed right-0 top-0 bottom-0 z-40 w-80 border-l border-border bg-background flex flex-col shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <div class="flex items-center gap-2">
          <Settings :size="16" class="text-muted-foreground" />
          <h2 class="text-sm font-semibold text-foreground">Settings</h2>
        </div>
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent"
          @click="close"
        >
          <X :size="14" class="text-muted-foreground" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        <!-- Widget Type Header -->
        <div class="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <component :is="moduleIcon" :size="16" class="text-muted-foreground" />
          </div>
          <span class="text-sm font-medium text-foreground">{{ moduleLabel }}</span>
        </div>

        <!-- Apparence Section -->
        <div class="space-y-3">
          <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Apparence
          </h3>

          <div class="rounded-lg border border-border bg-card divide-y divide-border">
            <!-- Rest Mode -->
            <div class="p-3">
              <div class="flex items-center justify-between">
                <label class="text-sm text-foreground">Au repos</label>
                <select
                  :value="visibility.restMode"
                  @change="updateVisibility({ restMode: ($event.target as HTMLSelectElement).value as VisibilityMode })"
                  class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option v-for="mode in visibilityModes" :key="mode.value" :value="mode.value">
                    {{ mode.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Hover Mode -->
            <div class="p-3">
              <div class="flex items-center justify-between">
                <label class="text-sm text-foreground">Au survol</label>
                <select
                  :value="visibility.hoverMode"
                  @change="updateVisibility({ hoverMode: ($event.target as HTMLSelectElement).value as VisibilityMode })"
                  class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option v-for="mode in visibilityModes" :key="mode.value" :value="mode.value">
                    {{ mode.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Text Module Settings -->
        <div v-if="moduleType === 'text'" class="space-y-3">
          <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Texte
          </h3>

          <div class="rounded-lg border border-border bg-card divide-y divide-border">
            <!-- Font Size -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Type :size="14" class="text-muted-foreground" />
                  <label class="text-sm text-foreground">Taille</label>
                </div>
              </div>
              <div class="flex gap-1.5">
                <button
                  v-for="size in fontSizes"
                  :key="size.value"
                  @click="updateTextSettings({ fontSize: size.value as any })"
                  class="flex-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors"
                  :class="textSettings.fontSize === size.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground hover:bg-accent'"
                >
                  {{ size.label }}
                </button>
              </div>
            </div>

            <!-- Line Height -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <AlignLeft :size="14" class="text-muted-foreground" />
                  <label class="text-sm text-foreground">Interligne</label>
                </div>
              </div>
              <div class="flex gap-1.5">
                <button
                  v-for="height in lineHeights"
                  :key="height.value"
                  @click="updateTextSettings({ lineHeight: height.value as any })"
                  class="flex-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors"
                  :class="textSettings.lineHeight === height.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground hover:bg-accent'"
                >
                  {{ height.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Text Toggles -->
          <div class="rounded-lg border border-border bg-card divide-y divide-border">
            <!-- Keyboard Shortcuts -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <span class="text-sm text-foreground">Raccourcis clavier</span>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="textSettings.enableShortcuts"
                  @change="updateTextSettings({ enableShortcuts: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <!-- Auto Links -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <div class="flex items-center gap-2">
                <Link :size="14" class="text-muted-foreground" />
                <span class="text-sm text-foreground">Liens automatiques</span>
              </div>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="textSettings.autoLinks"
                  @change="updateTextSettings({ autoLinks: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <!-- Smart Typography -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <div class="flex items-center gap-2">
                <Sparkles :size="14" class="text-muted-foreground" />
                <span class="text-sm text-foreground">Typographie intelligente</span>
              </div>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="textSettings.smartTypography"
                  @change="updateTextSettings({ smartTypography: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
        </div>

        <!-- Todo Module Settings -->
        <div v-if="moduleType === 'todo'" class="space-y-3">
          <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Affichage
          </h3>

          <div class="rounded-lg border border-border bg-card p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <BarChart3 :size="14" class="text-muted-foreground" />
                <label class="text-sm text-foreground">Progression</label>
              </div>
            </div>
            <div class="flex gap-1.5">
              <button
                v-for="option in progressOptions"
                :key="option.value"
                @click="updateTodoSettings({ showProgress: option.value as any })"
                class="flex-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors"
                :class="todoSettings.showProgress === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground hover:bg-accent'"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
            Comportement
          </h3>

          <div class="rounded-lg border border-border bg-card divide-y divide-border">
            <!-- Strike Completed -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <div class="flex items-center gap-2">
                <ListChecks :size="14" class="text-muted-foreground" />
                <span class="text-sm text-foreground">Barrer les terminées</span>
              </div>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="todoSettings.strikeCompleted"
                  @change="updateTodoSettings({ strikeCompleted: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <!-- Hide Completed -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <div class="flex items-center gap-2">
                <EyeOff :size="14" class="text-muted-foreground" />
                <span class="text-sm text-foreground">Masquer les terminées</span>
              </div>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="todoSettings.hideCompleted"
                  @change="updateTodoSettings({ hideCompleted: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <!-- Auto Sort -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <div class="flex items-center gap-2">
                <ArrowDownUp :size="14" class="text-muted-foreground" />
                <span class="text-sm text-foreground">Tri automatique</span>
              </div>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="todoSettings.autoSort"
                  @change="updateTodoSettings({ autoSort: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <!-- Enable Reorder -->
            <label class="flex items-center justify-between p-3 cursor-pointer">
              <div class="flex items-center gap-2">
                <GripVertical :size="14" class="text-muted-foreground" />
                <span class="text-sm text-foreground">Réordonner</span>
              </div>
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="todoSettings.enableReorder"
                  @change="updateTodoSettings({ enableReorder: ($event.target as HTMLInputElement).checked })"
                  class="peer sr-only"
                />
                <div class="h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer with technical info -->
      <div class="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        ID: {{ widget?.id.slice(0, 8) }} &bull; Type: {{ moduleType }}
      </div>
    </aside>
  </Transition>
</template>
