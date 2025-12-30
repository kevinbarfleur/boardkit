/**
 * Scratchpad Module Types
 *
 * Lightweight quick notes module for rapid text capture.
 */

export type FontSize = 'small' | 'medium' | 'large'

export interface ScratchpadState {
  // Core state
  content: string

  // Settings
  fontSize: FontSize
  showWordCount: boolean
  placeholder: string
}

export const defaultScratchpadSettings: Omit<ScratchpadState, 'content'> = {
  fontSize: 'medium',
  showWordCount: false,
  placeholder: 'Quick notes...',
}
