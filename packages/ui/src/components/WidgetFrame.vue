<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
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

// State
const isDragging = ref(false)
const isResizing = ref(false)
const isHovered = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const initialPos = ref({ x: 0, y: 0 })
const initialSize = ref({ width: 0, height: 0 })

let hoverTimeout: ReturnType<typeof setTimeout> | null = null

// Cleanup timeout on unmount
onUnmounted(() => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
})

// Computed
const visibilityState = computed<'rest' | 'hover' | 'selected'>(() => {
  if (props.selected) return 'selected'
  if (isHovered.value) return 'hover'
  return 'rest'
})

const showHeader = computed(() => visibilityState.value !== 'rest')

const frameStyle = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  zIndex: props.zIndex,
}))

const frameClasses = computed(() => {
  const base = 'widget-frame absolute rounded-lg border overflow-visible transition-colors duration-200'

  if (visibilityState.value === 'selected') {
    return `${base} bg-card border-primary shadow-lg`
  }

  if (visibilityState.value === 'hover') {
    switch (props.hoverMode) {
      case 'transparent':
        return `${base} bg-transparent border-transparent`
      case 'subtle':
        return `${base} bg-card/50 border-border/50`
      case 'visible':
        return `${base} bg-card border-border`
    }
  }

  // Rest state
  switch (props.restMode) {
    case 'transparent':
      return `${base} bg-transparent border-transparent`
    case 'subtle':
      return `${base} bg-card/50 border-border/50`
    case 'visible':
      return `${base} bg-card border-border`
  }
})

// Hover handling with delay for floating header access
const setHovered = (value: boolean) => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }

  if (value) {
    isHovered.value = true
  } else {
    // Small delay to allow mouse to reach the floating header
    hoverTimeout = setTimeout(() => {
      isHovered.value = false
    }, 100)
  }
}

// Event handlers
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
  emit('resize', props.id,
    Math.max(props.minWidth, initialSize.value.width + dx),
    Math.max(props.minHeight, initialSize.value.height + dy)
  )
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
        v-if="selected"
        class="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
        @mousedown.stop
        @click="handleDelete"
      >
        <BkIcon icon="x" :size="12" />
      </button>
    </div>

    <!-- Content -->
    <div class="h-full overflow-auto p-3 text-sm text-foreground">
      <slot />
    </div>

    <!-- Resize Handle -->
    <div
      v-if="selected"
      class="absolute bottom-1 right-1 size-4 cursor-se-resize flex items-center justify-center z-10"
      @mousedown="startResize"
    >
      <BkIcon icon="grip-horizontal" :size="12" class="text-muted-foreground/50 rotate-[-45deg]" />
    </div>
  </div>
</template>
