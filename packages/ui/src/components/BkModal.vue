<script setup lang="ts">
import { watch, computed, onUnmounted } from "vue";
import BkIcon from "./BkIcon.vue";
import { usePlatform } from "../composables/usePlatform";

export type ModalSize = "sm" | "md" | "lg" | "xl";

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  size?: ModalSize;
  showHeaderDivider?: boolean;
  /** Hide the keyboard shortcut hint in the footer */
  hideKeyboardHint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: "",
  description: "",
  size: "md",
  showHeaderDivider: true,
  hideKeyboardHint: false,
});

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

// Platform detection for keyboard shortcuts
const { modifierSymbol } = usePlatform();

const close = () => {
  emit("close");
};

// Handle keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  // Escape to close
  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }

  // Cmd/Ctrl + Enter to submit
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    emit("submit");
  }
};

// Size classes mapping
const sizeClass = computed(() => {
  const sizes: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };
  return sizes[props.size];
});

// Global keydown listener when modal is open
const setupKeyboardListener = () => {
  window.addEventListener("keydown", handleKeydown);
};

const cleanupKeyboardListener = () => {
  window.removeEventListener("keydown", handleKeydown);
};

// Prevent body scroll when modal is open and setup keyboard listener
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setupKeyboardListener();
    } else {
      document.body.style.overflow = "";
      cleanupKeyboardListener();
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  cleanupKeyboardListener();
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <!-- Overlay transition -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        class="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]"
      >
        <!-- Overlay -->
        <div
          class="fixed inset-0 bg-overlay/80 backdrop-blur-sm"
          aria-hidden="true"
          @click="close"
        />

        <!-- Modal panel transition -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="props.open"
            class="relative w-full rounded-xl border border-border bg-popover shadow-2xl"
            :class="sizeClass"
          >
            <!-- Header -->
            <div
              v-if="props.title || $slots.header"
              class="flex items-center justify-between p-4"
              :class="{ 'border-b border-border': showHeaderDivider }"
            >
              <slot name="header">
                <div>
                  <h3 class="text-base font-medium text-foreground font-serif">
                    {{ props.title }}
                  </h3>
                  <p
                    v-if="props.description"
                    class="mt-0.5 text-sm text-muted-foreground"
                  >
                    {{ props.description }}
                  </p>
                </div>
              </slot>
              <button
                class="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
                @click="close"
              >
                <BkIcon icon="x" :size="16" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-4 max-h-[60vh] overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex items-center justify-between p-4 border-t border-border"
            >
              <!-- Keyboard hint -->
              <span
                v-if="!hideKeyboardHint"
                class="text-xs text-muted-foreground/60"
              >
                <kbd class="px-1 py-0.5 bg-muted rounded text-[10px]">{{
                  modifierSymbol
                }}</kbd>
                <span class="mx-0.5">+</span>
                <kbd class="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
                <span class="ml-1">to submit</span>
              </span>
              <span v-else />

              <div class="flex items-center gap-2">
                <slot name="footer" />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
