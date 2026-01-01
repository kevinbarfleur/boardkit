export type EditorMode = 'markdown' | 'richtext'

export interface TextState {
  content: string
  // Settings (stored per widget)
  fontSize: 'small' | 'medium' | 'large'
  lineHeight: 'compact' | 'normal' | 'spacious'
  enableShortcuts: boolean
  autoLinks: boolean
  smartTypography: boolean
  showWordCount: boolean
  editorMode: EditorMode
}

// Default settings for new widgets
export const defaultTextSettings: Omit<TextState, 'content'> = {
  fontSize: 'medium',
  lineHeight: 'normal',
  enableShortcuts: true,
  autoLinks: true,
  smartTypography: true,
  showWordCount: false,
  editorMode: 'markdown',
}
