import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { ToolType } from '../types/tool'
import type { ActionContext } from '../types/action'
import type { ActionRegistry } from '../actions/ActionRegistry'
import { KEY_TO_TOOL } from '../types/tool'

/**
 * Keyboard Shortcut Manager
 *
 * Centralized keyboard shortcut handling for canvas applications.
 * Routes shortcuts through ActionRegistry for consistent behavior.
 *
 * Registered shortcuts:
 * - Escape: Close context menu / Cancel drawing / Clear selection
 * - Delete/Backspace: Remove selected widget/element
 * - Cmd/Ctrl + Z: Undo last action
 * - Cmd/Ctrl + Shift + Z: Redo (Mac style)
 * - Ctrl + Y: Redo (Windows style)
 * - Cmd/Ctrl + D: Duplicate selected widget/element
 * - Cmd/Ctrl + 0: Reset view
 * - Cmd/Ctrl + Plus/=: Zoom in
 * - Cmd/Ctrl + Minus: Zoom out
 * - Cmd/Ctrl + X: Cut selected widget/element
 * - Cmd/Ctrl + C: Copy selected widget/element
 * - Cmd/Ctrl + V: Paste from clipboard
 * - Cmd/Ctrl + ': Toggle grid snapping
 * - Cmd/Ctrl + K: Open command palette
 * - Arrow keys: Nudge selected widget/element (1px)
 * - Shift + Arrow keys: Nudge selected widget/element (10px)
 * - Shift + Plus/=: Scale widget up (10%)
 * - Shift + Minus: Scale widget down (10%)
 * - V, H, R, O, L, A, P, T: Switch tools
 */

export interface KeyboardShortcutsOptions {
  /** ActionRegistry instance for executing actions */
  actionRegistry: ActionRegistry
  /** Function to build current ActionContext */
  buildActionContext: (shiftKey?: boolean) => ActionContext
  /** Callback when Escape closes context menu (UI-local) */
  onContextMenuClose?: () => boolean // Returns true if menu was closed
  /** Callback when Escape cancels drawing (UI-local) */
  onDrawingCancel?: () => boolean // Returns true if drawing was canceled
  /** Callback for opening command palette (emitted to parent) */
  onCommandPalette?: () => void
  /** Callback for widget scale change (delta: +0.1 or -0.1) */
  onWidgetScaleChange?: (delta: number) => void
}

/**
 * Legacy options interface for backward compatibility.
 * @deprecated Use the ActionRegistry-based interface instead.
 */
export interface LegacyKeyboardShortcutsOptions {
  onEscape?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onResetView?: () => void
  onCommandPalette?: () => void
  onNudge?: (dx: number, dy: number) => void
  onToolSwitch?: (tool: ToolType) => void
}

function isLegacyOptions(
  options: KeyboardShortcutsOptions | LegacyKeyboardShortcutsOptions
): options is LegacyKeyboardShortcutsOptions {
  return !('actionRegistry' in options)
}

export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions | LegacyKeyboardShortcutsOptions
) {
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

  const hasCmdOrCtrl = (e: KeyboardEvent) => {
    return isMac() ? e.metaKey : e.ctrlKey
  }

  // Legacy handler for backward compatibility
  const handleKeyDownLegacy = (e: KeyboardEvent, opts: LegacyKeyboardShortcutsOptions) => {
    // Track space key for panning
    // Prevent default to avoid activating focused buttons (standard HTML behavior)
    if (e.code === 'Space' && !isInputElement(e.target)) {
      e.preventDefault()
      isSpacePressed.value = true
    }

    // Skip shortcuts when typing in inputs
    if (isInputElement(e.target)) return

    const key = e.key.toLowerCase()

    // Escape - clear selection
    if (key === 'escape') {
      e.preventDefault()
      opts.onEscape?.()
      return
    }

    // Delete / Backspace - remove selected widget
    if (key === 'delete' || key === 'backspace') {
      e.preventDefault()
      opts.onDelete?.()
      return
    }

    // Cmd/Ctrl + D - duplicate
    if (key === 'd' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      opts.onDuplicate?.()
      return
    }

    // Cmd/Ctrl + 0 - reset view
    if ((key === '0' || e.code === 'Digit0') && hasCmdOrCtrl(e)) {
      e.preventDefault()
      opts.onResetView?.()
      return
    }

    // Cmd/Ctrl + K - command palette
    if (key === 'k' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      opts.onCommandPalette?.()
      return
    }

    // Arrow keys - nudge widget
    const nudgeAmount = e.shiftKey ? 10 : 1
    if (key === 'arrowup') {
      e.preventDefault()
      opts.onNudge?.(0, -nudgeAmount)
      return
    }
    if (key === 'arrowdown') {
      e.preventDefault()
      opts.onNudge?.(0, nudgeAmount)
      return
    }
    if (key === 'arrowleft') {
      e.preventDefault()
      opts.onNudge?.(-nudgeAmount, 0)
      return
    }
    if (key === 'arrowright') {
      e.preventDefault()
      opts.onNudge?.(nudgeAmount, 0)
      return
    }

    // Tool shortcuts (V, H, R, O, L, A, P, T) - single key, no modifiers
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      const tool = KEY_TO_TOOL[key]
      if (tool) {
        e.preventDefault()
        opts.onToolSwitch?.(tool)
        return
      }
    }
  }

  // New handler using ActionRegistry
  const handleKeyDownWithRegistry = (e: KeyboardEvent, opts: KeyboardShortcutsOptions) => {
    // Track space key for panning
    // Prevent default to avoid activating focused buttons (standard HTML behavior)
    if (e.code === 'Space' && !isInputElement(e.target)) {
      e.preventDefault()
      isSpacePressed.value = true
    }

    // Skip shortcuts when typing in inputs
    if (isInputElement(e.target)) return

    const key = e.key.toLowerCase()
    const { actionRegistry, buildActionContext } = opts

    // Escape - try UI-local handlers first, then action
    if (key === 'escape') {
      e.preventDefault()
      // 1. Try closing context menu
      if (opts.onContextMenuClose?.()) return
      // 2. Try canceling drawing
      if (opts.onDrawingCancel?.()) return
      // 3. Fall through to action registry (clear selection)
      const ctx = buildActionContext()
      actionRegistry.execute('selection.clear', ctx)
      return
    }

    // Delete / Backspace - delete widget or element
    if (key === 'delete' || key === 'backspace') {
      e.preventDefault()
      const ctx = buildActionContext()
      if (ctx.selectedWidgetId) {
        actionRegistry.execute('widget.delete', ctx)
      } else if (ctx.selectedElementId) {
        actionRegistry.execute('element.delete', ctx)
      }
      return
    }

    // Cmd/Ctrl + D - duplicate widget or element
    if (key === 'd' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      const ctx = buildActionContext()
      if (ctx.selectedWidgetId) {
        actionRegistry.execute('widget.duplicate', ctx)
      } else if (ctx.selectedElementId) {
        actionRegistry.execute('element.duplicate', ctx)
      }
      return
    }

    // Cmd/Ctrl + 0 - reset view
    if ((key === '0' || e.code === 'Digit0') && hasCmdOrCtrl(e)) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('view.reset', ctx)
      return
    }

    // Cmd/Ctrl + ' - toggle grid snapping
    if ((key === "'" || e.code === 'Quote') && hasCmdOrCtrl(e)) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('view.toggle-grid', ctx)
      return
    }

    // Cmd/Ctrl + Shift + G - ungroup (must be before Cmd+G to check shift first)
    if (key === 'g' && hasCmdOrCtrl(e) && e.shiftKey) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('element.ungroup', ctx)
      return
    }

    // Cmd/Ctrl + G - group selected elements
    if (key === 'g' && hasCmdOrCtrl(e) && !e.shiftKey) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('element.group', ctx)
      return
    }

    // Cmd/Ctrl + K - command palette (UI-local, emitted to parent)
    if (key === 'k' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      opts.onCommandPalette?.()
      return
    }

    // Cmd/Ctrl + Z - Undo
    if (key === 'z' && hasCmdOrCtrl(e) && !e.shiftKey) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('board.undo', ctx)
      return
    }

    // Cmd/Ctrl + Shift + Z - Redo (Mac style)
    if (key === 'z' && hasCmdOrCtrl(e) && e.shiftKey) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('board.redo', ctx)
      return
    }

    // Ctrl + Y - Redo (Windows style)
    if (key === 'y' && e.ctrlKey && !isMac()) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('board.redo', ctx)
      return
    }

    // Cmd/Ctrl + Plus or = - Zoom in
    if (hasCmdOrCtrl(e) && (key === '+' || key === '=')) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('view.zoom-in', ctx)
      return
    }

    // Cmd/Ctrl + Minus - Zoom out
    if (hasCmdOrCtrl(e) && key === '-') {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('view.zoom-out', ctx)
      return
    }

    // Cmd/Ctrl + X - Cut
    if (key === 'x' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('edit.cut', ctx)
      return
    }

    // Cmd/Ctrl + C - Copy
    if (key === 'c' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('edit.copy', ctx)
      return
    }

    // Cmd/Ctrl + V - Paste
    if (key === 'v' && hasCmdOrCtrl(e)) {
      e.preventDefault()
      const ctx = buildActionContext()
      actionRegistry.execute('edit.paste', ctx)
      return
    }

    // Arrow keys - nudge widget or element
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault()
      const ctx = buildActionContext(e.shiftKey)

      // Determine direction
      const direction = key.replace('arrow', '') as 'up' | 'down' | 'left' | 'right'

      if (ctx.selectedWidgetId) {
        actionRegistry.execute(`widget.nudge.${direction}`, ctx)
      } else if (ctx.selectedElementId) {
        actionRegistry.execute(`element.nudge.${direction}`, ctx)
      }
      return
    }

    // Shift + Plus/Equal - scale widget up
    if (e.shiftKey && !hasCmdOrCtrl(e) && (key === '+' || key === '=')) {
      e.preventDefault()
      const ctx = buildActionContext()
      if (ctx.selectedWidgetId && opts.onWidgetScaleChange) {
        opts.onWidgetScaleChange(0.1)
      }
      return
    }

    // Shift + Minus - scale widget down
    if (e.shiftKey && !hasCmdOrCtrl(e) && key === '-') {
      e.preventDefault()
      const ctx = buildActionContext()
      if (ctx.selectedWidgetId && opts.onWidgetScaleChange) {
        opts.onWidgetScaleChange(-0.1)
      }
      return
    }

    // Tool shortcuts (V, H, R, O, L, A, P, T) - single key, no modifiers
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      const tool = KEY_TO_TOOL[key]
      if (tool) {
        e.preventDefault()
        const ctx = buildActionContext()
        actionRegistry.execute(`tool.${tool}`, ctx)
        return
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isLegacyOptions(options)) {
      handleKeyDownLegacy(e, options)
    } else {
      handleKeyDownWithRegistry(e, options)
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpacePressed.value = false
    }
  }

  // Use VueUse's useEventListener for automatic cleanup
  useEventListener(window, 'keydown', handleKeyDown)
  useEventListener(window, 'keyup', handleKeyUp)

  return {
    isSpacePressed,
  }
}
