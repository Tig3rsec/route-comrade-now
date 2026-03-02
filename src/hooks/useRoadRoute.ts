import { useState, useEffect, useRef } from 'react';
import { fetchRoadRoute } from '@/lib/tomtomRouting';
import type { TNRoute } from '@/lib/tnBusData';

/**
 * Hook that fetches real road geometry for a TN route using TomTom Routing API.
 * Returns [lng, lat] coordinates for the road-based polyline.
 */
export function useRoadRoute(route: TNRoute | null) {
  const [roadCoords, setRoadCoords] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);
  const lastRouteId = useRef<string | null>(null);

  useEffect(() => {
    if (!route) {
      setRoadCoords(null);
      lastRouteId.current = null;
      return;
    }

    // Don't refetch for same route
    if (lastRouteId.current === route.id && roadCoords) return;

    lastRouteId.current = route.id;
    setLoading(true);

    fetchRoadRoute(route.stops.map(s => ({ lat: s.lat, lng: s.lng })))
      .then(coords => {
        if (lastRouteId.current === route.id) {
          setRoadCoords(coords);
        }
      })
      .finally(() => setLoading(false));
  }, [route?.id]);

  return { roadCoords, loading };
}
