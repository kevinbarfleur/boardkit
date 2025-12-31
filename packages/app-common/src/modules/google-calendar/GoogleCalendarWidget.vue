<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ModuleContext } from '@boardkit/core'
import { useSecrets, useAsyncOperation } from '@boardkit/core'
import { BkIcon, useToast } from '@boardkit/ui'
import type { CalendarState, CalendarEvent, CalendarSettings } from './types'
import { defaultCalendarSettings } from './types'
import EventItem from './components/EventItem.vue'
import EmptyState from './components/EmptyState.vue'
import MeetingReminderModal from './components/MeetingReminderModal.vue'

interface Props {
  context: ModuleContext<CalendarState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openSettings: [options?: { tab?: string }]
}>()

// Secrets API
const { resolveSecretRef } = useSecrets()

// Toast notifications
const { success, error: showError } = useToast()

// Meeting reminder state
const pendingReminder = ref<CalendarEvent | null>(null)
const dismissedReminders = ref<Set<string>>(new Set())
let reminderInterval: ReturnType<typeof setInterval> | null = null

// Async operation for fetching events
const {
  isLoading,
  error: fetchError,
  execute: fetchEvents,
} = useAsyncOperation<CalendarEvent[]>({
  onSuccess: (newEvents) => {
    props.context.updateState({
      events: newEvents,
      lastSync: Date.now(),
      syncError: null,
    })
    success('Calendar synced')
  },
  onError: (err) => {
    props.context.updateState({ syncError: err.message })
    showError('Failed to sync calendar')
  },
})

// Settings with defaults
const settings = computed<CalendarSettings>(() => ({
  showTomorrow: props.context.state.showTomorrow ?? defaultCalendarSettings.showTomorrow,
  showAllDay: props.context.state.showAllDay ?? defaultCalendarSettings.showAllDay,
  timeFormat: props.context.state.timeFormat ?? defaultCalendarSettings.timeFormat,
  maxEvents: props.context.state.maxEvents ?? defaultCalendarSettings.maxEvents,
  showParticipantCount: props.context.state.showParticipantCount ?? defaultCalendarSettings.showParticipantCount,
  showVideoIcon: props.context.state.showVideoIcon ?? defaultCalendarSettings.showVideoIcon,
}))

// Check if configured
const isConfigured = computed(() => {
  return !!(props.context.state.accessToken)
})

// User email
const userEmail = computed(() => props.context.state.userEmail)

// Grouped events
const events = computed(() => props.context.state.events || [])

// Helper to get local date string (YYYY-MM-DD) without timezone issues
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayEvents = computed(() => {
  const today = getLocalDateString(new Date())
  return events.value
    .filter((e) => {
      const eventDate = e.start.split('T')[0]
      return eventDate === today
    })
    .filter((e) => settings.value.showAllDay || !e.isAllDay)
    .slice(0, settings.value.maxEvents)
})

const tomorrowEvents = computed(() => {
  if (!settings.value.showTomorrow) return []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)
  return events.value
    .filter((e) => {
      const eventDate = e.start.split('T')[0]
      return eventDate === tomorrowStr
    })
    .filter((e) => settings.value.showAllDay || !e.isAllDay)
    .slice(0, settings.value.maxEvents)
})

const hasEvents = computed(() => todayEvents.value.length > 0 || tomorrowEvents.value.length > 0)
const hasBothDays = computed(() => todayEvents.value.length > 0 && tomorrowEvents.value.length > 0)

const lastSyncFormatted = computed(() => {
  const ts = props.context.state.lastSync
  if (!ts) return null
  const date = new Date(ts)
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

/**
 * Check for upcoming meetings and show reminder
 */
function checkForUpcomingMeetings() {
  const now = new Date()
  const todayStr = getLocalDateString(now)

  // Find meetings with video links starting in the next minute
  const upcomingMeeting = events.value.find((event) => {
    if (!event.meetLink) return false
    if (dismissedReminders.value.has(event.id)) return false

    const eventDate = event.start.split('T')[0]
    if (eventDate !== todayStr) return false

    const eventTime = new Date(event.start)
    const diffMs = eventTime.getTime() - now.getTime()
    const diffMins = diffMs / (1000 * 60)

    // Show reminder 1 minute before or if it's starting now (within 1 min window)
    return diffMins >= -1 && diffMins <= 1
  })

  if (upcomingMeeting && pendingReminder.value?.id !== upcomingMeeting.id) {
    pendingReminder.value = upcomingMeeting
  }
}

// Handle reminder actions
const handleJoinMeeting = () => {
  if (pendingReminder.value) {
    dismissedReminders.value.add(pendingReminder.value.id)
  }
  pendingReminder.value = null
}

const handleDismissReminder = () => {
  if (pendingReminder.value) {
    dismissedReminders.value.add(pendingReminder.value.id)
  }
  pendingReminder.value = null
}

/**
 * Test function to trigger meeting reminder modal.
 * Can be called from command palette or debug button.
 */
const triggerTestReminder = () => {
  const now = new Date()
  const testEvent: CalendarEvent = {
    id: 'test-reminder',
    title: 'Test Meeting Reminder',
    start: now.toISOString(),
    end: new Date(now.getTime() + 30 * 60000).toISOString(),
    isAllDay: false,
    color: '#4285F4',
    meetLink: 'https://meet.google.com/test-meeting',
    description: 'This is a test reminder to preview the meeting notification.',
    participants: [
      { email: 'alice@company.com', name: 'Alice Martin', responseStatus: 'accepted' },
      { email: 'bob@company.com', name: 'Bob Wilson', responseStatus: 'accepted' },
    ],
  }
  pendingReminder.value = testEvent
}

// Expose test function for debugging
defineExpose({ triggerTestReminder })

/**
 * Generate demo events relative to current date.
 */
function generateDemoEvents(): CalendarEvent[] {
  const now = new Date()
  const today = getLocalDateString(now)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)

  return [
    // Today's events
    {
      id: 'demo-1',
      title: 'Team Standup',
      start: `${today}T09:00:00`,
      end: `${today}T09:30:00`,
      isAllDay: false,
      color: '#4285F4',
      location: 'Zoom',
      meetLink: 'https://zoom.us/j/123456789',
      description: `Daily sync to discuss progress, blockers, and priorities.

Agenda:
• Yesterday's accomplishments
• Today's focus areas
• Any blockers or help needed

Please come prepared with your updates.`,
      participants: [
        { email: 'alice@company.com', name: 'Alice Martin', responseStatus: 'accepted' },
        { email: 'bob@company.com', name: 'Bob Wilson', responseStatus: 'accepted' },
        { email: 'carol@company.com', name: 'Carol Davis', responseStatus: 'tentative' },
        { email: 'david@company.com', name: 'David Lee', responseStatus: 'accepted' },
        { email: 'emma@company.com', name: 'Emma Thompson', responseStatus: 'needsAction' },
      ],
    },
    {
      id: 'demo-2',
      title: 'Q4 Design Review',
      start: `${today}T11:00:00`,
      end: `${today}T12:00:00`,
      isAllDay: false,
      color: '#EA4335',
      meetLink: 'https://meet.google.com/abc-defg-hij',
      description: `Quarterly review of design system updates and upcoming changes.

Topics:
1. New component library updates
2. Accessibility improvements
3. Dark mode refinements
4. Mobile-first responsive patterns

Figma link: figma.com/file/boardkit-ds`,
      participants: [
        { email: 'alice@company.com', name: 'Alice Martin', responseStatus: 'accepted' },
        { email: 'david@company.com', name: 'David Lee', responseStatus: 'accepted' },
        { email: 'sarah@company.com', name: 'Sarah Chen', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'demo-3',
      title: 'Lunch & Learn: AI in Product',
      start: `${today}T12:30:00`,
      end: `${today}T13:30:00`,
      isAllDay: false,
      color: '#34A853',
      location: 'Kitchen Area + Zoom',
      meetLink: 'https://zoom.us/j/987654321',
      description: `Casual session exploring how AI tools can enhance our product development workflow.

Bring your lunch!

Speaker: Sarah from the AI team will demo recent experiments with code generation and design automation.`,
    },
    {
      id: 'demo-4',
      title: 'Product Roadmap Sync',
      start: `${today}T15:00:00`,
      end: `${today}T16:00:00`,
      isAllDay: false,
      color: '#FBBC04',
      meetLink: 'https://meet.google.com/xyz-uvwx-rst',
      description: `Weekly sync with product managers to align on priorities.

Discussion points:
• Q1 feature prioritization
• Customer feedback review
• Resource allocation for new initiatives
• Timeline updates`,
      participants: [
        { email: 'emma@company.com', name: 'Emma Thompson', responseStatus: 'accepted' },
        { email: 'frank@company.com', name: 'Frank Brown', responseStatus: 'needsAction' },
        { email: 'grace@company.com', name: 'Grace Kim', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'demo-5',
      title: 'Client Call: Acme Corp',
      start: `${today}T17:00:00`,
      end: `${today}T17:45:00`,
      isAllDay: false,
      color: '#9C27B0',
      meetLink: 'https://meet.google.com/client-acme',
      description: `Quarterly business review with Acme Corporation.

Prepare:
• Usage metrics dashboard
• Feature adoption report
• Upcoming roadmap highlights

Contact: John Smith (john@acmecorp.com)`,
      participants: [
        { email: 'john@acmecorp.com', name: 'John Smith (Acme)', responseStatus: 'accepted' },
        { email: 'lisa@acmecorp.com', name: 'Lisa Wang (Acme)', responseStatus: 'accepted' },
        { email: 'emma@company.com', name: 'Emma Thompson', responseStatus: 'accepted' },
      ],
    },
    // All-day event for today
    {
      id: 'demo-6',
      title: 'Project Alpha Deadline',
      start: `${today}T00:00:00`,
      end: `${today}T23:59:59`,
      isAllDay: true,
      color: '#E91E63',
      description: `Final delivery deadline for Project Alpha.

Checklist:
• All PRs merged and deployed
• Documentation updated
• QA sign-off received
• Stakeholder demo completed`,
    },
    // Tomorrow's events
    {
      id: 'demo-7',
      title: 'Sprint Planning',
      start: `${tomorrowStr}T10:00:00`,
      end: `${tomorrowStr}T11:30:00`,
      isAllDay: false,
      color: '#4285F4',
      meetLink: 'https://meet.google.com/sprint-plan',
      description: `Bi-weekly sprint planning session.

Preparation:
• Review backlog items
• Update story point estimates
• Identify dependencies and blockers

Goal: Define sprint scope and commitments for the next 2 weeks.`,
      participants: [
        { email: 'alice@company.com', name: 'Alice Martin', responseStatus: 'accepted' },
        { email: 'bob@company.com', name: 'Bob Wilson', responseStatus: 'accepted' },
        { email: 'carol@company.com', name: 'Carol Davis', responseStatus: 'accepted' },
        { email: 'david@company.com', name: 'David Lee', responseStatus: 'tentative' },
        { email: 'emma@company.com', name: 'Emma Thompson', responseStatus: 'accepted' },
        { email: 'frank@company.com', name: 'Frank Brown', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'demo-8',
      title: '1:1 with Manager',
      start: `${tomorrowStr}T14:00:00`,
      end: `${tomorrowStr}T14:30:00`,
      isAllDay: false,
      color: '#00BCD4',
      meetLink: 'https://meet.google.com/one-on-one',
      description: `Weekly check-in with your manager.

Topics to discuss:
• Career growth and goals
• Current project progress
• Any support needed
• Feedback exchange`,
      participants: [
        { email: 'manager@company.com', name: 'Sarah Johnson', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'demo-9',
      title: 'Team Building: Game Night',
      start: `${tomorrowStr}T16:00:00`,
      end: `${tomorrowStr}T18:00:00`,
      isAllDay: false,
      color: '#FF5722',
      location: 'Conference Room A',
      description: `Monthly team building activity!

This month: Board games and snacks

Games available:
• Settlers of Catan
• Codenames
• Ticket to Ride
• Card games

Snacks and drinks provided. Bring your competitive spirit!`,
    },
    {
      id: 'demo-10',
      title: 'Code Freeze',
      start: `${tomorrowStr}T00:00:00`,
      end: `${tomorrowStr}T23:59:59`,
      isAllDay: true,
      color: '#607D8B',
      description: `Production code freeze for release v2.5.0

No deployments to production without explicit approval from release manager.

Emergency hotfix process remains available if needed.`,
    },
  ]
}

// Refresh events
const handleRefresh = async () => {
  await fetchEvents(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return generateDemoEvents()
  })
}

// Open settings
const openSettings = () => {
  emit('openSettings')
}

// Setup reminder check interval
onMounted(() => {
  reminderInterval = setInterval(checkForUpcomingMeetings, 30000) // Check every 30 seconds
  checkForUpcomingMeetings() // Initial check
})

onUnmounted(() => {
  if (reminderInterval) {
    clearInterval(reminderInterval)
  }
})

// Watch accessToken to auto-load events
watch(
  () => props.context.state.accessToken,
  (newToken) => {
    if (newToken && !hasEvents.value) {
      handleRefresh()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="google-calendar-widget h-full flex flex-col gap-3 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <BkIcon icon="calendar" :size="16" class="text-muted-foreground" />
        <span v-if="userEmail" class="text-xs text-muted-foreground truncate max-w-[150px]">
          {{ userEmail }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <span v-if="lastSyncFormatted" class="text-xs text-muted-foreground">
          {{ lastSyncFormatted }}
        </span>
        <!-- Test reminder button (dev only) -->
        <button
          class="p-1 text-muted-foreground hover:text-foreground transition-colors opacity-50 hover:opacity-100"
          title="Test meeting reminder"
          @click="triggerTestReminder"
        >
          <BkIcon icon="play" :size="14" />
        </button>
        <button
          class="p-1 text-muted-foreground hover:text-foreground transition-colors"
          :disabled="isLoading"
          title="Refresh"
          @click="handleRefresh"
        >
          <BkIcon icon="refresh-cw" :size="14" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </div>

    <!-- Not configured state -->
    <EmptyState v-if="!isConfigured" @configure="openSettings" />

    <!-- Configured but no events -->
    <div
      v-else-if="!hasEvents && !isLoading"
      class="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground"
    >
      <BkIcon icon="calendar-check" :size="32" />
      <p class="text-sm">No upcoming events</p>
      <button
        class="text-xs text-primary hover:text-primary/80 transition-colors"
        @click="handleRefresh"
      >
        Refresh
      </button>
    </div>

    <!-- Events - Two column layout when both days have events -->
    <div v-else class="flex-1 overflow-y-auto">
      <div :class="hasBothDays ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'">
        <!-- Today -->
        <div v-if="todayEvents.length > 0" class="flex flex-col min-w-0">
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 shrink-0">
            Today
          </h3>
          <div class="flex flex-col gap-2">
            <EventItem
              v-for="event in todayEvents"
              :key="event.id"
              :event="event"
              :time-format="settings.timeFormat"
              :show-participant-count="settings.showParticipantCount"
              :show-video-icon="settings.showVideoIcon"
            />
          </div>
        </div>

        <!-- Tomorrow -->
        <div v-if="tomorrowEvents.length > 0" class="flex flex-col min-w-0">
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 shrink-0">
            Tomorrow
          </h3>
          <div class="flex flex-col gap-2">
            <EventItem
              v-for="event in tomorrowEvents"
              :key="event.id"
              :event="event"
              :time-format="settings.timeFormat"
              :show-participant-count="settings.showParticipantCount"
              :show-video-icon="settings.showVideoIcon"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="fetchError"
      class="p-2 rounded bg-destructive/10 text-destructive text-xs flex items-center gap-2 shrink-0"
    >
      <BkIcon icon="alert-circle" :size="14" />
      <span>{{ fetchError }}</span>
    </div>

    <!-- Meeting Reminder Modal -->
    <MeetingReminderModal
      v-if="pendingReminder"
      :event="pendingReminder"
      :time-format="settings.timeFormat"
      @join="handleJoinMeeting"
      @dismiss="handleDismissReminder"
    />
  </div>
</template>
