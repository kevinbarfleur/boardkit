<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import BkIcon from "./BkIcon.vue";

export type VisibilityMode = "transparent" | "subtle" | "visible";

interface Props {
  id: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  selected?: boolean;
  /** Whether this widget is part of a multi-selection (shows dashed border) */
  isMultiSelected?: boolean;
  /** Whether this widget is being dragged as part of a group */
  isDragging?: boolean;
  /** Drag offset for CSS transform during group drag */
  dragOffset?: { x: number; y: number };
  zIndex?: number;
  restMode?: VisibilityMode;
  hoverMode?: VisibilityMode;
  /** Canvas zoom level for proper drag/resize calculations */
  zoom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  minWidth: 320,
  minHeight: 100,
  selected: false,
  isMultiSelected: false,
  isDragging: false,
  dragOffset: () => ({ x: 0, y: 0 }),
  zIndex: 1,
  restMode: "transparent",
  hoverMode: "subtle",
  zoom: 1,
});

const emit = defineEmits<{
  select: [id: string, event: MouseEvent];
  move: [id: string, x: number, y: number];
  resize: [id: string, width: number, height: number];
  delete: [id: string];
  dragstart: [id: string];
  /** Emitted when drag starts on a multi-selected widget (parent handles group drag) */
  moveStart: [id: string, event: MouseEvent];
  /** Emitted when the settings button is clicked (opens context menu) */
  openMenu: [id: string, event: MouseEvent];
}>();

// State
const isDragging = ref(false);
const isResizing = ref(false);
const isHovered = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const initialPos = ref({ x: 0, y: 0 });
const initialSize = ref({ width: 0, height: 0 });

let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

// Cleanup timeout on unmount
onUnmounted(() => {
  if (hoverTimeout) clearTimeout(hoverTimeout);
});

// Computed
const visibilityState = computed<"rest" | "hover" | "selected">(() => {
  if (props.selected) return "selected";
  if (isHovered.value) return "hover";
  return "rest";
});

const showHeader = computed(() => visibilityState.value !== "rest" || props.isMultiSelected);

const frameStyle = computed(() => {
  // Apply drag offset during group drag
  const x = props.x + (props.isDragging ? props.dragOffset.x : 0);
  const y = props.y + (props.isDragging ? props.dragOffset.y : 0);

  return {
    transform: `translate(${x}px, ${y}px)`,
    width: `${props.width}px`,
    height: `${props.height}px`,
    zIndex: props.zIndex,
  };
});

const frameClasses = computed(() => {
  const base =
    "widget-frame absolute rounded-lg overflow-visible transition-colors duration-200";

  // Multi-selected: dashed border like elements
  if (props.isMultiSelected) {
    return `${base} bg-card border-2 border-dashed border-primary shadow-lg`;
  }

  // Single selected: solid border
  if (visibilityState.value === "selected") {
    return `${base} bg-card border border-primary shadow-lg`;
  }

  if (visibilityState.value === "hover") {
    switch (props.hoverMode) {
      case "transparent":
        return `${base} bg-transparent border border-transparent`;
      case "subtle":
        return `${base} bg-card/50 border border-border/50`;
      case "visible":
        return `${base} bg-card border border-border`;
    }
  }

  // Rest state
  switch (props.restMode) {
    case "transparent":
      return `${base} bg-transparent border border-transparent`;
    case "subtle":
      return `${base} bg-card/50 border border-border/50`;
    case "visible":
      return `${base} bg-card border border-border`;
  }
});

// Hover handling with delay for floating header access
const setHovered = (value: boolean) => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }

  if (value) {
    isHovered.value = true;
  } else {
    // Small delay to allow mouse to reach the floating header
    hoverTimeout = setTimeout(() => {
      isHovered.value = false;
    }, 100);
  }
};

// Event handlers
const handleSelect = (e: MouseEvent) => {
  e.stopPropagation();
  emit("select", props.id, e);
};

const startDrag = (e: MouseEvent) => {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  // If part of multi-selection, let parent handle the group drag
  if (props.isMultiSelected) {
    emit("moveStart", props.id, e);
    return;
  }

  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  initialPos.value = { x: props.x, y: props.y };

  emit("select", props.id, e);
  emit("dragstart", props.id);

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  // Divide by zoom to keep movement synchronized with cursor
  const dx = (e.clientX - dragStart.value.x) / props.zoom;
  const dy = (e.clientY - dragStart.value.y) / props.zoom;
  emit("move", props.id, initialPos.value.x + dx, initialPos.value.y + dy);
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
};

const startResize = (e: MouseEvent) => {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  isResizing.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  initialSize.value = { width: props.width, height: props.height };

  emit("select", props.id, e);

  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
};

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  // Divide by zoom to keep resize synchronized with cursor
  const dx = (e.clientX - dragStart.value.x) / props.zoom;
  const dy = (e.clientY - dragStart.value.y) / props.zoom;
  emit(
    "resize",
    props.id,
    Math.max(props.minWidth, initialSize.value.width + dx),
    Math.max(props.minHeight, initialSize.value.height + dy)
  );
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
};

const handleDelete = () => {
  emit("delete", props.id);
};

const handleOpenMenu = (e: MouseEvent) => {
  e.stopPropagation();
  emit("openMenu", props.id, e);
};
</script>

<template>
  <div
    :class="[frameClasses, { 'cursor-move': isDragging }]"
    :style="frameStyle"
    @mousedown="handleSelect"
    @mouseenter="setHovered(true)"
    @mouseleave="setHovered(false)"
  >
    <!-- Floating Header -->
    <div
      v-if="showHeader"
      class="absolute inset-x-0 bottom-full mb-2 flex items-center gap-2 rounded-lg px-3 py-2 cursor-move select-none bg-popover border border-border shadow-lg z-10"
      @mousedown="startDrag"
      @mouseenter="setHovered(true)"
      @mouseleave="setHovered(false)"
    >
      <BkIcon icon="grip-vertical" class="text-muted-foreground" :size="14" />
      <span class="flex-1 text-sm font-medium text-popover-foreground truncate">
        {{ title }}
      </span>
      <button
        v-if="selected || isMultiSelected"
        class="inline-flex h-5 w-5 items-center justify-center rounded bg-transparent hover:bg-accent"
        @mousedown.stop
        @click="handleOpenMenu"
      >
        <BkIcon icon="more-horizontal" :size="14" class="text-muted-foreground" />
      </button>
    </div>

    <!-- Content -->
    <div class="h-full overflow-auto p-3 text-sm text-foreground">
      <slot />
    </div>

    <!-- Resize Handle (hidden when multi-selected) -->
    <div
      v-if="selected && !isMultiSelected"
      class="absolute bottom-1 right-1 size-4 cursor-se-resize flex items-center justify-center z-10"
      @mousedown="startResize"
    >
      <BkIcon
        icon="grip-horizontal"
        :size="12"
        class="text-muted-foreground/50 rotate-[-45deg]"
      />
    </div>
  </div>
</template>
