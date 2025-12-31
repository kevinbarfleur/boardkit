<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { BkIcon, useWidgetTransform } from '@boardkit/ui'
import type { CalendarEvent } from '../types'
import EventDetailsPopover from './EventDetailsPopover.vue'

// Get widget transform (zoom * scale) from WidgetFrame
const widgetTransform = useWidgetTransform()

interface Props {
  event: CalendarEvent
  timeFormat: '12h' | '24h'
  showParticipantCount?: boolean
  showVideoIcon?: boolean
}

interface PopoverPosition {
  top: number
  left: number
  side: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  showParticipantCount: true,
  showVideoIcon: true,
})

// Popover state
const showPopover = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const popoverPosition = ref<PopoverPosition | null>(null)

const POPOVER_WIDTH = 320 // w-80 = 20rem = 320px
const POPOVER_GAP = 8 // gap between event and popover

const calculatePosition = (): PopoverPosition | null => {
  if (!containerRef.value) return null

  const rect = containerRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth

  // Check if there's enough space on the right
  const spaceOnRight = viewportWidth - rect.right
  const spaceOnLeft = rect.left

  // Prefer right side, but use left if not enough space
  const side = spaceOnRight >= POPOVER_WIDTH + POPOVER_GAP ? 'right' : 'left'

  return {
    top: rect.top,
    left: side === 'right' ? rect.right + POPOVER_GAP : rect.left - POPOVER_WIDTH - POPOVER_GAP,
    side,
  }
}

const togglePopover = async () => {
  if (!showPopover.value) {
    popoverPosition.value = calculatePosition()
    await nextTick()
  }
  showPopover.value = !showPopover.value
}

const closePopover = () => {
  showPopover.value = false
  popoverPosition.value = null
}

const timeString = computed(() => {
  if (props.event.isAllDay) return 'All day'

  const start = new Date(props.event.start)
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: props.timeFormat === '12h',
  }

  return start.toLocaleTimeString(undefined, options)
})

const dotStyle = computed(() => {
  if (!props.event.color) return {}
  return {
    backgroundColor: props.event.color,
  }
})

// Handle click outside to close popover
const handleClickOutside = (e: MouseEvent) => {
  if (showPopover.value && containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closePopover()
  }
}

// Continuously update popover position while open (follows canvas pan)
let animationFrameId: number | null = null

const updatePopoverPosition = () => {
  if (showPopover.value && containerRef.value) {
    const newPosition = calculatePosition()
    if (newPosition) {
      popoverPosition.value = newPosition
    }
    animationFrameId = requestAnimationFrame(updatePopoverPosition)
  }
}

const startPositionTracking = () => {
  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(updatePopoverPosition)
  }
}

const stopPositionTracking = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Watch popover state to start/stop position tracking
watch(showPopover, (isOpen) => {
  if (isOpen) {
    startPositionTracking()
  } else {
    stopPositionTracking()
  }
})

// Setup click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  stopPositionTracking()
})
</script>

<template>
  <div ref="containerRef" class="relative">
    <div
      class="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
      @click="togglePopover"
    >
      <!-- Color dot indicator -->
      <div
        class="w-2 h-2 rounded-full mt-1.5 shrink-0"
        :style="dotStyle"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-foreground truncate">
          {{ event.title }}
        </p>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{{ timeString }}</span>
          <span v-if="event.location" class="flex items-center gap-1 truncate">
            <BkIcon icon="map-pin" :size="10" />
            {{ event.location }}
          </span>
        </div>
      </div>

      <!-- Right side indicators -->
      <div v-if="(showParticipantCount && event.participants?.length) || (showVideoIcon && event.meetLink)" class="flex items-center gap-2 shrink-0">
        <!-- Participants count -->
        <div
          v-if="showParticipantCount && event.participants && event.participants.length > 0"
          class="flex items-center gap-1 text-xs text-muted-foreground"
          :title="`${event.participants.length} participant${event.participants.length > 1 ? 's' : ''}`"
        >
          <BkIcon icon="users" :size="12" />
          <span>{{ event.participants.length }}</span>
        </div>

        <!-- Meet link indicator -->
        <div
          v-if="showVideoIcon && event.meetLink"
          class="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary"
          title="Video meeting"
        >
          <BkIcon icon="video" :size="14" />
        </div>
      </div>
    </div>

    <!-- Details Popover -->
    <EventDetailsPopover
      v-if="showPopover && popoverPosition"
      :event="event"
      :time-format="timeFormat"
      :position="popoverPosition"
      :scale="widgetTransform.combinedScale"
      @close="closePopover"
    />
  </div>
</template>
