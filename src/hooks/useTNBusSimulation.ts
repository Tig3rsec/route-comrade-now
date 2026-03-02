import { useState, useEffect, useRef, useCallback } from 'react';
import type { TNRoute } from '@/lib/tnBusData';

/**
 * Simulates a bus moving along a TNRoute's stops.
 * Returns an updated route with `busPosition` and `arrived` flags updated in real-time.
 * The bus advances ~1 stop every `intervalSeconds` (default 8s).
 */
export function useTNBusSimulation(route: TNRoute | null, intervalSeconds = 8) {
  const [simRoute, setSimRoute] = useState<TNRoute | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialStopRef = useRef<number>(0);
  const initialProgressRef = useRef<number>(0);

  useEffect(() => {
    if (!route) {
      setSimRoute(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // Reset simulation from route's initial position
    initialStopRef.current = route.busPosition.stopIndex;
    initialProgressRef.current = route.busPosition.progress;
    startTimeRef.current = performance.now();

    const totalStops = route.stops.length;
    const intervalMs = intervalSeconds * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;

      // Calculate how far we've moved since start
      // progress moves from 0 to 1 within each stop segment over intervalMs
      const totalProgressSinceStart = elapsed / intervalMs;
      const absoluteProgress = initialStopRef.current + initialProgressRef.current + totalProgressSinceStart;

      // Wrap around when reaching end
      const wrappedProgress = absoluteProgress % (totalStops - 1);
      const currentStopIndex = Math.floor(wrappedProgress);
      const progressInSegment = wrappedProgress - currentStopIndex;

      const clampedStopIndex = Math.min(currentStopIndex, totalStops - 2);

      // Update stops' arrived status
      const updatedStops = route.stops.map((stop, idx) => ({
        ...stop,
        arrived: idx <= clampedStopIndex,
      }));

      // Interpolate lat/lng between current and next stop
      const fromStop = route.stops[clampedStopIndex];
      const toStop = route.stops[Math.min(clampedStopIndex + 1, totalStops - 1)];
      const interpolatedLat = fromStop.lat + (toStop.lat - fromStop.lat) * progressInSegment;
      const interpolatedLng = fromStop.lng + (toStop.lng - fromStop.lng) * progressInSegment;

      setSimRoute({
        ...route,
        stops: updatedStops,
        busPosition: {
          stopIndex: clampedStopIndex,
          progress: progressInSegment,
        },
        // Store interpolated position for map use
        _simLat: interpolatedLat,
        _simLng: interpolatedLng,
      } as TNRoute & { _simLat: number; _simLng: number });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [route?.id, intervalSeconds]);

  return simRoute;
}
