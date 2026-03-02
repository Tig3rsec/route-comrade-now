/**
 * Fetch real road-based route geometry from TomTom Routing API.
 * Caches results in-memory to avoid repeated API calls.
 */

const TOMTOM_API_KEY = 'ZIqVy8Z5Xe97tgcDulimtx3jMDEH9qRj';
const routeCache = new Map<string, [number, number][]>();

/**
 * Get road-based route between a series of waypoints using TomTom Routing API.
 * Returns an array of [lng, lat] coordinates for the route polyline.
 */
export async function fetchRoadRoute(
  stops: { lat: number; lng: number }[]
): Promise<[number, number][]> {
  if (stops.length < 2) return [];

  // Create cache key from stop coords
  const cacheKey = stops.map(s => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`).join('|');
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    // TomTom Routing API supports up to 150 waypoints
    // Format: lat1,lng1:lat2,lng2:...:latN,lngN
    const locations = stops.map(s => `${s.lat},${s.lng}`).join(':');
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${TOMTOM_API_KEY}&routeType=fastest&traffic=true&travelMode=bus`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn('TomTom routing API error:', response.status);
      return fallbackStraightLine(stops);
    }

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route?.legs) {
      return fallbackStraightLine(stops);
    }

    // Extract all points from all legs
    const coordinates: [number, number][] = [];
    for (const leg of route.legs) {
      for (const point of leg.points) {
        coordinates.push([point.longitude, point.latitude]);
      }
    }

    // Cache the result
    routeCache.set(cacheKey, coordinates);
    return coordinates;
  } catch (error) {
    console.warn('TomTom routing fetch error:', error);
    return fallbackStraightLine(stops);
  }
}

/**
 * Fallback to straight lines between stops when API fails
 */
function fallbackStraightLine(stops: { lat: number; lng: number }[]): [number, number][] {
  return stops.map(s => [s.lng, s.lat] as [number, number]);
}

/**
 * Get route summary (distance, duration, traffic delay) from TomTom
 */
export async function fetchRouteSummary(
  stops: { lat: number; lng: number }[]
): Promise<{
  lengthInMeters: number;
  travelTimeInSeconds: number;
  trafficDelayInSeconds: number;
} | null> {
  if (stops.length < 2) return null;

  try {
    const locations = stops.map(s => `${s.lat},${s.lng}`).join(':');
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${TOMTOM_API_KEY}&routeType=fastest&traffic=true&travelMode=bus`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const summary = data.routes?.[0]?.summary;
    if (!summary) return null;

    return {
      lengthInMeters: summary.lengthInMeters,
      travelTimeInSeconds: summary.travelTimeInSeconds,
      trafficDelayInSeconds: summary.trafficDelayInSeconds || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Clear the route cache (useful when refreshing)
 */
export function clearRouteCache() {
  routeCache.clear();
}
