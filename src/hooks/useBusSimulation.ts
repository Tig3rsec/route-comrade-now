import { useState, useEffect, useCallback, useRef } from 'react';
import { Bus, initialBuses, interpolatePosition } from '@/lib/mockData';

export function useBusSimulation() {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const progressRef = useRef<Record<string, number>>({});

  // Initialize progress
  useEffect(() => {
    initialBuses.forEach((bus) => {
      progressRef.current[bus.id] = Math.random() * 0.3;
    });
  }, []);

  // Simulate bus movement every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses((prev) =>
        prev.map((bus) => {
          if (!bus.isActive) return bus;

          const currentProgress = progressRef.current[bus.id] || 0;
          const speed = 0.02 + Math.random() * 0.03; // Variable speed
          let newProgress = currentProgress + speed;

          // Loop back
          if (newProgress >= 1) newProgress = 0;
          progressRef.current[bus.id] = newProgress;

          const { position, heading } = interpolatePosition(
            bus.route.path,
            newProgress
          );

          // Simulate ETA changes
          const eta = Math.max(1, Math.round((1 - newProgress) * 15));
          const seatsChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;

          return {
            ...bus,
            currentPosition: position,
            heading,
            eta,
            seatsAvailable: Math.max(0, Math.min(bus.totalSeats, bus.seatsAvailable + seatsChange)),
            speed: 15 + Math.round(Math.random() * 25),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleBusActive = useCallback((busId: string) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, isActive: !b.isActive } : b))
    );
  }, []);

  const updateBusSeats = useCallback((busId: string, seats: number) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, seatsAvailable: seats } : b))
    );
  }, []);

  return { buses, toggleBusActive, updateBusSeats };
}
