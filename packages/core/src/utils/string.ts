/**
 * String utilities for Boardkit.
 */

/**
 * Truncate a string with ellipsis if it exceeds maxLength.
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis, or original string if short enough
 */
export function truncate(str: string | undefined | null, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}
