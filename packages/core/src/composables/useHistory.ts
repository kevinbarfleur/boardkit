import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { BoardkitDocument } from '../types/document'

/**
 * History Entry - represents a snapshot of the document at a point in time.
 */
export interface HistoryEntry {
  id: string
  label: string
  timestamp: number
  snapshot: BoardkitDocument
}

/**
 * History State - internal state of the history manager.
 */
interface HistoryState {
  /** Stack of history entries (most recent first) - stores state BEFORE each action */
  stack: HistoryEntry[]
  /** Current position in the stack (-1 = at live state, 0+ = at a historical state) */
  currentIndex: number
  /** Maximum number of entries to keep */
  maxSize: number
  /** Snapshot of the "live" document state before we started undoing */
  liveSnapshot: BoardkitDocument | null
}

/**
 * useHistory
 *
 * Manages undo/redo functionality with document snapshots.
 *
 * Design:
 * - Stack stores the state BEFORE each action
 * - liveSnapshot stores the current document state when we start undoing
 * - This allows full undo/redo navigation
 *
 * Stack semantics:
 * - stack[0] = state before most recent action
 * - stack[1] = state before second most recent action
 * - etc.
 *
 * Index semantics:
 * - currentIndex = -1: we're at the "live" state (after all actions)
 * - currentIndex = 0: we've undone the last action (viewing state before it)
 * - currentIndex = 1: we've undone 2 actions
 * - etc.
 *
 * Example flow:
 * 1. Initial: stack=[], index=-1, live=null
 * 2. User does A: pushState(beforeA) → stack=[beforeA], index=-1
 * 3. User does B: pushState(beforeB) → stack=[beforeB, beforeA], index=-1
 * 4. User does C: pushState(beforeC) → stack=[beforeC, beforeB, beforeA], index=-1
 * 5. User Undo: live=currentDoc, index=0, restore stack[0] (beforeC = afterB)
 * 6. User Undo: index=1, restore stack[1] (beforeB = afterA)
 * 7. User Redo: index=0, restore stack[0] (beforeC = afterB)
 * 8. User Redo: index=-1, restore live (afterC)
 * 9. User does D: clear live, truncate stack, push beforeD
 */
export function useHistory(options: { maxSize?: number } = {}) {
  const state = ref<HistoryState>({
    stack: [],
    currentIndex: -1,
    maxSize: options.maxSize ?? 50,
    liveSnapshot: null,
  })

  /**
   * Push a new state onto the history stack.
   * Call this BEFORE making a change to capture the "before" state.
   *
   * @param label - Human-readable description of the action (e.g., "Added widget")
   * @param document - The document state BEFORE the action
   */
  function pushState(label: string, document: BoardkitDocument): void {
    console.log('[History] pushState called:', {
      label,
      currentIndex: state.value.currentIndex,
      stackLength: state.value.stack.length,
      hasLiveSnapshot: !!state.value.liveSnapshot,
    })

    // If we're in the middle of the stack (user did some undos),
    // truncate the stack to discard "future" entries
    if (state.value.currentIndex >= 0) {
      console.log('[History] Truncating stack from index', state.value.currentIndex)
      state.value.stack = state.value.stack.slice(state.value.currentIndex)
      state.value.currentIndex = -1
    }

    // Clear the live snapshot since we're making a new action
    state.value.liveSnapshot = null

    // Add new entry at the beginning (most recent first)
    state.value.stack.unshift({
      id: nanoid(),
      label,
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(document)),
    })

    // Enforce max size
    if (state.value.stack.length > state.value.maxSize) {
      state.value.stack.pop()
    }

    console.log('[History] After push:', {
      stackLength: state.value.stack.length,
      currentIndex: state.value.currentIndex,
      labels: state.value.stack.slice(0, 5).map(e => e.label),
    })
  }

  /**
   * Undo the last action.
   * Returns the snapshot to restore, or null if cannot undo.
   *
   * @param currentDocument - The current document state (to save as liveSnapshot on first undo)
   */
  function undo(currentDocument?: BoardkitDocument): HistoryEntry | null {
    console.log('[History] undo called:', {
      canUndo: canUndo.value,
      currentIndex: state.value.currentIndex,
      stackLength: state.value.stack.length,
      hasLiveSnapshot: !!state.value.liveSnapshot,
      hasCurrentDocument: !!currentDocument,
    })

    if (!canUndo.value) {
      console.log('[History] Cannot undo - returning null')
      return null
    }

    // On first undo (from live state), save the current document
    if (state.value.currentIndex === -1 && currentDocument) {
      console.log('[History] Saving live snapshot (first undo)')
      state.value.liveSnapshot = JSON.parse(JSON.stringify(currentDocument))
    }

    // Move to the next older state
    state.value.currentIndex++
    const entry = state.value.stack[state.value.currentIndex]

    console.log('[History] After undo:', {
      newIndex: state.value.currentIndex,
      restoringLabel: entry?.label,
      canRedo: state.value.currentIndex > -1,
      hasLiveSnapshot: !!state.value.liveSnapshot,
    })

    return entry
  }

  /**
   * Redo a previously undone action.
   * Returns the snapshot to restore, or null if cannot redo.
   * Returns a special entry with the live snapshot when returning to live state.
   */
  function redo(): HistoryEntry | null {
    console.log('[History] redo called:', {
      canRedo: canRedo.value,
      currentIndex: state.value.currentIndex,
      stackLength: state.value.stack.length,
      hasLiveSnapshot: !!state.value.liveSnapshot,
    })

    if (!canRedo.value) {
      console.log('[History] Cannot redo - returning null')
      return null
    }

    // Move to the next newer state
    state.value.currentIndex--

    console.log('[History] After decrement:', {
      newIndex: state.value.currentIndex,
    })

    if (state.value.currentIndex === -1) {
      // We're back at live state - return the live snapshot
      console.log('[History] Back at live state, returning liveSnapshot:', !!state.value.liveSnapshot)
      if (state.value.liveSnapshot) {
        return {
          id: 'live',
          label: 'Current state',
          timestamp: Date.now(),
          snapshot: state.value.liveSnapshot,
        }
      }
      return null
    }

    // Return the entry at the new position
    const entry = state.value.stack[state.value.currentIndex]
    console.log('[History] Returning entry:', entry?.label)
    return entry
  }

  /**
   * Jump to a specific history entry by ID.
   * Returns the entry to restore, or null if not found.
   *
   * @param entryId - The ID of the entry to jump to
   * @param currentDocument - The current document state (to save as liveSnapshot if needed)
   */
  function goToEntry(entryId: string, currentDocument?: BoardkitDocument): HistoryEntry | null {
    console.log('[History] goToEntry called:', {
      entryId,
      currentIndex: state.value.currentIndex,
      hasCurrentDocument: !!currentDocument,
    })

    const entryIndex = state.value.stack.findIndex((e) => e.id === entryId)
    if (entryIndex === -1) {
      console.log('[History] Entry not found')
      return null
    }

    // If we're at live state, save it first
    if (state.value.currentIndex === -1 && currentDocument) {
      console.log('[History] Saving live snapshot before jumping')
      state.value.liveSnapshot = JSON.parse(JSON.stringify(currentDocument))
    }

    state.value.currentIndex = entryIndex
    console.log('[History] After goToEntry:', {
      newIndex: state.value.currentIndex,
      canRedo: state.value.currentIndex > -1,
      hasLiveSnapshot: !!state.value.liveSnapshot,
    })
    return state.value.stack[entryIndex]
  }

  /**
   * Return to the live state (most recent).
   * Returns the live snapshot to restore, or null if already at live.
   */
  function goToLive(): HistoryEntry | null {
    console.log('[History] goToLive called:', {
      currentIndex: state.value.currentIndex,
      hasLiveSnapshot: !!state.value.liveSnapshot,
    })

    if (state.value.currentIndex === -1) {
      console.log('[History] Already at live state')
      return null
    }

    state.value.currentIndex = -1

    if (state.value.liveSnapshot) {
      console.log('[History] Returning to live state with snapshot')
      return {
        id: 'live',
        label: 'Current state',
        timestamp: Date.now(),
        snapshot: state.value.liveSnapshot,
      }
    }
    console.log('[History] No live snapshot available')
    return null
  }

  /**
   * Check if we can undo (there are older states in the stack).
   * From index -1 (live), we go to index 0, so we need stack[0] to exist.
   * From index N, we go to index N+1, so we need stack[N+1] to exist.
   */
  const canUndo = computed(() => {
    return state.value.currentIndex + 1 < state.value.stack.length
  })

  /**
   * Check if we can redo (we've undone something).
   */
  const canRedo = computed(() => {
    return state.value.currentIndex > -1
  })

  /**
   * Get the label of the action that would be undone.
   */
  const undoLabel = computed(() => {
    const nextUndoIndex = state.value.currentIndex + 1
    if (nextUndoIndex >= state.value.stack.length) return null
    return state.value.stack[nextUndoIndex].label
  })

  /**
   * Get the label of the action that would be redone.
   */
  const redoLabel = computed(() => {
    if (state.value.currentIndex === -1) return null
    if (state.value.currentIndex === 0) return 'Current state'
    return state.value.stack[state.value.currentIndex - 1]?.label ?? null
  })

  /**
   * Get the full history stack (for debug/UI purposes).
   */
  const stack = computed(() => state.value.stack)

  /**
   * Get the current index (for debug/UI purposes).
   */
  const currentIndex = computed(() => state.value.currentIndex)

  /**
   * Check if we're at the live state.
   */
  const isAtLive = computed(() => state.value.currentIndex === -1)

  /**
   * Clear all history.
   */
  function clear(): void {
    state.value.stack = []
    state.value.currentIndex = -1
    state.value.liveSnapshot = null
  }

  return {
    pushState,
    undo,
    redo,
    goToEntry,
    goToLive,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    stack,
    currentIndex,
    isAtLive,
    clear,
  }
}

export type HistoryManager = ReturnType<typeof useHistory>
