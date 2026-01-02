import type { CanvasElement, ShapeElement, AnchorPosition, Point } from '../types/element'

/**
 * Anchor Points Utilities
 *
 * Helper functions for computing and managing anchor points on shapes
 * for arrow binding functionality.
 */

/**
 * Get all anchor points for a shape element.
 * Returns anchor positions in canvas coordinates.
 */
export function getShapeAnchorPoints(element: CanvasElement): Map<AnchorPosition, Point> {
  const { x, y, width, height } = element.rect
  const centerX = x + width / 2
  const centerY = y + height / 2

  const anchors = new Map<AnchorPosition, Point>()

  anchors.set('top', { x: centerX, y })
  anchors.set('bottom', { x: centerX, y: y + height })
  anchors.set('left', { x, y: centerY })
  anchors.set('right', { x: x + width, y: centerY })
  anchors.set('center', { x: centerX, y: centerY })

  return anchors
}

/**
 * Find the nearest anchor point to a given position.
 * Returns the anchor position and its coordinates, or null if none within threshold.
 *
 * @param point - The point to find nearest anchor to
 * @param element - The element to check anchors on
 * @param threshold - Maximum distance to consider (in canvas units)
 */
export function findNearestAnchor(
  point: Point,
  element: CanvasElement,
  threshold: number = 20
): { anchor: AnchorPosition; point: Point; distance: number } | null {
  const anchors = getShapeAnchorPoints(element)
  let nearest: { anchor: AnchorPosition; point: Point; distance: number } | null = null

  for (const [anchor, anchorPoint] of anchors) {
    const dx = point.x - anchorPoint.x
    const dy = point.y - anchorPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= threshold) {
      if (!nearest || distance < nearest.distance) {
        nearest = { anchor, point: anchorPoint, distance }
      }
    }
  }

  return nearest
}

/**
 * Get the anchor point position for a specific anchor on an element.
 */
export function getAnchorPoint(element: CanvasElement, anchor: AnchorPosition): Point {
  const anchors = getShapeAnchorPoints(element)
  return anchors.get(anchor) ?? { x: element.rect.x, y: element.rect.y }
}

/**
 * Find the nearest shape element to a point and its closest anchor.
 * Useful for determining binding targets during arrow drag.
 *
 * @param point - The point to check
 * @param elements - All elements to check against
 * @param excludeIds - Element IDs to exclude (e.g., the arrow being dragged)
 * @param threshold - Maximum distance to consider
 */
export function findNearestShapeAndAnchor(
  point: Point,
  elements: CanvasElement[],
  excludeIds: string[] = [],
  threshold: number = 20
): { elementId: string; anchor: AnchorPosition; point: Point; distance: number } | null {
  let nearest: { elementId: string; anchor: AnchorPosition; point: Point; distance: number } | null = null

  // Only check shape elements (rectangle, ellipse)
  const shapes = elements.filter(el =>
    (el.type === 'rectangle' || el.type === 'ellipse') &&
    !excludeIds.includes(el.id)
  )

  for (const shape of shapes) {
    const anchorResult = findNearestAnchor(point, shape, threshold)
    if (anchorResult) {
      if (!nearest || anchorResult.distance < nearest.distance) {
        nearest = {
          elementId: shape.id,
          anchor: anchorResult.anchor,
          point: anchorResult.point,
          distance: anchorResult.distance,
        }
      }
    }
  }

  return nearest
}

/**
 * Calculate the appropriate anchor for auto-binding based on arrow direction.
 * This is used when dragging an arrow endpoint near a shape.
 */
export function calculateAutoAnchor(
  arrowPoint: Point,
  shapeCenter: Point
): AnchorPosition {
  const dx = arrowPoint.x - shapeCenter.x
  const dy = arrowPoint.y - shapeCenter.y

  // Determine which edge the arrow is closest to
  if (Math.abs(dx) > Math.abs(dy)) {
    // More horizontal - use left or right
    return dx < 0 ? 'right' : 'left'
  } else {
    // More vertical - use top or bottom
    return dy < 0 ? 'bottom' : 'top'
  }
}
