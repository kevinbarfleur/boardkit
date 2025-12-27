<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTheme } from "@boardkit/ui";
import { BkIcon } from "@boardkit/ui";
import { RouterLink } from "vue-router";

const { theme, toggleTheme, initTheme } = useTheme();

onMounted(() => {
  initTheme();
});

// State management
const isModalOpen = ref(false);
const isCommandOpen = ref(false);
const isDropdownOpen = ref(false);
const checkboxStates = ref({
  checkbox1: false,
  checkbox2: true,
  checkbox3: false,
});
const radioValue = ref("option1");
const inputValue = ref("");
const textareaValue = ref("");
const selectValue = ref("Select an option");
const tooltipVisible = ref<string | null>(null);
const activeTab = ref("tab1");
const showPassword = ref(false);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground p-8">
    <div class="max-w-7xl mx-auto space-y-12">
      <!-- Header -->
      <div class="border-b border-border pb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-4xl font-medium text-foreground mb-2">
              Boardkit Design System
            </h1>
            <p class="text-sm text-muted-foreground">
              Collection complète de tous les composants, variations et patterns
              - Tailwind CSS pur
            </p>
          </div>
          <div class="flex items-center gap-4">
            <RouterLink
              to="/"
              class="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <BkIcon icon="arrow-left" :size="16" />
              Back to Board
            </RouterLink>
            <button
              @click="toggleTheme"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
            >
              <BkIcon v-if="theme === 'dark'" icon="sun" :size="16" />
              <BkIcon v-else icon="moon" :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Boardkit App Components Section -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Boardkit App Components
          </h2>
          <p class="text-sm text-muted-foreground">
            Composants spécifiques à l'application Boardkit
          </p>
        </div>

        <!-- Command Palette -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Command Palette</h3>

          <!-- Trigger Button -->
          <button
            @click="isCommandOpen = true"
            class="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <BkIcon icon="search" :size="16" />
            <span>Rechercher des commandes...</span>
            <kbd
              class="ml-auto hidden h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] sm:inline-flex"
            >
              ⌘K
            </kbd>
          </button>

          <!-- Command Palette Dialog -->
          <div
            v-if="isCommandOpen"
            class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          >
            <!-- Backdrop -->
            <div
              class="fixed inset-0 bg-black/80 backdrop-blur-sm"
              @click="isCommandOpen = false"
            />

            <!-- Dialog -->
            <div
              class="relative z-50 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-muted shadow-lg"
            >
              <!-- Search Input -->
              <div
                class="flex h-12 items-center gap-2 border-b border-border px-3"
              >
                <BkIcon
                  icon="search"
                  :size="16"
                  class="shrink-0 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Rechercher des commandes..."
                  class="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  autofocus
                />
                <kbd
                  class="hidden h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground sm:inline-flex"
                >
                  esc
                </kbd>
              </div>

              <!-- Command List -->
              <div class="max-h-[300px] overflow-y-auto overflow-x-hidden">
                <!-- Commands Group -->
                <div class="overflow-hidden p-1 text-foreground">
                  <div
                    class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    Suggestions
                  </div>

                  <!-- Command Items -->
                  <div
                    role="option"
                    class="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <BkIcon
                      icon="file-text"
                      :size="16"
                      class="shrink-0 text-muted-foreground"
                    />
                    <div class="flex-1 min-w-0 truncate">Créer une note</div>
                    <kbd
                      class="ml-auto text-xs text-muted-foreground tracking-widest"
                      >⌘N</kbd
                    >
                  </div>

                  <div
                    role="option"
                    class="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors bg-accent text-accent-foreground"
                  >
                    <BkIcon
                      icon="check-square"
                      :size="16"
                      class="shrink-0 text-muted-foreground"
                    />
                    <div class="flex-1 min-w-0 truncate">
                      Créer une todo liste
                    </div>
                    <kbd
                      class="ml-auto text-xs text-muted-foreground tracking-widest"
                      >⌘T</kbd
                    >
                  </div>

                  <div
                    role="option"
                    class="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <BkIcon
                      icon="settings"
                      :size="16"
                      class="shrink-0 text-muted-foreground"
                    />
                    <div class="flex-1 min-w-0 truncate">Paramètres</div>
                    <kbd
                      class="ml-auto text-xs text-muted-foreground tracking-widest"
                      >⌘,</kbd
                    >
                  </div>
                </div>

                <!-- Second Commands Group -->
                <div class="overflow-hidden p-1 text-foreground">
                  <div
                    class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    Récents
                  </div>

                  <div
                    role="option"
                    class="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <BkIcon
                      icon="user"
                      :size="16"
                      class="shrink-0 text-muted-foreground"
                    />
                    <div class="flex-1 min-w-0 truncate">Mon profil</div>
                  </div>

                  <div
                    role="option"
                    class="relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors opacity-50 pointer-events-none"
                  >
                    <BkIcon
                      icon="mail"
                      :size="16"
                      class="shrink-0 text-muted-foreground"
                    />
                    <div class="flex-1 min-w-0 truncate">
                      Envoyer un message (Indisponible)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2 text-sm text-muted-foreground">
            <p>Classes utilisées:</p>
            <div class="space-y-1">
              <p>
                <strong>Dialog:</strong>
                <code class="text-xs bg-muted px-2 py-1 rounded ml-2">
                  fixed inset-0 z-50 pt-[15vh] bg-black/80 backdrop-blur-sm
                </code>
              </p>
              <p>
                <strong>Content:</strong>
                <code class="text-xs bg-muted px-2 py-1 rounded ml-2">
                  w-full max-w-lg rounded-lg border border-border bg-muted
                  shadow-lg
                </code>
              </p>
              <p>
                <strong>Search Input:</strong>
                <code class="text-xs bg-muted px-2 py-1 rounded ml-2"
                  >h-12 gap-2 border-b border-border px-3</code
                >
              </p>
              <p>
                <strong>Command Item:</strong>
                <code class="text-xs bg-muted px-2 py-1 rounded ml-2">
                  gap-2 rounded-md px-2 py-1.5 hover:bg-accent
                </code>
              </p>
              <p>
                <strong>Selected Item:</strong>
                <code class="text-xs bg-muted px-2 py-1 rounded ml-2"
                  >bg-accent text-accent-foreground</code
                >
              </p>
              <p>
                <strong>Disabled Item:</strong>
                <code class="text-xs bg-muted px-2 py-1 rounded ml-2"
                  >opacity-50 pointer-events-none</code
                >
              </p>
            </div>
          </div>
        </div>

        <!-- Topbar -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Topbar</h3>
          <div class="rounded-lg border border-border overflow-hidden">
            <header
              class="flex h-14 items-center justify-between border-b bg-card px-4"
            >
              <!-- Left section -->
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-md bg-primary"
                  >
                    <BkIcon
                      icon="layout-grid"
                      :size="16"
                      class="text-primary-foreground"
                    />
                  </div>
                  <span class="font-semibold text-card-foreground"
                    >Untitled Board</span
                  >
                </div>
              </div>

              <!-- Center section -->
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span class="text-lg leading-none">+</span>
                  <span>Add Widget</span>
                </button>
              </div>

              <!-- Right section -->
              <div class="flex items-center gap-2">
                <button
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
                >
                  <BkIcon icon="undo-2" :size="16" />
                </button>
                <button
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
                >
                  <BkIcon icon="redo-2" :size="16" />
                </button>
                <div class="mx-2 h-5 w-px bg-border" />
                <button
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
                >
                  <BkIcon icon="sun" :size="16" />
                </button>
              </div>
            </header>
          </div>
          <div class="text-sm text-muted-foreground">
            <p>Classes utilisées:</p>
            <code class="text-xs bg-muted px-2 py-1 rounded">
              h-14 items-center justify-between border-b bg-card px-4
              gap-2/gap-3
            </code>
          </div>
        </div>

        <!-- Widget Card -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Widget Card</h3>
          <div class="flex gap-4 flex-wrap">
            <!-- Text Widget -->
            <div class="w-80 rounded-lg border border-border bg-card shadow-lg">
              <div
                class="flex items-center gap-2 border-b px-3 py-2 cursor-move bg-muted/30"
              >
                <BkIcon
                  icon="grip-vertical"
                  :size="16"
                  class="text-muted-foreground"
                />
                <span class="flex-1 text-sm font-medium text-card-foreground"
                  >Text Note</span
                >
                <button
                  class="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-accent"
                >
                  <BkIcon icon="x" :size="12" />
                </button>
              </div>
              <div class="p-3">
                <textarea
                  placeholder="Start typing..."
                  :rows="4"
                  class="w-full resize-none border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>
            </div>

            <!-- Todo Widget -->
            <div class="w-80 rounded-lg border border-border bg-card shadow-lg">
              <div
                class="flex items-center gap-2 border-b px-3 py-2 cursor-move bg-muted/30"
              >
                <BkIcon
                  icon="grip-vertical"
                  :size="16"
                  class="text-muted-foreground"
                />
                <span class="flex-1 text-sm font-medium text-card-foreground"
                  >To-Do List</span
                >
                <button
                  class="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-accent"
                >
                  <BkIcon icon="x" :size="12" />
                </button>
              </div>
              <div class="p-3 space-y-2">
                <div class="flex items-center gap-2">
                  <div class="relative">
                    <input
                      type="checkbox"
                      class="h-4 w-4 shrink-0 rounded border border-border bg-background transition-colors checked:bg-primary checked:border-primary appearance-none cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Task 1"
                    class="h-7 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:outline-none"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <div class="relative">
                    <input
                      type="checkbox"
                      checked
                      readonly
                      class="h-4 w-4 shrink-0 rounded border border-border bg-primary transition-colors appearance-none cursor-pointer"
                    />
                    <BkIcon
                      icon="check"
                      :size="16"
                      class="absolute left-0 top-0 h-4 w-4 text-primary-foreground pointer-events-none"
                    />
                  </div>
                  <input
                    type="text"
                    value="Completed task"
                    readonly
                    class="h-7 flex-1 border-0 bg-transparent px-0 text-sm line-through opacity-50"
                  />
                </div>
                <button
                  class="h-7 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Add task
                </button>
              </div>
            </div>

            <!-- Selected Widget -->
            <div
              class="w-80 rounded-lg border-2 border-primary bg-card shadow-lg"
            >
              <div
                class="flex items-center gap-2 border-b px-3 py-2 cursor-move bg-muted/30"
              >
                <BkIcon
                  icon="grip-vertical"
                  :size="16"
                  class="text-muted-foreground"
                />
                <span class="flex-1 text-sm font-medium text-card-foreground"
                  >Selected Widget</span
                >
                <button
                  class="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-accent"
                >
                  <BkIcon icon="x" :size="12" />
                </button>
              </div>
              <div class="p-3">
                <p class="text-sm text-muted-foreground">
                  Widget sélectionné avec border-2 border-primary
                </p>
              </div>
            </div>
          </div>
          <div class="text-sm text-muted-foreground">
            <p>Classes utilisées:</p>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
              w-80 rounded-lg border border-border bg-card shadow-lg
            </code>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
              Header: px-3 py-2 cursor-move bg-muted/30
            </code>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1"
              >Selected: border-2 border-primary</code
            >
          </div>
        </div>

        <!-- Add Widget Dialog -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Add Widget Dialog</h3>
          <div class="max-w-md rounded-lg border border-border bg-card p-6">
            <div class="space-y-2 mb-6">
              <h3 class="text-lg font-semibold text-card-foreground">
                Add Widget
              </h3>
              <p class="text-sm text-muted-foreground">
                Choose a widget type to add to your board
              </p>
            </div>

            <div class="grid gap-3">
              <button
                class="flex flex-col items-center gap-2 rounded-lg border border-border bg-transparent p-6 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <BkIcon icon="file-text" :size="32" />
                <div class="text-center">
                  <div class="font-semibold">Text Note</div>
                  <div class="text-xs text-muted-foreground">
                    Add a text note to capture your thoughts
                  </div>
                </div>
              </button>

              <button
                class="flex flex-col items-center gap-2 rounded-lg border border-border bg-transparent p-6 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <BkIcon icon="check-square" :size="32" />
                <div class="text-center">
                  <div class="font-semibold">To-Do List</div>
                  <div class="text-xs text-muted-foreground">
                    Create a list of tasks to track progress
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div class="text-sm text-muted-foreground">
            <p>Classes utilisées:</p>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
              Dialog: max-w-md rounded-lg border bg-card p-6
            </code>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
              Option buttons: flex-col items-center gap-2 p-6 hover:bg-accent
            </code>
          </div>
        </div>

        <!-- Canvas Grid Pattern -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">
            Canvas Grid Pattern
          </h3>
          <div
            class="h-64 w-full rounded-lg border border-border overflow-hidden"
            style="
              background: radial-gradient(
                circle,
                rgba(255, 255, 255, 0.1) 1px,
                transparent 1px
              );
              background-size: 20px 20px;
            "
          >
            <div class="flex items-center justify-center h-full">
              <p
                class="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-lg"
              >
                Pattern de grille infini
              </p>
            </div>
          </div>
          <div class="text-sm text-muted-foreground">
            <p>Style CSS utilisé:</p>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
              background: radial-gradient(circle, rgba(255,255,255,0.1) 1px,
              transparent 1px)
            </code>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-1"
              >backgroundSize: 20px 20px</code
            >
          </div>
        </div>

        <!-- Zoom Indicator -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Zoom Indicator</h3>
          <div
            class="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-1.5 text-sm"
          >
            100%
          </div>
          <div class="text-sm text-muted-foreground">
            <p>Classes utilisées:</p>
            <code class="text-xs bg-muted px-2 py-1 rounded"
              >rounded-lg border bg-muted px-3 py-1.5 text-sm</code
            >
          </div>
        </div>
      </section>

      <!-- Buttons Section -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Buttons</h2>
          <p class="text-sm text-muted-foreground">
            Toutes les variantes de boutons disponibles
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">rounded-lg</code> -
                Border radius 8px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">px-4 py-2</code> -
                Padding horizontal 16px, vertical 8px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >text-sm font-medium</code
                >
                - Text 14px, poids 500
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">gap-2</code> -
                Espacement 8px entre icône et texte
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >transition-colors</code
                >
                - Transition 150ms sur les couleurs
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">
                  focus-visible:ring-2 focus-visible:ring-offset-2
                </code>
                - Anneau de focus 2px avec offset
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🎨 Variantes de couleurs:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Default:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  bg-primary text-primary-foreground hover:bg-primary/90
                </code>
              </li>
              <li>
                <strong>Secondary:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  bg-secondary text-secondary-foreground hover:bg-secondary/80
                </code>
              </li>
              <li>
                <strong>Outline:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  border border-border bg-background hover:bg-accent
                </code>
              </li>
              <li>
                <strong>Ghost:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >bg-transparent hover:bg-accent</code
                >
              </li>
              <li>
                <strong>Destructive:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  bg-destructive text-destructive-foreground
                  hover:bg-destructive/90
                </code>
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🔘 Boutons icônes circulaires:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >h-9 w-9 rounded-full</code
                >
                - Taille 36px × 36px, complètement rond
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">h-4 w-4</code> -
                Icône 16px × 16px à l'intérieur
              </li>
            </ul>
          </div>
        </div>

        <div class="flex flex-wrap gap-4">
          <!-- Default Button -->
          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Default
          </button>

          <!-- Secondary Button -->
          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Secondary
          </button>

          <!-- Outline Button -->
          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Outline
          </button>

          <!-- Ghost Button -->
          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Ghost
          </button>

          <!-- Destructive Button -->
          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Destructive
          </button>

          <!-- Disabled Button -->
          <button
            disabled
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Disabled
          </button>
        </div>

        <!-- Icon Buttons -->
        <div class="flex flex-wrap gap-4 items-center">
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <BkIcon icon="plus" :size="16" />
          </button>

          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <BkIcon icon="search" :size="16" />
          </button>

          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <BkIcon icon="settings" :size="16" />
          </button>
        </div>

        <!-- Buttons with Icons -->
        <div class="flex flex-wrap gap-4">
          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BkIcon icon="plus" :size="16" />
            Add Widget
          </button>

          <button
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BkIcon icon="mail" :size="16" />
            Send Email
          </button>
        </div>
      </section>

      <!-- Inputs Section -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Inputs</h2>
          <p class="text-sm text-muted-foreground">
            Champs de saisie et zones de texte
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >h-10 w-full rounded-lg</code
                >
                - Hauteur 40px, pleine largeur, coins arrondis 8px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">px-3 py-2</code> -
                Padding horizontal 12px, vertical 8px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">text-sm</code> -
                Texte 14px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >border border-border bg-background</code
                >
                - Bordure 1px gris sombre sur fond noir
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >focus-visible:ring-2 focus-visible:ring-ring</code
                >
                - Anneau bleu 2px au focus
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >placeholder:text-muted-foreground</code
                >
                - Placeholder en gris moyen
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🔍 Input avec icône:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">relative</code> -
                Container en position relative
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >absolute left-3 top-1/2 -translate-y-1/2</code
                >
                - Icône positionnée à gauche, centrée verticalement
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">pl-9</code> -
                Padding left 36px pour laisser place à l'icône
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >h-4 w-4 text-muted-foreground</code
                >
                - Icône 16px en gris moyen
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              📝 Textarea:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">resize-none</code>
                - Empêche le redimensionnement manuel
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">rows={4}</code> - 4
                lignes par défaut
              </li>
            </ul>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Basic Input -->
          <div class="space-y-2">
            <label
              for="basic-input"
              class="text-sm font-medium text-foreground"
            >
              Basic Input
            </label>
            <input
              id="basic-input"
              v-model="inputValue"
              type="text"
              placeholder="Enter text..."
              class="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <!-- Input with Icon -->
          <div class="space-y-2">
            <label for="icon-input" class="text-sm font-medium text-foreground">
              Input with Icon
            </label>
            <div class="relative">
              <BkIcon
                icon="search"
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="icon-input"
                type="text"
                placeholder="Search..."
                class="flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Email Input -->
          <div class="space-y-2">
            <label
              for="email-input"
              class="text-sm font-medium text-foreground"
            >
              Email Input
            </label>
            <div class="relative">
              <BkIcon
                icon="mail"
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="email-input"
                type="email"
                placeholder="email@example.com"
                class="flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <label
              for="password-input"
              class="text-sm font-medium text-foreground"
            >
              Password Input
            </label>
            <div class="relative">
              <BkIcon
                icon="lock"
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="password-input"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Disabled Input -->
          <div class="space-y-2">
            <label
              for="disabled-input"
              class="text-sm font-medium text-foreground"
            >
              Disabled Input
            </label>
            <input
              id="disabled-input"
              type="text"
              placeholder="Disabled"
              disabled
              class="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <!-- Textarea -->
          <div class="space-y-2">
            <label for="textarea" class="text-sm font-medium text-foreground">
              Textarea
            </label>
            <textarea
              id="textarea"
              v-model="textareaValue"
              placeholder="Enter longer text..."
              :rows="4"
              class="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>
      </section>

      <!-- Checkboxes & Radio Buttons -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Checkboxes & Radio Buttons
          </h2>
          <p class="text-sm text-muted-foreground">
            Cases à cocher et boutons radio
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">h-4 w-4</code> -
                Taille 16px × 16px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">gap-2</code> -
                Espacement 8px entre input et label
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >appearance-none</code
                >
                - Supprime le style natif du navigateur
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >cursor-pointer</code
                >
                - Curseur pointeur au survol
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              ☑️ Checkbox:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">rounded</code> -
                Coins légèrement arrondis (4px)
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >checked:bg-primary checked:border-primary</code
                >
                - Fond et bordure bleus quand coché
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >absolute left-0 top-0</code
                >
                - Icône Check positionnée par dessus
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >pointer-events-none</code
                >
                - Icône non cliquable
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🔘 Radio Button:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">rounded-full</code>
                - Complètement circulaire
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">
                  absolute left-1 top-1 h-2 w-2 rounded-full bg-primary
                </code>
                - Dot interne 8px quand sélectionné
              </li>
            </ul>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Checkboxes -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-foreground">Checkboxes</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  v-model="checkboxStates.checkbox1"
                  type="checkbox"
                  class="peer h-4 w-4 shrink-0 rounded border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary appearance-none cursor-pointer"
                />
                <BkIcon
                  v-if="checkboxStates.checkbox1"
                  icon="check"
                  :size="16"
                  class="absolute left-0 top-0 h-4 w-4 text-primary-foreground pointer-events-none"
                />
              </div>
              <span class="text-sm text-foreground"
                >Accept terms and conditions</span
              >
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  v-model="checkboxStates.checkbox2"
                  type="checkbox"
                  class="peer h-4 w-4 shrink-0 rounded border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary appearance-none cursor-pointer"
                />
                <BkIcon
                  v-if="checkboxStates.checkbox2"
                  icon="check"
                  :size="16"
                  class="absolute left-0 top-0 h-4 w-4 text-primary-foreground pointer-events-none"
                />
              </div>
              <span class="text-sm text-foreground"
                >Subscribe to newsletter</span
              >
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  v-model="checkboxStates.checkbox3"
                  type="checkbox"
                  class="peer h-4 w-4 shrink-0 rounded border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary appearance-none cursor-pointer"
                />
                <BkIcon
                  v-if="checkboxStates.checkbox3"
                  icon="check"
                  :size="16"
                  class="absolute left-0 top-0 h-4 w-4 text-primary-foreground pointer-events-none"
                />
              </div>
              <span class="text-sm text-foreground">Enable notifications</span>
            </label>

            <label
              class="flex items-center gap-2 cursor-not-allowed opacity-50"
            >
              <div class="relative">
                <input
                  type="checkbox"
                  disabled
                  class="peer h-4 w-4 shrink-0 rounded border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                />
              </div>
              <span class="text-sm text-foreground">Disabled checkbox</span>
            </label>
          </div>

          <!-- Radio Buttons -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-foreground">Radio Buttons</h3>

            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  v-model="radioValue"
                  type="radio"
                  name="radio-group"
                  value="option1"
                  class="peer h-4 w-4 shrink-0 rounded-full border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                />
                <div
                  v-if="radioValue === 'option1'"
                  class="absolute left-1 top-1 h-2 w-2 rounded-full bg-primary pointer-events-none"
                />
              </div>
              <span class="text-sm text-foreground">Option 1</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  v-model="radioValue"
                  type="radio"
                  name="radio-group"
                  value="option2"
                  class="peer h-4 w-4 shrink-0 rounded-full border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                />
                <div
                  v-if="radioValue === 'option2'"
                  class="absolute left-1 top-1 h-2 w-2 rounded-full bg-primary pointer-events-none"
                />
              </div>
              <span class="text-sm text-foreground">Option 2</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  v-model="radioValue"
                  type="radio"
                  name="radio-group"
                  value="option3"
                  class="peer h-4 w-4 shrink-0 rounded-full border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                />
                <div
                  v-if="radioValue === 'option3'"
                  class="absolute left-1 top-1 h-2 w-2 rounded-full bg-primary pointer-events-none"
                />
              </div>
              <span class="text-sm text-foreground">Option 3</span>
            </label>

            <label
              class="flex items-center gap-2 cursor-not-allowed opacity-50"
            >
              <div class="relative">
                <input
                  type="radio"
                  disabled
                  class="peer h-4 w-4 shrink-0 rounded-full border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                />
              </div>
              <span class="text-sm text-foreground">Disabled radio</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Select/Dropdown -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Select & Dropdown
          </h2>
          <p class="text-sm text-muted-foreground">
            Menus déroulants personnalisés
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Custom Select Styles:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Trigger:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >h-10 w-full justify-between px-3 py-2</code
                >
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >ChevronDown h-4 w-4 text-muted-foreground</code
                >
                - Icône chevron 16px
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              📋 Dropdown Menu:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >absolute z-50 mt-2 w-full</code
                >
                - Positionné sous le trigger avec z-index élevé
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >rounded-lg border bg-popover p-1 shadow-lg</code
                >
                - Container avec ombre
              </li>
              <li>
                <strong>Item:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >rounded-md px-2 py-1.5 text-sm hover:bg-accent</code
                >
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >my-1 h-px bg-border</code
                >
                - Séparateur horizontal 1px
              </li>
            </ul>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Custom Select -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Custom Select</label
            >
            <div class="relative">
              <button
                @click="isDropdownOpen = !isDropdownOpen"
                class="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{{ selectValue }}</span>
                <BkIcon
                  icon="chevron-down"
                  :size="16"
                  class="text-muted-foreground"
                />
              </button>

              <div
                v-if="isDropdownOpen"
                class="absolute z-50 mt-2 w-full rounded-lg border border-border bg-popover p-1 shadow-lg"
              >
                <button
                  @click="
                    selectValue = 'Option 1';
                    isDropdownOpen = false;
                  "
                  class="relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent"
                >
                  Option 1
                </button>
                <button
                  @click="
                    selectValue = 'Option 2';
                    isDropdownOpen = false;
                  "
                  class="relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent"
                >
                  Option 2
                </button>
                <button
                  @click="
                    selectValue = 'Option 3';
                    isDropdownOpen = false;
                  "
                  class="relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent"
                >
                  Option 3
                </button>
                <div class="my-1 h-px bg-border" />
                <button
                  @click="
                    selectValue = 'Disabled Option';
                    isDropdownOpen = false;
                  "
                  disabled
                  class="relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Disabled Option
                </button>
              </div>
            </div>
          </div>

          <!-- Native Select -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Native Select</label
            >
            <select
              class="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
            >
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Cards -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Cards</h2>
          <p class="text-sm text-muted-foreground">
            Conteneurs pour regrouper du contenu
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >rounded-lg border border-border bg-card</code
                >
                - Container avec bordure et fond
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">p-6</code> -
                Padding uniforme 24px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">shadow-sm</code> -
                Ombre légère (optionnelle)
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🎴 Card avec Header/Footer:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Header:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >p-6 pb-4</code
                >
                - Padding bottom réduit
              </li>
              <li>
                <strong>Content:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >p-6 pt-0 pb-4</code
                >
                - Pas de padding top
              </li>
              <li>
                <strong>Footer:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >p-6 pt-0 gap-2</code
                >
                - Espacement entre boutons
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              ✨ Interactive Card:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >hover:bg-accent cursor-pointer</code
                >
                - Change de fond au survol
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >transition-colors</code
                >
                - Animation fluide 150ms
              </li>
            </ul>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <!-- Simple Card -->
          <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 class="text-lg font-medium text-card-foreground mb-2">
              Simple Card
            </h3>
            <p class="text-sm text-muted-foreground">
              This is a simple card with basic styling and content.
            </p>
          </div>

          <!-- Card with Header & Footer -->
          <div class="rounded-lg border border-border bg-card shadow-sm">
            <div class="p-6 pb-4">
              <h3 class="text-lg font-medium text-card-foreground">
                Card Header
              </h3>
              <p class="text-sm text-muted-foreground">
                Card subtitle or description
              </p>
            </div>
            <div class="p-6 pt-0 pb-4">
              <p class="text-sm text-card-foreground">
                Main content area with more detailed information goes here.
              </p>
            </div>
            <div class="flex items-center p-6 pt-0 gap-2">
              <button
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Action
              </button>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Interactive Card -->
          <div
            class="rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:bg-accent cursor-pointer"
          >
            <BkIcon icon="user" :size="48" class="mb-4 text-primary" />
            <h3 class="text-lg font-medium text-card-foreground mb-2">
              Interactive Card
            </h3>
            <p class="text-sm text-muted-foreground">
              Hover over this card to see the effect.
            </p>
          </div>
        </div>
      </section>

      <!-- Badges & Pills -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Badges & Pills</h2>
          <p class="text-sm text-muted-foreground">
            Petits indicateurs de statut
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >rounded-full px-3 py-1 text-xs font-medium</code
                >
                - Forme pill complète
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >inline-flex items-center</code
                >
                - Alignement centré vertical
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">gap-1</code> -
                Espacement 4px avec icônes
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🎨 Variantes:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Primary:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >bg-primary text-primary-foreground</code
                >
              </li>
              <li>
                <strong>Outline:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >border border-border bg-background</code
                >
              </li>
              <li>
                <strong>With Icon:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">h-3 w-3</code>
                - Icône 12px
              </li>
            </ul>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 items-center">
          <span
            class="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            Primary
          </span>
          <span
            class="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
          >
            Secondary
          </span>
          <span
            class="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
          >
            Outline
          </span>
          <span
            class="inline-flex items-center rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground"
          >
            Destructive
          </span>
          <span
            class="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            <BkIcon icon="star" :size="12" />
            With Icon
          </span>
          <span
            class="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            Dismissible
            <button class="ml-1 hover:bg-background/20 rounded-full p-0.5">
              <BkIcon icon="x" :size="12" />
            </button>
          </span>
        </div>
      </section>

      <!-- Tooltips -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Tooltips</h2>
          <p class="text-sm text-muted-foreground">Infobulles au survol</p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >px-3 py-1.5 text-xs rounded-md</code
                >
                - Container compact
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >bg-primary text-primary-foreground</code
                >
                - Fond bleu, texte blanc
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >whitespace-nowrap</code
                >
                - Empêche le retour à la ligne
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              📍 Positionnement:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Top:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >bottom-full left-1/2 -translate-x-1/2 mb-2</code
                >
              </li>
              <li>
                <strong>Bottom:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >top-full left-1/2 -translate-x-1/2 mt-2</code
                >
              </li>
              <li>
                <strong>Left:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >right-full top-1/2 -translate-y-1/2 mr-2</code
                >
              </li>
              <li>
                <strong>Right:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >left-full top-1/2 -translate-y-1/2 ml-2</code
                >
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              ▲ Flèche (Arrow):
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >border-4 border-transparent border-t-primary</code
                >
                - Triangle CSS
              </li>
            </ul>
          </div>
        </div>

        <div class="flex flex-wrap gap-8 items-center">
          <!-- Tooltip Top -->
          <div class="relative inline-block">
            <button
              @mouseenter="tooltipVisible = 'top'"
              @mouseleave="tooltipVisible = null"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Hover me (Top)
            </button>
            <div
              v-if="tooltipVisible === 'top'"
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-md whitespace-nowrap"
            >
              Tooltip content
              <div
                class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary"
              />
            </div>
          </div>

          <!-- Tooltip Bottom -->
          <div class="relative inline-block">
            <button
              @mouseenter="tooltipVisible = 'bottom'"
              @mouseleave="tooltipVisible = null"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Hover me (Bottom)
            </button>
            <div
              v-if="tooltipVisible === 'bottom'"
              class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-md whitespace-nowrap"
            >
              Tooltip content
              <div
                class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-primary"
              />
            </div>
          </div>

          <!-- Tooltip Left -->
          <div class="relative inline-block">
            <button
              @mouseenter="tooltipVisible = 'left'"
              @mouseleave="tooltipVisible = null"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Hover me (Left)
            </button>
            <div
              v-if="tooltipVisible === 'left'"
              class="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-md whitespace-nowrap"
            >
              Tooltip content
              <div
                class="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-primary"
              />
            </div>
          </div>

          <!-- Tooltip Right -->
          <div class="relative inline-block">
            <button
              @mouseenter="tooltipVisible = 'right'"
              @mouseleave="tooltipVisible = null"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Hover me (Right)
            </button>
            <div
              v-if="tooltipVisible === 'right'"
              class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-md whitespace-nowrap"
            >
              Tooltip content
              <div
                class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-primary"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Modal/Dialog -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Modal / Dialog</h2>
          <p class="text-sm text-muted-foreground">Fenêtre modale superposée</p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Overlay:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  fixed inset-0 z-50 bg-black/80 backdrop-blur-sm
                </code>
              </li>
              <li>
                <strong>Modal:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                </code>
                - Centré à l'écran
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >w-full max-w-lg</code
                >
                - Largeur max 512px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >rounded-lg border bg-background p-6 shadow-lg</code
                >
                - Container avec ombre
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🔝 Header:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >flex items-center justify-between mb-4</code
                >
                - Titre et bouton fermer alignés
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >text-lg font-medium</code
                >
                - Titre 18px poids 500
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              👇 Footer:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >flex justify-end gap-2</code
                >
                - Boutons alignés à droite avec espacement
              </li>
            </ul>
          </div>
        </div>

        <button
          @click="isModalOpen = true"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open Modal
        </button>

        <div v-if="isModalOpen">
          <!-- Overlay -->
          <div
            class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            @click="isModalOpen = false"
          />

          <!-- Modal -->
          <div
            class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-foreground">Modal Title</h3>
              <button
                @click="isModalOpen = false"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BkIcon icon="x" :size="16" />
              </button>
            </div>

            <p class="text-sm text-muted-foreground mb-6">
              This is a modal dialog. You can put any content here including
              forms, images, or other components.
            </p>

            <div class="space-y-4 mb-6">
              <div class="space-y-2">
                <label
                  for="modal-input"
                  class="text-sm font-medium text-foreground"
                >
                  Example Input
                </label>
                <input
                  id="modal-input"
                  type="text"
                  placeholder="Enter something..."
                  class="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button
                @click="isModalOpen = false"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
              <button
                @click="isModalOpen = false"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Dividers -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Dividers</h2>
          <p class="text-sm text-muted-foreground">
            Séparateurs horizontaux et verticaux
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">📐 Styles:</p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Horizontal:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >h-px bg-border</code
                >
                - Ligne 1px de hauteur
              </li>
              <li>
                <strong>Vertical:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >w-px h-8 bg-border</code
                >
                - Ligne 1px de largeur, 32px de hauteur
              </li>
              <li>
                Couleur:
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >bg-border</code
                >
                (#262626)
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-foreground">Content above divider</p>
          <div class="h-px bg-border" />
          <p class="text-sm text-foreground">Content below divider</p>

          <div class="flex items-center gap-4 my-4">
            <p class="text-sm text-foreground">Left content</p>
            <div class="w-px h-8 bg-border" />
            <p class="text-sm text-foreground">Right content</p>
          </div>
        </div>
      </section>

      <!-- Progress & Loading -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Progress & Loading
          </h2>
          <p class="text-sm text-muted-foreground">
            Indicateurs de progression
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📊 Progress Bar:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Container:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2">
                  h-2 w-full rounded-full bg-secondary overflow-hidden
                </code>
              </li>
              <li>
                <strong>Fill:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >h-full bg-primary transition-all</code
                >
                - Largeur dynamique
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              ⭕ Spinner:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >h-8 w-8 animate-spin rounded-full</code
                >
                - Taille 32px, rotation infinie
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >border-4 border-primary border-r-transparent</code
                >
                - Bordure avec gap transparent
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              💀 Skeleton:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >h-4 animate-pulse rounded bg-muted</code
                >
                - Animation pulse subtile
              </li>
              <li>
                Variantes de largeur:
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >w-full, w-3/4, w-1/2</code
                >
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Progress Bar -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Progress Bar (60%)</label
            >
            <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div class="h-full w-[60%] bg-primary transition-all" />
            </div>
          </div>

          <!-- Spinner -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Spinner</label>
            <div
              class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
            />
          </div>

          <!-- Skeleton Loaders -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Skeleton Loaders</label
            >
            <div class="space-y-2">
              <div class="h-4 w-full animate-pulse rounded bg-muted" />
              <div class="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </section>

      <!-- Alerts -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Alerts</h2>
          <p class="text-sm text-muted-foreground">
            Messages d'alerte et notifications
          </p>
          <div class="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p class="text-xs font-medium text-foreground mb-2">
              📐 Styles & Spacings:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded"
                  >rounded-lg border bg-background p-4</code
                >
                - Container standard
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">flex gap-3</code> -
                Icône et contenu avec espacement 12px
              </li>
              <li>
                <code class="bg-muted px-1.5 py-0.5 rounded">h-5 w-5</code> -
                Icône 20px × 20px
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              🎨 Variantes:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Info:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >border-border bg-background</code
                >
              </li>
              <li>
                <strong>Success:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >border-border bg-background</code
                >
                avec icône Check primary
              </li>
              <li>
                <strong>Error:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >border-destructive bg-destructive/10</code
                >
              </li>
            </ul>
            <p class="text-xs font-medium text-foreground mt-3 mb-2">
              📝 Contenu:
            </p>
            <ul class="space-y-1 text-xs text-muted-foreground">
              <li>
                <strong>Titre:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >text-sm font-medium mb-1</code
                >
              </li>
              <li>
                <strong>Description:</strong>
                <code class="bg-muted px-1.5 py-0.5 rounded ml-2"
                  >text-sm text-muted-foreground</code
                >
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Info Alert -->
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="flex gap-3">
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10"
              >
                <div class="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div class="flex-1">
                <h5 class="text-sm font-medium text-foreground mb-1">
                  Info Alert
                </h5>
                <p class="text-sm text-muted-foreground">
                  This is an informational message with additional context.
                </p>
              </div>
            </div>
          </div>

          <!-- Success Alert -->
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="flex gap-3">
              <BkIcon icon="check" :size="20" class="text-primary" />
              <div class="flex-1">
                <h5 class="text-sm font-medium text-foreground mb-1">
                  Success Alert
                </h5>
                <p class="text-sm text-muted-foreground">
                  Your action was completed successfully.
                </p>
              </div>
            </div>
          </div>

          <!-- Destructive Alert -->
          <div
            class="rounded-lg border border-destructive bg-destructive/10 p-4"
          >
            <div class="flex gap-3">
              <BkIcon icon="x" :size="20" class="text-destructive" />
              <div class="flex-1">
                <h5 class="text-sm font-medium text-destructive mb-1">
                  Error Alert
                </h5>
                <p class="text-sm text-destructive/90">
                  Something went wrong. Please try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- NEW: Button Variations Advanced -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Button Variations Advanced
          </h2>
          <p class="text-sm text-muted-foreground">
            <strong>Mood:</strong> Versatile et accessible - Des boutons pour
            chaque action et contexte
          </p>
        </div>

        <!-- Size Variations -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Sizes</h3>
          <div class="flex flex-wrap gap-4 items-end">
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Small
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Default
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Large
            </button>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Small: px-3 py-1.5 text-xs | Default: px-4 py-2 text-sm | Large:
            px-6 py-3 text-base
          </code>
        </div>

        <!-- Loading States -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Loading States</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Patience rewarded - Visual feedback
            pendant les opérations async
          </p>
          <div class="flex flex-wrap gap-4">
            <button
              disabled
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors disabled:opacity-50"
            >
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary-foreground border-r-transparent"
              />
              Loading...
            </button>
            <button
              disabled
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
            >
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-foreground border-r-transparent"
              />
              Processing
            </button>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Spinner: h-4 w-4 animate-spin rounded-full border-2
            border-r-transparent
          </code>
        </div>

        <!-- Icon Positions -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Icon Positions</h3>
          <div class="flex flex-wrap gap-4">
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <BkIcon icon="download" :size="16" />
              Left Icon
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Right Icon
              <BkIcon icon="upload" :size="16" />
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <BkIcon icon="heart" :size="16" />
              Both Icons
              <BkIcon icon="star" :size="16" />
            </button>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Icônes: h-4 w-4, gap-2 entre texte et icône
          </code>
        </div>

        <!-- Button Groups -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Button Groups</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Actions connectées - Groupes d'actions
            liées visuellement
          </p>
          <div
            class="inline-flex rounded-lg border border-border overflow-hidden"
          >
            <button
              class="px-4 py-2 text-sm font-medium text-foreground bg-accent transition-colors hover:bg-accent/80 border-r border-border"
            >
              Left
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-foreground bg-background transition-colors hover:bg-accent border-r border-border"
            >
              Center
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-foreground bg-background transition-colors hover:bg-accent"
            >
              Right
            </button>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Container: inline-flex rounded-lg border overflow-hidden | Items:
            border-r entre les boutons
          </code>
        </div>
      </section>

      <!-- NEW: Advanced Inputs -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Advanced Inputs</h2>
          <p class="text-sm text-muted-foreground">
            <strong>Mood:</strong> Précision et clarté - Saisie de données
            optimisée pour chaque contexte
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Input with Prefix -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Input with Prefix</label
            >
            <div
              class="flex h-10 w-full rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring"
            >
              <span
                class="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-border"
              >
                https://
              </span>
              <input
                type="text"
                placeholder="example.com"
                class="flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block">
              Prefix: px-3 bg-muted border-r | focus-within:ring-2 sur container
            </code>
          </div>

          <!-- Input with Suffix -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Input with Suffix</label
            >
            <div
              class="flex h-10 w-full rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring"
            >
              <input
                type="number"
                placeholder="0.00"
                class="flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span
                class="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border-l border-border"
              >
                USD
              </span>
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block">
              Suffix: px-3 bg-muted border-l | Container: flex overflow-hidden
            </code>
          </div>

          <!-- Input with Action Button -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Input with Action</label
            >
            <div
              class="flex h-10 w-full rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring"
            >
              <input
                type="text"
                placeholder="Enter email..."
                class="flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                class="px-4 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                Send
              </button>
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block">
              Button: no rounded corners, seamless integration
            </code>
          </div>

          <!-- Password with Toggle -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Password with Toggle</label
            >
            <div class="relative">
              <BkIcon
                icon="lock"
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-10 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <BkIcon v-if="showPassword" icon="eye-off" :size="16" />
                <BkIcon v-else icon="eye" :size="16" />
              </button>
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block"
              >Left icon: pl-9 | Right action: pr-10</code
            >
          </div>

          <!-- Error State Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Error State</label
            >
            <input
              type="text"
              placeholder="invalid@email"
              class="flex h-10 w-full rounded-lg border-2 border-destructive bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            />
            <p class="text-xs text-destructive flex items-center gap-1">
              <BkIcon icon="alert-circle" :size="12" />
              Please enter a valid email address
            </p>
            <code class="text-xs bg-muted px-2 py-1 rounded block">
              border-2 border-destructive | ring-destructive
            </code>
          </div>

          <!-- Success State Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground"
              >Success State</label
            >
            <div class="relative">
              <input
                type="text"
                value="john@example.com"
                readonly
                class="flex h-10 w-full rounded-lg border-2 border-primary bg-background px-3 py-2 text-sm text-foreground pr-10"
              />
              <BkIcon
                icon="check-circle"
                :size="16"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
              />
            </div>
            <p class="text-xs text-primary flex items-center gap-1">
              <BkIcon icon="check-circle" :size="12" />
              Email verified successfully
            </p>
            <code class="text-xs bg-muted px-2 py-1 rounded block">
              border-2 border-primary | Success icon: text-primary
            </code>
          </div>

          <!-- Input with Character Count -->
          <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-medium text-foreground"
              >Textarea with Character Count</label
            >
            <div class="relative">
              <textarea
                placeholder="Enter your bio..."
                maxlength="200"
                :rows="4"
                class="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <span
                class="absolute bottom-2 right-2 text-xs text-muted-foreground"
                >0 / 200</span
              >
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block">
              Counter: absolute bottom-2 right-2 text-xs
            </code>
          </div>
        </div>
      </section>

      <!-- NEW: Advanced Cards -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Advanced Cards</h2>
          <p class="text-sm text-muted-foreground">
            <strong>Mood:</strong> Conteneurs expressifs - Cards pour différents
            types de contenu
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Stats Card -->
          <div class="rounded-lg border border-border bg-card p-6">
            <div class="flex items-center justify-between mb-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
              >
                <BkIcon icon="trending-up" :size="24" class="text-primary" />
              </div>
              <span
                class="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full"
                >+12.5%</span
              >
            </div>
            <h3 class="text-2xl font-semibold text-card-foreground mb-1">
              $24,567
            </h3>
            <p class="text-sm text-muted-foreground">Total Revenue</p>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-4">
              Icon container: h-12 w-12 rounded-lg bg-primary/10
            </code>
          </div>

          <!-- User Card -->
          <div class="rounded-lg border border-border bg-card overflow-hidden">
            <div class="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
            <div class="px-6 pb-6">
              <div class="flex items-end justify-between -mt-8 mb-4">
                <div
                  class="h-16 w-16 rounded-full border-4 border-card bg-muted flex items-center justify-center"
                >
                  <BkIcon
                    icon="user"
                    :size="32"
                    class="text-muted-foreground"
                  />
                </div>
                <button
                  class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Edit Profile
                </button>
              </div>
              <h3 class="text-lg font-medium text-card-foreground mb-1">
                John Doe
              </h3>
              <p class="text-sm text-muted-foreground mb-4">Product Designer</p>
              <div class="flex gap-2">
                <div
                  class="flex-1 text-center py-2 border border-border rounded-lg"
                >
                  <div class="text-lg font-semibold text-card-foreground">
                    1.2k
                  </div>
                  <div class="text-xs text-muted-foreground">Followers</div>
                </div>
                <div
                  class="flex-1 text-center py-2 border border-border rounded-lg"
                >
                  <div class="text-lg font-semibold text-card-foreground">
                    847
                  </div>
                  <div class="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block mx-6 mb-4">
              Avatar: -mt-8 border-4 border-card (overlaps header)
            </code>
          </div>

          <!-- Feature Card with Icon -->
          <div
            class="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4 group-hover:scale-110 transition-transform"
            >
              <BkIcon icon="zap" :size="20" />
            </div>
            <h3 class="text-lg font-medium text-card-foreground mb-2">
              Fast Performance
            </h3>
            <p class="text-sm text-muted-foreground">
              Lightning quick load times and smooth interactions.
            </p>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-4">
              hover:border-primary/50 | Icon: group-hover:scale-110
            </code>
          </div>

          <!-- Activity Card -->
          <div class="rounded-lg border border-border bg-card">
            <div class="p-4 border-b border-border">
              <h3 class="text-sm font-medium text-card-foreground">
                Recent Activity
              </h3>
            </div>
            <div class="p-4 space-y-4">
              <div class="flex gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0"
                >
                  <BkIcon icon="activity" :size="16" class="text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-card-foreground">
                    New user registered
                  </p>
                  <p class="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0"
                >
                  <BkIcon
                    icon="file-text"
                    :size="16"
                    class="text-muted-foreground"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-card-foreground">Document uploaded</p>
                  <p class="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block mx-4 mb-4">
              Activity item: gap-3 | Icon: h-8 w-8 rounded-full shrink-0
            </code>
          </div>

          <!-- Pricing Card -->
          <div
            class="rounded-lg border-2 border-primary bg-card p-6 relative overflow-hidden"
          >
            <div
              class="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg"
            >
              Popular
            </div>
            <h3 class="text-lg font-medium text-card-foreground mb-2 mt-4">
              Pro Plan
            </h3>
            <div class="flex items-baseline gap-1 mb-4">
              <span class="text-3xl font-bold text-card-foreground">$29</span>
              <span class="text-sm text-muted-foreground">/month</span>
            </div>
            <ul class="space-y-2 mb-6">
              <li class="flex items-center gap-2 text-sm text-card-foreground">
                <BkIcon icon="check" :size="16" class="text-primary" />
                Unlimited projects
              </li>
              <li class="flex items-center gap-2 text-sm text-card-foreground">
                <BkIcon icon="check" :size="16" class="text-primary" />
                Priority support
              </li>
              <li class="flex items-center gap-2 text-sm text-card-foreground">
                <BkIcon icon="check" :size="16" class="text-primary" />
                Advanced analytics
              </li>
            </ul>
            <button
              class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </button>
            <code class="text-xs bg-muted px-2 py-1 rounded block mt-4">
              Badge: absolute top-0 right-0 rounded-bl-lg
            </code>
          </div>

          <!-- Card with Actions -->
          <div
            class="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div
              class="aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center"
            >
              <BkIcon
                icon="file-text"
                :size="48"
                class="text-muted-foreground"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium text-card-foreground mb-2">
                Project Document
              </h3>
              <p class="text-sm text-muted-foreground mb-4">
                Updated 2 hours ago
              </p>
              <div class="flex items-center justify-between">
                <div class="flex gap-1">
                  <button
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
                  >
                    <BkIcon icon="heart" :size="16" />
                  </button>
                  <button
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
                  >
                    <BkIcon icon="bookmark" :size="16" />
                  </button>
                  <button
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
                  >
                    <BkIcon icon="share-2" :size="16" />
                  </button>
                </div>
                <button
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
                >
                  <BkIcon icon="more-horizontal" :size="16" />
                </button>
              </div>
            </div>
            <code class="text-xs bg-muted px-2 py-1 rounded block mx-4 mb-4">
              Image: aspect-video | Actions: h-8 w-8 gap-1
            </code>
          </div>
        </div>
      </section>

      <!-- NEW: Navigation Components -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Navigation Components
          </h2>
          <p class="text-sm text-muted-foreground">
            <strong>Mood:</strong> Wayfinding élégant - Navigation claire et
            intuitive
          </p>
        </div>

        <!-- Breadcrumbs -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Breadcrumbs</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Fil d'Ariane - Toujours savoir où on est
          </p>
          <nav class="flex items-center gap-2 text-sm">
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </a>
            <BkIcon
              icon="chevron-right"
              :size="16"
              class="text-muted-foreground"
            />
            <a
              href="#"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </a>
            <BkIcon
              icon="chevron-right"
              :size="16"
              class="text-muted-foreground"
            />
            <span class="text-foreground font-medium">Current Page</span>
          </nav>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            flex items-center gap-2 | ChevronRight: h-4 w-4
            text-muted-foreground
          </code>
        </div>

        <!-- Tabs -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Tabs</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Sections organisées - Contenu segmenté
            clairement
          </p>
          <div class="border-b border-border">
            <div class="flex gap-6">
              <button
                @click="activeTab = 'tab1'"
                :class="`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'tab1'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`"
              >
                Overview
              </button>
              <button
                @click="activeTab = 'tab2'"
                :class="`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'tab2'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`"
              >
                Analytics
              </button>
              <button
                @click="activeTab = 'tab3'"
                :class="`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'tab3'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`"
              >
                Settings
              </button>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-muted">
            <p v-if="activeTab === 'tab1'" class="text-sm text-foreground">
              Overview content
            </p>
            <p v-if="activeTab === 'tab2'" class="text-sm text-foreground">
              Analytics content
            </p>
            <p v-if="activeTab === 'tab3'" class="text-sm text-foreground">
              Settings content
            </p>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Active: border-b-2 border-primary text-foreground | Inactive:
            border-transparent text-muted-foreground
          </code>
        </div>

        <!-- Pills Tabs -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Pills Navigation</h3>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground"
            >
              Active
            </button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Inactive
            </button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Another
            </button>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Active: bg-primary text-primary-foreground | Inactive: bg-muted
            hover:bg-accent
          </code>
        </div>

        <!-- Vertical Navigation -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">
            Vertical Navigation
          </h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Menu latéral - Navigation sidebar élégante
          </p>
          <div class="w-64 rounded-lg border border-border bg-card p-2">
            <nav class="space-y-1">
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-accent text-accent-foreground"
              >
                <BkIcon icon="home" :size="16" />
                Dashboard
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BkIcon icon="folder" :size="16" />
                Projects
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BkIcon icon="users" :size="16" />
                Team
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <BkIcon icon="settings" :size="16" />
                Settings
              </a>
            </nav>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            space-y-1 container | Items: gap-3 px-3 py-2 | Active: bg-accent
            text-accent-foreground
          </code>
        </div>

        <!-- Pagination -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Pagination</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Navigation de données - Parcourir de
            grandes listes facilement
          </p>
          <nav class="flex items-center justify-center gap-2">
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              ←
            </button>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
            >
              1
            </button>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-primary bg-primary text-primary-foreground"
            >
              2
            </button>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
            >
              3
            </button>
            <span
              class="inline-flex h-9 w-9 items-center justify-center text-muted-foreground"
              >...</span
            >
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
            >
              10
            </button>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
            >
              →
            </button>
          </nav>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            h-9 w-9 gap-2 | Active: border-2 border-primary bg-primary
          </code>
        </div>
      </section>

      <!-- NEW: Data Display -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">Data Display</h2>
          <p class="text-sm text-muted-foreground">
            <strong>Mood:</strong> Information structurée - Présentation claire
            des données
          </p>
        </div>

        <!-- Simple Table -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Table</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Données tabulaires - Organisation claire
            en lignes et colonnes
          </p>
          <div class="rounded-lg border border-border overflow-hidden">
            <table class="w-full">
              <thead class="bg-muted border-b border-border">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-card divide-y divide-border">
                <tr class="hover:bg-accent/50 transition-colors">
                  <td class="px-4 py-3 text-sm text-foreground">John Doe</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                    >
                      Active
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-muted-foreground">Admin</td>
                  <td class="px-4 py-3 text-right">
                    <button class="text-sm text-primary hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-accent/50 transition-colors">
                  <td class="px-4 py-3 text-sm text-foreground">Jane Smith</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                    >
                      Inactive
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-muted-foreground">User</td>
                  <td class="px-4 py-3 text-right">
                    <button class="text-sm text-primary hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            thead: bg-muted text-xs uppercase tracking-wider | tbody: divide-y
            divide-border | tr: hover:bg-accent/50
          </code>
        </div>

        <!-- Definition List -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Definition List</h3>
          <div
            class="rounded-lg border border-border bg-card divide-y divide-border"
          >
            <div class="flex py-3 px-4">
              <dt class="w-1/3 text-sm font-medium text-foreground">
                Full Name
              </dt>
              <dd class="flex-1 text-sm text-muted-foreground">John Doe</dd>
            </div>
            <div class="flex py-3 px-4">
              <dt class="w-1/3 text-sm font-medium text-foreground">Email</dt>
              <dd class="flex-1 text-sm text-muted-foreground">
                john@example.com
              </dd>
            </div>
            <div class="flex py-3 px-4">
              <dt class="w-1/3 text-sm font-medium text-foreground">Role</dt>
              <dd class="flex-1 text-sm text-muted-foreground">
                <span
                  class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  Administrator
                </span>
              </dd>
            </div>
            <div class="flex py-3 px-4">
              <dt class="w-1/3 text-sm font-medium text-foreground">Joined</dt>
              <dd class="flex-1 text-sm text-muted-foreground">January 2024</dd>
            </div>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            flex py-3 px-4 | dt: w-1/3 font-medium | dd: flex-1
            text-muted-foreground
          </code>
        </div>

        <!-- Stats Grid -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Stats Grid</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Métriques visuelles - KPIs et statistiques
            au premier coup d'œil
          </p>
          <div class="grid gap-4 md:grid-cols-4">
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-muted-foreground"
                  >Total Users</span
                >
                <BkIcon icon="users" :size="16" class="text-muted-foreground" />
              </div>
              <div class="text-2xl font-bold text-foreground">2,543</div>
              <p class="text-xs text-primary flex items-center gap-1 mt-1">
                <BkIcon icon="trending-up" :size="12" />
                +12% from last month
              </p>
            </div>

            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-muted-foreground"
                  >Revenue</span
                >
                <BkIcon
                  icon="dollar-sign"
                  :size="16"
                  class="text-muted-foreground"
                />
              </div>
              <div class="text-2xl font-bold text-foreground">$45.2K</div>
              <p class="text-xs text-primary flex items-center gap-1 mt-1">
                <BkIcon icon="trending-up" :size="12" />
                +8.1% from last month
              </p>
            </div>

            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-muted-foreground"
                  >Active Now</span
                >
                <BkIcon
                  icon="activity"
                  :size="16"
                  class="text-muted-foreground"
                />
              </div>
              <div class="text-2xl font-bold text-foreground">573</div>
              <p class="text-xs text-muted-foreground mt-1">Currently online</p>
            </div>

            <div class="rounded-lg border border-border bg-card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-muted-foreground"
                  >Conversion</span
                >
                <BkIcon
                  icon="trending-up"
                  :size="16"
                  class="text-muted-foreground"
                />
              </div>
              <div class="text-2xl font-bold text-foreground">24.5%</div>
              <p class="text-xs text-destructive flex items-center gap-1 mt-1">
                <BkIcon icon="trending-up" :size="12" class="rotate-180" />
                -2.4% from last month
              </p>
            </div>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Card: p-4 | Title: text-sm with icon | Value: text-2xl font-bold |
            Change: text-xs with icon
          </code>
        </div>
      </section>

      <!-- NEW: Empty States & Feedback -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-medium text-foreground">
            Empty States & Feedback
          </h2>
          <p class="text-sm text-muted-foreground">
            <strong>Mood:</strong> Communication empathique - Messages clairs
            pour guider l'utilisateur
          </p>
        </div>

        <!-- Empty State -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">Empty State</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Page blanche accueillante - Encouragement
            à l'action
          </p>
          <div
            class="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4"
              >
                <BkIcon
                  icon="file-text"
                  :size="32"
                  class="text-muted-foreground"
                />
              </div>
              <h3 class="text-lg font-medium text-foreground mb-2">
                No documents yet
              </h3>
              <p class="text-sm text-muted-foreground mb-6 max-w-sm">
                Get started by creating your first document or uploading
                existing files.
              </p>
              <div class="flex gap-3">
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <BkIcon icon="plus" :size="16" />
                  Create Document
                </button>
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <BkIcon icon="upload" :size="16" />
                  Upload Files
                </button>
              </div>
            </div>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            Container: border-2 border-dashed bg-muted/30 p-12 | Icon: h-16 w-16
            rounded-full bg-muted
          </code>
        </div>

        <!-- Toast Notifications -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">
            Toast Notifications
          </h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Feedback instantané - Confirmation
            discrète des actions
          </p>
          <div class="space-y-3">
            <!-- Success Toast -->
            <div
              class="max-w-md rounded-lg border border-border bg-card p-4 shadow-lg"
            >
              <div class="flex gap-3">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 shrink-0"
                >
                  <BkIcon icon="check" :size="12" class="text-primary" />
                </div>
                <div class="flex-1">
                  <h5 class="text-sm font-medium text-foreground mb-1">
                    Success!
                  </h5>
                  <p class="text-sm text-muted-foreground">
                    Your changes have been saved.
                  </p>
                </div>
                <button
                  class="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BkIcon icon="x" :size="16" />
                </button>
              </div>
            </div>

            <!-- Error Toast -->
            <div
              class="max-w-md rounded-lg border border-destructive bg-card p-4 shadow-lg"
            >
              <div class="flex gap-3">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 shrink-0"
                >
                  <BkIcon icon="x" :size="12" class="text-destructive" />
                </div>
                <div class="flex-1">
                  <h5 class="text-sm font-medium text-foreground mb-1">
                    Error
                  </h5>
                  <p class="text-sm text-muted-foreground">
                    Something went wrong. Please try again.
                  </p>
                </div>
                <button
                  class="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BkIcon icon="x" :size="16" />
                </button>
              </div>
            </div>

            <!-- Info Toast -->
            <div
              class="max-w-md rounded-lg border border-border bg-card p-4 shadow-lg"
            >
              <div class="flex gap-3">
                <BkIcon icon="info" :size="20" class="text-primary shrink-0" />
                <div class="flex-1">
                  <h5 class="text-sm font-medium text-foreground mb-1">
                    New Update Available
                  </h5>
                  <p class="text-sm text-muted-foreground">
                    Version 2.0 is now available for download.
                  </p>
                </div>
                <button
                  class="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BkIcon icon="x" :size="16" />
                </button>
              </div>
            </div>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            max-w-md rounded-lg border bg-card p-4 shadow-lg | flex gap-3 |
            Close: shrink-0
          </code>
        </div>

        <!-- Banner Notifications -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-foreground">
            Banner Notifications
          </h3>
          <p class="text-sm text-muted-foreground">
            <strong>Feeling:</strong> Annonces importantes - Messages
            persistants en haut de page
          </p>
          <div class="rounded-lg border border-primary bg-primary/10 p-4">
            <div class="flex items-start gap-3">
              <BkIcon
                icon="info"
                :size="20"
                class="text-primary shrink-0 mt-0.5"
              />
              <div class="flex-1">
                <h5 class="text-sm font-medium text-foreground mb-1">
                  System Maintenance Scheduled
                </h5>
                <p class="text-sm text-muted-foreground">
                  Our system will be down for maintenance on Saturday, 2:00 AM -
                  4:00 AM EST.
                </p>
              </div>
              <button
                class="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors shrink-0"
              >
                Learn More
              </button>
              <button
                class="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <BkIcon icon="x" :size="16" />
              </button>
            </div>
          </div>
          <code class="text-xs bg-muted px-2 py-1 rounded block">
            border border-primary bg-primary/10 p-4 | flex items-start gap-3
          </code>
        </div>
      </section>
    </div>
  </div>
</template>
