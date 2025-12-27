import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Keyboard Shortcut Manager
 *
 * Centralized keyboard shortcut handling for canvas applications.
 * Shortcuts are automatically disabled when focus is on input elements.
 *
 * Registered shortcuts:
 * - Escape: Clear selection
 * - Delete/Backspace: Remove selected widget
 * - Cmd/Ctrl + D: Duplicate selected widget
 * - Cmd/Ctrl + 0: Reset view
 * - Cmd/Ctrl + K: Open command palette
 * - Arrow keys: Nudge selected widget (1px)
 * - Shift + Arrow keys: Nudge selected widget (10px)
 */

export interface ShortcutHandler {
  key: string
  modifiers?: {
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    alt?: boolean
  }
  handler: (e: KeyboardEvent) => void
  description?: string
}

export interface KeyboardShortcutsOptions {
  onEscape?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onResetView?: () => void
  onCommandPalette?: () => void
  onNudge?: (dx: number, dy: number) => void
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const isSpacePressed = ref(false)

  const isInputElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false
    const tagName = target.tagName.toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    )
  }

  const isMac = () => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }

  const hasModifier = (e: KeyboardEvent, ctrl: boolean = false, meta: boolean = false) => {
    // On Mac, prefer metaKey (Cmd). On other platforms, prefer ctrlKey.
    if (isMac()) {
      return meta ? e.metaKey : ctrl ? e.ctrlKey : false
    }
    return ctrl ? e.ctrlKey : meta ? e.metaKey : false
  }

  const hasCmdOrCtrl = (e: KeyboardEvent) => {
    return isMac() ? e.metaKey : e.ctrlKey
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Track space key for panning
    if (e.code === 'Space' && !isInputElement(e.target)) {
      isSpacePressed.value = true
      // Don't prevent default here - let the canvas handle the cursor change
    }

    // Skip shortcuts when typing in inputs
    if (isInputElement(e.target)) return

    const key = e.key.toLowerCase()

    // Escape - clear selection
    if (key === 'escape') {
      e.preventDefault()
      options.onEscape?.()
      return
    }

    // Delete / Backspace - remove selected widget
    if (key === 'delete' || key === 'backspace') {
      e.preventDefault()
      options.onDelete?.()
      return
    }

    // Cmd/Ctrl + D - duplicate
    if (key === 'd' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      options.onDuplicate?.()
      return
    }

    // Cmd/Ctrl + 0 - reset view
    if ((key === '0' || e.code === 'Digit0') && hasCmdOrCtrl(e)) {
      e.preventDefault()
      options.onResetView?.()
      return
    }

    // Cmd/Ctrl + K - command palette
    if (key === 'k' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      options.onCommandPalette?.()
      return
    }

    // Arrow keys - nudge widget
    const nudgeAmount = e.shiftKey ? 10 : 1
    if (key === 'arrowup') {
      e.preventDefault()
      options.onNudge?.(0, -nudgeAmount)
      return
    }
    if (key === 'arrowdown') {
      e.preventDefault()
      options.onNudge?.(0, nudgeAmount)
      return
    }
    if (key === 'arrowleft') {
      e.preventDefault()
      options.onNudge?.(-nudgeAmount, 0)
      return
    }
    if (key === 'arrowright') {
      e.preventDefault()
      options.onNudge?.(nudgeAmount, 0)
      return
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpacePressed.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  return {
    isSpacePressed,
  }
}
