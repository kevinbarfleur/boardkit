<script setup lang="ts">
import { ref, computed } from 'vue'
import BkIcon from './BkIcon.vue'

export type VisibilityMode = 'transparent' | 'subtle' | 'visible'

interface Props {
  id: string
  title?: string
  x: number
  y: number
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  selected?: boolean
  zIndex?: number
  // Visibility settings
  restMode?: VisibilityMode
  hoverMode?: VisibilityMode
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  minWidth: 320,
  minHeight: 100,
  selected: false,
  zIndex: 1,
  restMode: 'transparent',
  hoverMode: 'subtle',
})

const emit = defineEmits<{
  select: [id: string]
  move: [id: string, x: number, y: number]
  resize: [id: string, width: number, height: number]
  delete: [id: string]
  dragstart: [id: string]
}>()

const isDragging = ref(false)
const isResizing = ref(false)
const isHovered = ref(false)

// Visibility state: 'rest' | 'hover' | 'selected'
const visibilityState = computed(() => {
  if (props.selected) return 'selected'
  if (isHovered.value) return 'hover'
  return 'rest'
})

// Get CSS classes for a visibility mode
const getModeClasses = (mode: VisibilityMode) => {
  switch (mode) {
    case 'transparent':
      return 'bg-transparent border-transparent'
    case 'subtle':
      return 'bg-card/50 border-border/50'
    case 'visible':
      return 'bg-card border-border'
  }
}

// Current frame classes based on state
const frameClasses = computed(() => {
  if (visibilityState.value === 'selected') {
    return 'bg-card border-primary shadow-lg'
  }
  if (visibilityState.value === 'hover') {
    return getModeClasses(props.hoverMode)
  }
  return getModeClasses(props.restMode)
})
const dragStart = ref({ x: 0, y: 0 })
const initialPos = ref({ x: 0, y: 0 })
const initialSize = ref({ width: 0, height: 0 })

const style = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  zIndex: props.zIndex,
}))

const handleSelect = (e: MouseEvent) => {
  e.stopPropagation()
  emit('select', props.id)
}

const startDrag = (e: MouseEvent) => {
  if (e.button !== 0) return
  e.preventDefault()
  e.stopPropagation()

  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  initialPos.value = { x: props.x, y: props.y }

  emit('select', props.id)
  emit('dragstart', props.id)

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y

  emit('move', props.id, initialPos.value.x + dx, initialPos.value.y + dy)
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const startResize = (e: MouseEvent) => {
  if (e.button !== 0) return
  e.preventDefault()
  e.stopPropagation()

  isResizing.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  initialSize.value = { width: props.width, height: props.height }

  emit('select', props.id)

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return

  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y

  const newWidth = Math.max(props.minWidth, initialSize.value.width + dx)
  const newHeight = Math.max(props.minHeight, initialSize.value.height + dy)

  emit('resize', props.id, newWidth, newHeight)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

const handleDelete = () => {
  emit('delete', props.id)
}
</script>

<template>
  <div
    class="widget-frame absolute rounded-lg border-2 transition-[background-color,border-color,box-shadow] duration-200"
    :class="[
      frameClasses,
      { 'cursor-move': isDragging },
    ]"
    :style="style"
    @mousedown="handleSelect"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Minimal grip indicator (hover state only) - absolutely positioned -->
    <div
      v-if="visibilityState === 'hover'"
      class="absolute top-1 left-1/2 -translate-x-1/2 flex gap-0.5 cursor-move z-10"
      @mousedown="startDrag"
    >
      <div class="w-1 h-1 rounded-full bg-muted-foreground/50" />
      <div class="w-1 h-1 rounded-full bg-muted-foreground/50" />
      <div class="w-1 h-1 rounded-full bg-muted-foreground/50" />
    </div>

    <!-- Full Header (selected state only) - absolutely positioned overlay -->
    <div
      v-if="visibilityState === 'selected'"
      class="widget-header absolute inset-x-0 top-0 flex items-center gap-2 rounded-t-md px-3 py-1.5 cursor-move select-none bg-muted/80 backdrop-blur-sm z-10"
      @mousedown="startDrag"
    >
      <BkIcon icon="grip-vertical" class="text-muted-foreground" :size="14" />
      <span class="flex-1 text-sm font-medium text-card-foreground truncate">
        {{ props.title }}
      </span>
      <button
        class="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-accent"
        @mousedown.stop
        @click="handleDelete"
      >
        <BkIcon icon="x" :size="12" />
      </button>
    </div>

    <!-- Content - consistent padding, with extra top padding when header is shown -->
    <div
      class="widget-content h-full overflow-auto p-3 text-sm text-foreground transition-[padding] duration-200"
      :class="{ 'pt-10': visibilityState === 'selected' }"
    >
      <slot />
    </div>

    <!-- Resize handle (selected state only) -->
    <div
      v-if="visibilityState === 'selected'"
      class="absolute bottom-1 right-1 size-4 cursor-se-resize flex items-center justify-center z-10"
      @mousedown="startResize"
    >
      <BkIcon icon="grip-horizontal" :size="12" class="text-muted-foreground/50 rotate-[-45deg]" />
    </div>
  </div>
</template>
