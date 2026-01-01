/**
 * Google Calendar Module Types
 */

export interface CalendarEventParticipant {
  email: string
  name?: string
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction'
}

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO date
  end: string // ISO date
  isAllDay: boolean
  color?: string
  location?: string
  meetLink?: string
  calendarId?: string
  description?: string
  participants?: CalendarEventParticipant[]
}

export interface CalendarState {
  // Configuration (secrets stored in vault, references here)
  clientId: string | null
  clientSecret: string | null
  accessToken: string | null
  refreshToken: string | null

  // User info
  userEmail: string | null

  // Settings
  showTomorrow: boolean
  showAllDay: boolean
  timeFormat: '12h' | '24h'
  maxEvents: number
  showParticipantCount: boolean
  showVideoIcon: boolean

  // Runtime data
  events: CalendarEvent[]
  lastSync: number | null
  syncError: string | null
}

export const defaultCalendarState: CalendarState = {
  clientId: null,
  clientSecret: null,
  accessToken: null,
  refreshToken: null,
  userEmail: null,
  showTomorrow: true,
  showAllDay: true,
  timeFormat: '24h',
  maxEvents: 10,
  showParticipantCount: true,
  showVideoIcon: true,
  events: [],
  lastSync: null,
  syncError: null,
}

export interface CalendarSettings {
  showTomorrow: boolean
  showAllDay: boolean
  timeFormat: '12h' | '24h'
  maxEvents: number
  showParticipantCount: boolean
  showVideoIcon: boolean
}

export const defaultCalendarSettings: CalendarSettings = {
  showTomorrow: true,
  showAllDay: true,
  timeFormat: '24h',
  maxEvents: 10,
  showParticipantCount: true,
  showVideoIcon: true,
}
