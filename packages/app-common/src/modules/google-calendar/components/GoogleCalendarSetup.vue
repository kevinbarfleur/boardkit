<script setup lang="ts">
/**
 * GoogleCalendarSetup
 *
 * Custom configuration component for setting up Google Calendar.
 * For demo purposes, offers a "Demo Mode" button to skip OAuth.
 *
 * Receives a `context` prop from BkConfigurationPanel containing:
 * - widgetId, moduleId, state, updateState, setState, isSelected
 */
import { computed } from 'vue'
import { BkButton, BkIcon } from '@boardkit/ui'
import type { ModuleContext } from '@boardkit/core'
import type { CalendarState } from '../types'

interface Props {
  context?: ModuleContext<CalendarState>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [key: string, value: unknown]
}>()

const handleEnableDemo = () => {
  console.log('[GoogleCalendarSetup] Enable Demo clicked, emitting updates...')
  // Emit updates for each field
  emit('update', 'accessToken', 'demo')
  emit('update', 'userEmail', 'demo@example.com')
  console.log('[GoogleCalendarSetup] Updates emitted')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- OAuth Section (placeholder for real implementation) -->
    <div class="p-4 rounded-lg border border-border bg-muted/30">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <BkIcon icon="user" :size="20" class="text-primary" />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">Sign in with Google</p>
          <p class="text-xs text-muted-foreground">Connect your Google account</p>
        </div>
      </div>
      <BkButton variant="outline" class="w-full" disabled>
        <BkIcon icon="external-link" :size="14" class="mr-2" />
        Connect Google Account
      </BkButton>
      <p class="text-xs text-muted-foreground mt-2 text-center">
        OAuth integration requires additional setup
      </p>
    </div>

    <!-- Demo Mode Section -->
    <div class="p-4 rounded-lg border border-border bg-muted/30">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
          <BkIcon icon="play" :size="20" class="text-success" />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">Demo Mode</p>
          <p class="text-xs text-muted-foreground">Try the widget with sample data</p>
        </div>
      </div>
      <BkButton class="w-full" @click="handleEnableDemo">
        <BkIcon icon="sparkles" :size="14" class="mr-2" />
        Enable Demo Mode
      </BkButton>
    </div>
  </div>
</template>
