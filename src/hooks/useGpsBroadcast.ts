import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActiveTrip {
  tripId: string;
  busId: string;
}

export function useGpsBroadcast() {
  const { user } = useAuth();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [seatsAvailable, setSeatsAvailable] = useState(40);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  // Check for existing active trip on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from('trips')
      .select('id, bus_id')
      .eq('driver_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setActiveTrip({ tripId: data.id, busId: data.bus_id });
        }
      });
  }, [user]);

  const startTrip = useCallback(
    async (busId: string, totalSeats: number) => {
      if (!user) return;
      setSeatsAvailable(totalSeats);

      const { data, error } = await supabase
        .from('trips')
        .insert({ bus_id: busId, driver_id: user.id, status: 'active' })
        .select()
        .single();

      if (error || !data) {
        setGpsError('Failed to start trip');
        return;
      }

      setActiveTrip({ tripId: data.id, busId });
    },
    [user]
  );

  const endTrip = useCallback(async () => {
    if (!activeTrip) return;
    await supabase
      .from('trips')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', activeTrip.tripId);
    setActiveTrip(null);
    setCurrentPosition(null);
    setGpsError(null);
  }, [activeTrip]);

  // Start GPS watching + broadcasting when trip is active
  useEffect(() => {
    if (!activeTrip) {
      // Cleanup
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPositionRef.current = pos;
        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );

    // Broadcast every 3 seconds
    const broadcast = async () => {
      const pos = lastPositionRef.current;
      if (!pos || !activeTrip) return;

      const heading = pos.coords.heading ?? 0;
      const speed = pos.coords.speed ? pos.coords.speed * 2.237 : 0; // m/s to mph

      await supabase.from('bus_positions').insert({
        bus_id: activeTrip.busId,
        trip_id: activeTrip.tripId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading,
        speed: Math.round(speed),
        seats_available: seatsAvailable,
      });
    };

    // Send immediately, then every 3s
    broadcast();
    intervalRef.current = setInterval(broadcast, 3000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTrip, seatsAvailable]);

  return {
    activeTrip,
    currentPosition,
    gpsError,
    seatsAvailable,
    setSeatsAvailable,
    startTrip,
    endTrip,
  };
}
