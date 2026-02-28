/**
 * Interpolates between two coordinates based on a fraction (0-1)
 */
export function interpolate(
  start: [number, number],
  end: [number, number],
  fraction: number
): [number, number] {
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ];
}

/**
 * Calculates the total distance of a polyline in some unit (pseudo distance)
 */
export function getPolylineLength(points: [number, number][]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    length += Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
  }
  return length;
}

/**
 * Gets the point on a polyline at a specific distance from the start
 */
export function getPointAtDistance(
  points: [number, number][],
  targetDistance: number
): [number, number] {
  let accumulatedDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDistance = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    
    if (accumulatedDistance + segmentDistance >= targetDistance) {
      const remainingDistance = targetDistance - accumulatedDistance;
      const fraction = remainingDistance / segmentDistance;
      return interpolate(p1, p2, fraction);
    }
    accumulatedDistance += segmentDistance;
  }
  return points[points.length - 1];
}
