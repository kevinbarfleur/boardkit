<script setup lang="ts">
/**
 * EventDetailsPopover
 *
 * A popover showing event details when clicking on an event.
 * Uses Teleport to render outside the module container.
 * Positioned to the right or left of the event based on available space.
 */
import { computed, ref } from 'vue'
import { BkIcon, BkButton } from '@boardkit/ui'
import type { CalendarEvent } from '../types'

// Ref for the popover container
const popoverRef = ref<HTMLElement | null>(null)

/**
 * Handle wheel events by passing them through to elements underneath.
 * This allows canvas panning to work even when the mouse is over the popover.
 */
const handleWheel = (event: WheelEvent) => {
  if (!popoverRef.value) return

  // Temporarily hide the popover to find the element underneath
  const originalPointerEvents = popoverRef.value.style.pointerEvents
  popoverRef.value.style.pointerEvents = 'none'

  // Find the element at the cursor position
  const elementBelow = document.elementFromPoint(event.clientX, event.clientY)

  // Restore pointer events
  popoverRef.value.style.pointerEvents = originalPointerEvents

  // If there's an element below, dispatch a new wheel event to it
  if (elementBelow) {
    const newEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      deltaMode: event.deltaMode,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    })
    elementBelow.dispatchEvent(newEvent)
  }
}

interface PopoverPosition {
  top: number
  left: number
  side: 'left' | 'right'
}

interface Props {
  event: CalendarEvent
  timeFormat: '12h' | '24h'
  position: PopoverPosition
  /** Combined scale (canvas zoom * widget scale) for proper sizing */
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1,
})

// Computed style for absolute positioning with scale
const positionStyle = computed(() => {
  const style: Record<string, string | number> = {
    position: 'fixed',
    top: `${props.position.top}px`,
    left: `${props.position.left}px`,
    zIndex: 9999,
  }

  // Apply scale transform to match widget zoom level
  if (props.scale !== 1) {
    style.transform = `scale(${props.scale})`
    // Origin depends on which side the popover is positioned
    // Right side: scale from top-left, Left side: scale from top-right
    style.transformOrigin = props.position.side === 'right' ? 'top left' : 'top right'
  }

  return style
})

const emit = defineEmits<{
  close: []
}>()

// Format time
const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: props.timeFormat === '12h',
  }
  return date.toLocaleTimeString(undefined, options)
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Date string
const dateString = computed(() => formatDate(props.event.start))

// Time range string
const timeRange = computed(() => {
  if (props.event.isAllDay) return 'All day'
  return `${formatTime(props.event.start)} - ${formatTime(props.event.end)}`
})

// Duration in minutes
const durationMinutes = computed(() => {
  if (props.event.isAllDay) return null
  const start = new Date(props.event.start)
  const end = new Date(props.event.end)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
})

// Duration formatted
const durationFormatted = computed(() => {
  if (!durationMinutes.value) return null
  const mins = durationMinutes.value
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (remainingMins === 0) return `${hours}h`
  return `${hours}h ${remainingMins}min`
})

// Color style
const colorStyle = computed(() => {
  if (!props.event.color) return {}
  return { backgroundColor: props.event.color }
})

// Response status icon
const getResponseIcon = (status?: string) => {
  switch (status) {
    case 'accepted':
      return 'check'
    case 'declined':
      return 'x'
    case 'tentative':
      return 'help-circle'
    default:
      return 'clock'
  }
}

// Response status color
const getResponseColor = (status?: string) => {
  switch (status) {
    case 'accepted':
      return 'text-green-500'
    case 'declined':
      return 'text-red-500'
    case 'tentative':
      return 'text-yellow-500'
    default:
      return 'text-muted-foreground'
  }
}

// Open meet link
const openMeetLink = () => {
  if (props.event.meetLink) {
    window.open(props.event.meetLink, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="popoverRef"
      class="w-80 bg-popover shadow-xl overflow-hidden rounded-lg"
      :style="positionStyle"
      @click.stop
      @wheel="handleWheel"
    >
      <!-- Header -->
      <div class="relative">
        <button
          class="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors z-10"
          @click="emit('close')"
        >
          <BkIcon icon="x" :size="16" class="text-muted-foreground" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Title -->
        <h3 class="text-base font-semibold text-foreground pr-8 leading-tight">
          {{ event.title }}
        </h3>

        <!-- Date & Time section -->
        <div class="space-y-2">
          <!-- Date -->
          <div class="flex items-center gap-2.5 text-sm text-muted-foreground">
            <BkIcon icon="calendar" :size="14" class="shrink-0" />
            <span>{{ dateString }}</span>
          </div>

          <!-- Time -->
          <div class="flex items-center gap-2.5 text-sm text-muted-foreground">
            <BkIcon icon="clock" :size="14" class="shrink-0" />
            <span>{{ timeRange }}</span>
            <span v-if="durationFormatted" class="text-muted-foreground/60">
              ({{ durationFormatted }})
            </span>
          </div>

          <!-- Location -->
          <div v-if="event.location" class="flex items-start gap-2.5 text-sm text-muted-foreground">
            <BkIcon icon="map-pin" :size="14" class="mt-0.5 shrink-0" />
            <span>{{ event.location }}</span>
          </div>

          <!-- Meet link display -->
          <div v-if="event.meetLink" class="flex items-center gap-2.5 text-sm text-primary">
            <BkIcon icon="video" :size="14" class="shrink-0" />
            <span class="truncate">{{ event.meetLink.replace('https://', '') }}</span>
          </div>
        </div>

        <!-- Separator -->
        <div v-if="event.description" class="border-t border-border" />

        <!-- Description -->
        <div v-if="event.description" class="text-sm text-muted-foreground">
          <p class="whitespace-pre-wrap leading-relaxed">{{ event.description }}</p>
        </div>

        <!-- Separator -->
        <div v-if="event.participants && event.participants.length > 0" class="border-t border-border" />

        <!-- Participants -->
        <div v-if="event.participants && event.participants.length > 0" class="space-y-2.5">
          <div class="flex items-center gap-2 text-sm font-medium text-foreground">
            <BkIcon icon="users" :size="14" />
            <span>Participants ({{ event.participants.length }})</span>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="participant in event.participants"
              :key="participant.email"
              class="flex items-center gap-2.5 text-sm"
            >
              <BkIcon
                :icon="getResponseIcon(participant.responseStatus)"
                :size="12"
                :class="getResponseColor(participant.responseStatus)"
              />
              <span class="text-foreground">
                {{ participant.name || participant.email }}
              </span>
            </div>
          </div>
        </div>

        <!-- Meet link button -->
        <div v-if="event.meetLink" class="pt-2">
          <BkButton
            variant="default"
            class="w-full"
            @click="openMeetLink"
          >
            <BkIcon icon="video" :size="16" class="mr-2" />
            Join Meeting
          </BkButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
