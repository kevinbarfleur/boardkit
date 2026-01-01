<script setup lang="ts">
/**
 * MeetingReminderModal
 *
 * Full-screen modal that appears when a meeting with video conference
 * is about to start. Offers to join the meeting or dismiss.
 */
import { computed } from 'vue'
import { BkIcon, BkButton } from '@boardkit/ui'
import type { CalendarEvent } from '../types'

interface Props {
  event: CalendarEvent
  timeFormat: '12h' | '24h'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  join: []
  dismiss: []
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

// Time range
const timeRange = computed(() => {
  if (props.event.isAllDay) return 'All day'
  return `${formatTime(props.event.start)} - ${formatTime(props.event.end)}`
})

// Duration
const duration = computed(() => {
  if (props.event.isAllDay) return null
  const start = new Date(props.event.start)
  const end = new Date(props.event.end)
  const mins = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (remainingMins === 0) return `${hours}h`
  return `${hours}h ${remainingMins}min`
})

// Response status helpers
const getResponseIcon = (status?: string) => {
  switch (status) {
    case 'accepted': return 'check'
    case 'declined': return 'x'
    case 'tentative': return 'help-circle'
    default: return 'clock'
  }
}

const getResponseColor = (status?: string) => {
  switch (status) {
    case 'accepted': return 'text-green-500'
    case 'declined': return 'text-red-500'
    case 'tentative': return 'text-yellow-500'
    default: return 'text-muted-foreground'
  }
}

// Join meeting
const handleJoin = () => {
  if (props.event.meetLink) {
    window.open(props.event.meetLink, '_blank', 'noopener,noreferrer')
  }
  emit('join')
}

// Dismiss
const handleDismiss = () => {
  emit('dismiss')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-md"
          @click="handleDismiss"
        />

        <!-- Modal -->
        <div class="relative bg-popover rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
          <!-- Header -->
          <div class="p-5 pb-4">
            <div class="flex items-start gap-4">
              <!-- Video icon badge -->
              <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BkIcon icon="video" :size="24" class="text-primary" />
              </div>

              <!-- Title & subtitle -->
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                  Meeting starting now
                </p>
                <h2 class="text-lg font-semibold text-foreground leading-tight">
                  {{ event.title }}
                </h2>
              </div>

              <!-- Close button -->
              <button
                class="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                @click="handleDismiss"
              >
                <BkIcon icon="x" :size="18" class="text-muted-foreground" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-5 pb-5 space-y-4">
            <!-- Time & Location -->
            <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <div class="flex items-center gap-2 text-foreground">
                <BkIcon icon="clock" :size="14" class="text-muted-foreground" />
                <span>{{ timeRange }}</span>
                <span v-if="duration" class="text-muted-foreground">({{ duration }})</span>
              </div>
              <div v-if="event.location" class="flex items-center gap-2 text-foreground">
                <BkIcon icon="map-pin" :size="14" class="text-muted-foreground" />
                <span>{{ event.location }}</span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="event.description" class="text-sm text-muted-foreground leading-relaxed">
              <p class="whitespace-pre-wrap">{{ event.description }}</p>
            </div>

            <!-- Participants -->
            <div v-if="event.participants && event.participants.length > 0">
              <div class="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
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

            <!-- Actions -->
            <div class="flex gap-3 pt-3">
              <BkButton
                variant="outline"
                class="flex-1"
                @click="handleDismiss"
              >
                Dismiss
              </BkButton>
              <BkButton
                variant="default"
                class="flex-1"
                @click="handleJoin"
              >
                <BkIcon icon="video" :size="16" class="mr-2" />
                Join Meeting
              </BkButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
