import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Bus, BusRoute } from '@/lib/mockData';
import { calculateEtaMinutes, findCurrentStopIndex } from '@/lib/etaUtils';

const USER_LOCATION: [number, number] = [13.0827, 80.2707]; // Chennai, Tamil Nadu

export function usePassengerBuses() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveBuses = useCallback(async () => {
    const { data: trips } = await supabase
      .from('trips')
      .select('*, buses(*), profiles:driver_id(display_name)')
      .eq('status', 'active');

    if (!trips || trips.length === 0) {
      setBuses([]);
      setLoading(false);
      return;
    }

    const busList: Bus[] = [];

    for (const trip of trips) {
      const bus = trip.buses as any;
      if (!bus) continue;

      const { data: pos } = await supabase
        .from('bus_positions')
        .select('*')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pos) continue;

      let route: BusRoute = { id: 'unknown', name: 'Unknown Route', stops: [], path: [] };

      if (bus.route_id) {
        const { data: routeData } = await supabase
          .from('routes')
          .select('*')
          .eq('id', bus.route_id)
          .maybeSingle();

        if (routeData) {
          const { data: stops } = await supabase
            .from('stops')
            .select('*')
            .eq('route_id', routeData.id)
            .order('stop_order');

          const { data: paths } = await supabase
            .from('route_paths')
            .select('*')
            .eq('route_id', routeData.id)
            .order('path_order');

          route = {
            id: routeData.id,
            name: routeData.name,
            stops: (stops || []).map(s => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng })),
            path: (paths || []).map(p => [p.lat, p.lng] as [number, number]),
          };
        }
      }

      const driverName = (trip as any).profiles?.display_name || 'Driver';
      const speedKmh = (pos.speed || 0) * 1.60934; // mph to km/h
      const currentStopIndex = route.stops.length > 0
        ? findCurrentStopIndex(pos.lat, pos.lng, route.stops)
        : 0;

      const eta = route.path.length >= 2
        ? calculateEtaMinutes(pos.lat, pos.lng, USER_LOCATION[0], USER_LOCATION[1], route.path, speedKmh > 5 ? speedKmh : 25)
        : undefined;

      busList.push({
        id: bus.id,
        number: bus.number,
        route,
        color: bus.color,
        type: bus.type as Bus['type'],
        driver: driverName,
        seatsAvailable: pos.seats_available,
        totalSeats: bus.total_seats,
        currentPosition: [pos.lat, pos.lng],
        heading: pos.heading,
        speed: pos.speed,
        isActive: true,
        currentStopIndex,
        eta,
      });
    }

    setBuses(busList);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchActiveBuses();
  }, [user, fetchActiveBuses]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('passenger-bus-positions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bus_positions' }, () => fetchActiveBuses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => fetchActiveBuses())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchActiveBuses]);

  return { buses, loading, refetch: fetchActiveBuses };
}
