import type { TodoPriority } from '../types'

/**
 * Priority color mapping using design system tokens
 */
export function getPriorityColor(priority?: TodoPriority): string {
  switch (priority) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-amber-500'
    case 'low':
      return 'text-neutral-400'
    default:
      return 'text-muted-foreground'
  }
}

/**
 * Priority label for display
 */
export function getPriorityLabel(priority?: TodoPriority): string {
  switch (priority) {
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return ''
  }
}

/**
 * Cycle through priority values: none -> low -> medium -> high -> none
 */
export function getNextPriority(current?: TodoPriority): TodoPriority | undefined {
  switch (current) {
    case undefined:
      return 'low'
    case 'low':
      return 'medium'
    case 'medium':
      return 'high'
    case 'high':
      return undefined
  }
}
