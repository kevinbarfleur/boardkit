import { defineModule } from '@boardkit/core'
import type { ConfigurationSchema, SettingsSchema } from '@boardkit/core'
import GoogleCalendarWidget from './GoogleCalendarWidget.vue'
import GoogleCalendarSetup from './components/GoogleCalendarSetup.vue'
import type { CalendarState } from './types'
import { defaultCalendarState, defaultCalendarSettings } from './types'

/**
 * Configuration schema for Google Calendar module.
 * Uses custom component for OAuth flow or demo mode setup.
 */
const configurationSchema: ConfigurationSchema = {
  isConfigured: (state) => {
    const s = state as CalendarState
    // For demo purposes, we consider it configured if there's an access token
    // In real implementation, this would check for valid OAuth credentials
    return !!s.accessToken
  },
  setupMessage: 'Connect your Google Calendar to see your upcoming events',
  setupIcon: 'calendar',
  sections: [
    {
      type: 'custom',
      title: 'Connect Calendar',
      icon: 'calendar',
      component: 'GoogleCalendarSetup',
      description: 'Connect your Google account or use demo mode to preview the widget.',
    },
  ],
}

/**
 * Settings schema for Google Calendar module.
 * Optional preferences for display customization.
 */
const settingsSchema: SettingsSchema = {
  sections: [
    {
      id: 'display',
      title: 'Display',
      icon: 'eye',
      fields: [
        {
          type: 'toggle',
          key: 'showTomorrow',
          label: 'Show tomorrow',
          hint: "Also display tomorrow's events",
        },
        {
          type: 'toggle',
          key: 'showAllDay',
          label: 'All-day events',
          hint: 'Show all-day events in the list',
        },
        {
          type: 'button-group',
          key: 'timeFormat',
          label: 'Time format',
          options: [
            { value: '12h', label: '12h' },
            { value: '24h', label: '24h' },
          ],
        },
        {
          type: 'slider',
          key: 'maxEvents',
          label: 'Max events',
          min: 3,
          max: 20,
          step: 1,
          showValue: true,
          hint: 'Maximum number of events to display per day',
        },
        {
          type: 'toggle',
          key: 'showParticipantCount',
          label: 'Show participant count',
          hint: 'Display participant count on event cards',
        },
        {
          type: 'toggle',
          key: 'showVideoIcon',
          label: 'Show video icon',
          hint: 'Display video icon for meetings with video calls',
        },
      ],
    },
  ],
}

export const GoogleCalendarModule = defineModule<CalendarState>({
  moduleId: 'google-calendar',
  version: '0.1.0',
  displayName: 'Google Calendar',
  icon: 'calendar',
  component: GoogleCalendarWidget,
  defaultState: () => ({
    ...defaultCalendarState,
  }),
  serialize: (state) => {
    // Keep all state including runtime data for reactivity
    // Events will be regenerated on next app open anyway (demo mode)
    return state
  },
  deserialize: (data) => ({
    ...defaultCalendarState,
    ...defaultCalendarSettings,
    ...(data as Partial<CalendarState>),
  }),
  minWidth: 250,
  minHeight: 200,
  defaultWidth: 300,
  defaultHeight: 350,
  configurationSchema,
  settingsSchema,
})

export type { CalendarState, CalendarEvent, CalendarSettings } from './types'
export { defaultCalendarState, defaultCalendarSettings } from './types'
export { GoogleCalendarSetup }
