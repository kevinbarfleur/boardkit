import { computed, type Ref } from 'vue'
import {
  useWindowSize,
  useElementBounding,
  useMouse,
  useResizeObserver,
  useDocumentVisibility,
} from '@vueuse/core'

/**
 * Canvas size utilities using VueUse's useWindowSize
 * Provides reactive window dimensions and computed canvas height
 */
export function useCanvasSize() {
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  // Account for toolbar height (56px = h-14)
  const canvasHeight = computed(() => windowHeight.value - 56)

  return {
    windowWidth,
    windowHeight,
    canvasHeight,
  }
}

/**
 * Element size and position tracking using VueUse's useElementBounding
 * Useful for overlay positioning and element sizing
 */
export function useElementSize(target: Ref<HTMLElement | null>) {
  const { width, height, top, left, right, bottom, x, y } = useElementBounding(target)

  return {
    width,
    height,
    top,
    left,
    right,
    bottom,
    x,
    y,
  }
}

/**
 * Mouse position tracking using VueUse's useMouse
 * Useful for canvas interactions and pointer tracking
 */
export function useCanvasMouse() {
  const { x, y, sourceType } = useMouse()

  return {
    mouseX: x,
    mouseY: y,
    inputType: sourceType,
  }
}

/**
 * Resize observer for element size changes
 * Useful for responsive canvas elements
 */
export function useElementResize(
  target: Ref<HTMLElement | null>,
  callback: (contentRect: DOMRectReadOnly) => void
) {
  useResizeObserver(target, (entries) => {
    if (entries[0]) {
      callback(entries[0].contentRect)
    }
  })
}

/**
 * Document visibility tracking
 * Useful for pausing animations or autosave when tab is hidden
 */
export function useVisibility() {
  const visibility = useDocumentVisibility()

  const isVisible = computed(() => visibility.value === 'visible')

  return {
    visibility,
    isVisible,
  }
}
