/**
 * Task Radar Module Types
 */

export interface TaskRadarState {
  /** Custom title for the radar */
  title: string
  /** Widget IDs of connected todo providers */
  connectedProviders: string[]
  /** Display mode */
  viewMode: 'summary' | 'detailed'
  // Settings (stored per widget)
  /** Show sources that have no tasks */
  showEmptyLists: boolean
  /** Group tasks by source in detailed view */
  groupBySource: boolean
}

// Default settings for new widgets
export const defaultTaskRadarSettings: Pick<TaskRadarState, 'showEmptyLists' | 'groupBySource'> = {
  showEmptyLists: true,
  groupBySource: true,
}
