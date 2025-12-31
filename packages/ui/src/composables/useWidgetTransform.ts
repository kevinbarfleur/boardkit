import { inject, type InjectionKey } from 'vue'

/**
 * Widget transform context provided by WidgetFrame.
 * Contains zoom (canvas level) and scale (widget level) for proper positioning
 * of teleported elements like popovers.
 */
export interface WidgetTransform {
  zoom: number
  scale: number
  combinedScale: number
}

/**
 * Injection key for widget transform values.
 * Provided by WidgetFrame, consumed by teleported elements.
 */
export const WIDGET_TRANSFORM_KEY: InjectionKey<WidgetTransform> = Symbol('widget-transform')

/**
 * Default transform values when not inside a WidgetFrame.
 */
const DEFAULT_TRANSFORM: WidgetTransform = {
  zoom: 1,
  scale: 1,
  combinedScale: 1,
}

/**
 * Composable to access widget transform values (zoom * scale).
 * Used by teleported elements (like popovers) to match the widget's scale.
 *
 * @returns Widget transform object with zoom, scale, and combinedScale
 */
export function useWidgetTransform(): WidgetTransform {
  return inject(WIDGET_TRANSFORM_KEY, DEFAULT_TRANSFORM)
}
