/**
 * Orthogonal Router
 *
 * Calculates orthogonal (90° angles) paths between elements for connections.
 * Used for rendering connection arrows with clean, Manhattan-style routing.
 */

import type { Point } from '../types/element'

/**
 * Bounds of an element (position and dimensions).
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Side of an element where a connection can anchor.
 */
export type AnchorSide = 'top' | 'bottom' | 'left' | 'right'

/**
 * Result of anchor calculation.
 */
export interface AnchorResult {
  point: Point
  side: AnchorSide
}

/**
 * Calculate the center point of bounds.
 */
export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

/**
 * Get anchor point on a specific side of bounds.
 */
export function getAnchorOnSide(bounds: Bounds, side: AnchorSide): Point {
  const center = getBoundsCenter(bounds)

  switch (side) {
    case 'top':
      return { x: center.x, y: bounds.y }
    case 'bottom':
      return { x: center.x, y: bounds.y + bounds.height }
    case 'left':
      return { x: bounds.x, y: center.y }
    case 'right':
      return { x: bounds.x + bounds.width, y: center.y }
  }
}

/**
 * Calculate the optimal anchor point on source bounds to connect to a target point.
 * Chooses the side closest to the target.
 */
export function calculateOptimalAnchor(bounds: Bounds, targetPoint: Point): AnchorResult {
  const center = getBoundsCenter(bounds)
  const dx = targetPoint.x - center.x
  const dy = targetPoint.y - center.y

  // Choose the side based on which direction is dominant
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal direction is dominant
    const side: AnchorSide = dx > 0 ? 'right' : 'left'
    return {
      point: getAnchorOnSide(bounds, side),
      side,
    }
  } else {
    // Vertical direction is dominant
    const side: AnchorSide = dy > 0 ? 'bottom' : 'top'
    return {
      point: getAnchorOnSide(bounds, side),
      side,
    }
  }
}

/**
 * Build an orthogonal path between two points.
 * Creates a path with 1-2 bends (90° angles).
 *
 * @param start - Starting point
 * @param end - Ending point
 * @param startSide - Side the path exits from
 * @param endSide - Side the path enters from
 * @param margin - Minimum distance from elements before turning
 */
export function buildOrthogonalPath(
  start: Point,
  end: Point,
  startSide: AnchorSide,
  endSide: AnchorSide,
  margin: number = 20
): Point[] {
  // Simple case: straight line if aligned
  if (startSide === 'right' && endSide === 'left' && start.y === end.y) {
    return [start, end]
  }
  if (startSide === 'bottom' && endSide === 'top' && start.x === end.x) {
    return [start, end]
  }
  if (startSide === 'left' && endSide === 'right' && start.y === end.y) {
    return [start, end]
  }
  if (startSide === 'top' && endSide === 'bottom' && start.x === end.x) {
    return [start, end]
  }

  // Determine routing strategy based on relative positions and sides
  const isHorizontalStart = startSide === 'left' || startSide === 'right'
  const isHorizontalEnd = endSide === 'left' || endSide === 'right'

  // Calculate intermediate points
  if (isHorizontalStart && isHorizontalEnd) {
    // Both horizontal: use vertical middle segment
    const midX = (start.x + end.x) / 2
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]
  } else if (!isHorizontalStart && !isHorizontalEnd) {
    // Both vertical: use horizontal middle segment
    const midY = (start.y + end.y) / 2
    return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end]
  } else if (isHorizontalStart && !isHorizontalEnd) {
    // Start horizontal, end vertical: single bend
    return [start, { x: end.x, y: start.y }, end]
  } else {
    // Start vertical, end horizontal: single bend
    return [start, { x: start.x, y: end.y }, end]
  }
}

/**
 * Calculate the complete orthogonal path between two elements.
 * This is the main function to use for rendering connections.
 *
 * @param source - Bounds of the source element
 * @param target - Bounds of the target element
 * @param margin - Margin around elements for routing
 * @returns Array of points forming the orthogonal path
 */
export function calculateOrthogonalPath(
  source: Bounds,
  target: Bounds,
  margin: number = 20
): Point[] {
  const sourceCenter = getBoundsCenter(source)
  const targetCenter = getBoundsCenter(target)

  // Calculate optimal anchors based on relative positions
  const sourceAnchor = calculateOptimalAnchor(source, targetCenter)
  const targetAnchor = calculateOptimalAnchor(target, sourceCenter)

  // Build the path
  return buildOrthogonalPath(
    sourceAnchor.point,
    targetAnchor.point,
    sourceAnchor.side,
    targetAnchor.side,
    margin
  )
}

/**
 * Calculate path for a connection preview (target is just a point, not bounds).
 * Used during connection mode when dragging to a destination.
 *
 * @param source - Bounds of the source element
 * @param targetPoint - The target point (cursor position)
 * @param margin - Margin around elements for routing
 * @returns Array of points forming the orthogonal path
 */
export function calculatePreviewPath(
  source: Bounds,
  targetPoint: Point,
  margin: number = 20
): Point[] {
  // Calculate optimal anchor on source
  const sourceAnchor = calculateOptimalAnchor(source, targetPoint)

  // For preview, determine entry side based on direction from source anchor
  const dx = targetPoint.x - sourceAnchor.point.x
  const dy = targetPoint.y - sourceAnchor.point.y

  // Determine the "virtual" entry side for the target
  let endSide: AnchorSide
  if (sourceAnchor.side === 'left' || sourceAnchor.side === 'right') {
    // Exiting horizontally, so enter vertically if we need to turn
    endSide = dy >= 0 ? 'top' : 'bottom'
  } else {
    // Exiting vertically, so enter horizontally if we need to turn
    endSide = dx >= 0 ? 'left' : 'right'
  }

  // Build the path
  return buildOrthogonalPath(sourceAnchor.point, targetPoint, sourceAnchor.side, endSide, margin)
}

/**
 * Convert a path of points to an SVG path string.
 *
 * @param points - Array of points forming the path
 * @returns SVG path string (d attribute value)
 */
export function pathToSvgD(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  const [first, ...rest] = points
  const pathCommands = [`M ${first.x} ${first.y}`]

  for (const point of rest) {
    pathCommands.push(`L ${point.x} ${point.y}`)
  }

  return pathCommands.join(' ')
}

/**
 * Get the angle of the last segment of a path (for arrowhead rotation).
 *
 * @param points - Array of points forming the path
 * @returns Angle in degrees (0 = pointing right, 90 = pointing down)
 */
export function getEndAngle(points: Point[]): number {
  if (points.length < 2) return 0

  const lastPoint = points[points.length - 1]
  const prevPoint = points[points.length - 2]

  const dx = lastPoint.x - prevPoint.x
  const dy = lastPoint.y - prevPoint.y

  return Math.atan2(dy, dx) * (180 / Math.PI)
}

/**
 * Get the angle of the first segment of a path (for start arrowhead rotation).
 *
 * @param points - Array of points forming the path
 * @returns Angle in degrees (0 = pointing right, 90 = pointing down)
 */
export function getStartAngle(points: Point[]): number {
  if (points.length < 2) return 0

  const firstPoint = points[0]
  const nextPoint = points[1]

  const dx = nextPoint.x - firstPoint.x
  const dy = nextPoint.y - firstPoint.y

  return Math.atan2(dy, dx) * (180 / Math.PI)
}
