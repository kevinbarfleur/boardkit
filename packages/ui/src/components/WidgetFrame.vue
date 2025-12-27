<script setup lang="ts">
import { ref, computed } from 'vue'
import BkIcon from './BkIcon.vue'

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
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  minWidth: 320,
  minHeight: 100,
  selected: false,
  zIndex: 1,
})

const emit = defineEmits<{
  select: [id: string]
  move: [id: string, x: number, y: number]
  resize: [id: string, width: number, height: number]
  delete: [id: string]
}>()

const isDragging = ref(false)
const isResizing = ref(false)
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
    class="widget-frame absolute rounded-lg bg-card shadow-lg transition-colors"
    :class="{
      'border-2 border-primary': selected,
      'border border-border': !selected,
      'cursor-move': isDragging,
    }"
    :style="style"
    @mousedown="handleSelect"
  >
    <!-- Header -->
    <div
      class="widget-header flex items-center gap-2 border-b px-3 py-2 cursor-move select-none bg-muted/30"
      @mousedown="startDrag"
    >
      <BkIcon icon="grip-vertical" class="text-muted-foreground" />
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

    <!-- Content -->
    <div class="widget-content p-3 overflow-auto text-sm text-muted-foreground">
      <slot />
    </div>

    <!-- Resize handle -->
    <div
      v-if="selected"
      class="absolute bottom-1 right-1 size-4 cursor-se-resize flex items-center justify-center"
      @mousedown="startResize"
    >
      <BkIcon icon="grip-horizontal" :size="12" class="text-muted-foreground/50 rotate-[-45deg]" />
    </div>
  </div>
</template>
