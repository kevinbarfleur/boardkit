/**
 * Format a due date for display
 * Returns: "Today", "Tomorrow", "Overdue", or "Jan 15" format
 */
export function formatDueDate(dateStr?: string): string {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) return 'Today'
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (dateOnly < today) return 'Overdue'

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

/**
 * Check if a due date is overdue (in the past)
 */
export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date < today
}

/**
 * Check if a due date is today
 */
export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  return dateOnly.getTime() === today.getTime()
}
