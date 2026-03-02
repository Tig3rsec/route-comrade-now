/**
 * Utility functions for ETA calculation based on route path distance.
 */

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Total path distance in km from a series of [lat, lng] points */
export function pathDistanceKm(path: [number, number][]): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    d += haversineKm(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1]);
  }
  return d;
}

/** Find closest point index on a path to a given position */
export function closestPointOnPath(
  path: [number, number][],
  lat: number,
  lng: number
): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(lat, lng, path[i][0], path[i][1]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

/**
 * Calculate ETA in minutes from the bus's current position to user location
 * along the route path. Uses average speed (default 25 km/h for city buses).
 */
export function calculateEtaMinutes(
  busLat: number,
  busLng: number,
  userLat: number,
  userLng: number,
  path: [number, number][],
  speedKmh: number = 25
): number {
  if (path.length < 2) {
    // Straight line fallback
    const dist = haversineKm(busLat, busLng, userLat, userLng);
    return Math.round((dist / speedKmh) * 60);
  }

  const busIdx = closestPointOnPath(path, busLat, busLng);
  const userIdx = closestPointOnPath(path, userLat, userLng);

  // Calculate distance along path from bus to user
  const start = Math.min(busIdx, userIdx);
  const end = Math.max(busIdx, userIdx);

  let dist = 0;
  // Add distance from bus to its closest path point
  dist += haversineKm(busLat, busLng, path[busIdx][0], path[busIdx][1]);

  for (let i = start; i < end; i++) {
    dist += haversineKm(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
  }

  // Add distance from last path point to user
  dist += haversineKm(path[userIdx][0], path[userIdx][1], userLat, userLng);

  const avgSpeed = speedKmh > 0 ? speedKmh : 25;
  return Math.max(1, Math.round((dist / avgSpeed) * 60));
}

/**
 * Find the closest stop index to a bus position
 */
export function findCurrentStopIndex(
  busLat: number,
  busLng: number,
  stops: { lat: number; lng: number }[]
): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < stops.length; i++) {
    const d = haversineKm(busLat, busLng, stops[i].lat, stops[i].lng);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}
