/**
 * Focus Lens Module Types
 */

export interface FocusLensState {
  /** Connected provider widget ID */
  connectedProvider: string | null
  /** Which task to show */
  showMode: 'next' | 'random'
  // Settings (stored per widget)
  /** Auto-refresh interval in seconds (0 = disabled) */
  autoRefresh: number
  /** Show the source todo list name */
  showSourceName: boolean
}

// Default settings for new widgets
export const defaultFocusLensSettings: Pick<FocusLensState, 'autoRefresh' | 'showSourceName'> = {
  autoRefresh: 0,
  showSourceName: true,
}
