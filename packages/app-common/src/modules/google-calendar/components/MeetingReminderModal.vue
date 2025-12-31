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

// Time string
const timeString = computed(() => {
  if (props.event.isAllDay) return 'All day'
  return formatTime(props.event.start)
})

// Color style for accent
const colorStyle = computed(() => {
  if (!props.event.color) return {}
  return { backgroundColor: props.event.color }
})

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
      <div class="fixed inset-0 z-[100] flex items-center justify-center">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="handleDismiss"
        />

        <!-- Modal -->
        <div class="relative bg-popover rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
          <!-- Color accent bar -->
          <div class="h-1.5" :style="colorStyle" />

          <!-- Content -->
          <div class="p-6 text-center space-y-4">
            <!-- Icon -->
            <div class="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <BkIcon icon="video" :size="32" class="text-primary" />
            </div>

            <!-- Title -->
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Meeting starting now
              </p>
              <h2 class="text-lg font-semibold text-foreground">
                {{ event.title }}
              </h2>
            </div>

            <!-- Time -->
            <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BkIcon icon="clock" :size="14" />
              <span>{{ timeString }}</span>
            </div>

            <!-- Location if any -->
            <div v-if="event.location" class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BkIcon icon="map-pin" :size="14" />
              <span>{{ event.location }}</span>
            </div>

            <!-- Participants count -->
            <div
              v-if="event.participants && event.participants.length > 0"
              class="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <BkIcon icon="users" :size="14" />
              <span>{{ event.participants.length }} participant{{ event.participants.length > 1 ? 's' : '' }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
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
                <BkIcon icon="video" :size="14" class="mr-2" />
                Join
              </BkButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
