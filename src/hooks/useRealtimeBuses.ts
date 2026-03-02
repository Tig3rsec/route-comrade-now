import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BusPosition {
  busId: string;
  busNumber: string;
  busColor: string;
  busType: string;
  routeName: string;
  routeId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  seatsAvailable: number;
  totalSeats: number;
  tripId: string;
  driverName: string;
  isActive: boolean;
}

interface RouteData {
  id: string;
  name: string;
  stops: { id: string; name: string; lat: number; lng: number; stop_order: number }[];
  path: [number, number][];
}

export function useRealtimeBuses() {
  const [busPositions, setBusPositions] = useState<BusPosition[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch routes with stops and paths
  const fetchRoutes = useCallback(async () => {
    const { data: routesData } = await supabase.from('routes').select('*');
    if (!routesData) return;

    const routeList: RouteData[] = [];
    for (const route of routesData) {
      const { data: stops } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', route.id)
        .order('stop_order');

      const { data: paths } = await supabase
        .from('route_paths')
        .select('*')
        .eq('route_id', route.id)
        .order('path_order');

      routeList.push({
        id: route.id,
        name: route.name,
        stops: stops || [],
        path: (paths || []).map((p) => [p.lat, p.lng] as [number, number]),
      });
    }
    setRoutes(routeList);
  }, []);

  // Fetch active bus positions
  const fetchBusPositions = useCallback(async () => {
    // Get active trips
    const { data: trips } = await supabase
      .from('trips')
      .select('*, buses(*), profiles:driver_id(display_name)')
      .eq('status', 'active');

    if (!trips || trips.length === 0) {
      setBusPositions([]);
      setLoading(false);
      return;
    }

    const positions: BusPosition[] = [];

    for (const trip of trips) {
      const bus = trip.buses as any;
      if (!bus) continue;

      // Get latest position
      const { data: pos } = await supabase
        .from('bus_positions')
        .select('*')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const route = routes.find((r) => r.id === bus.route_id);

      positions.push({
        busId: bus.id,
        busNumber: bus.number,
        busColor: bus.color,
        busType: bus.type,
        routeName: route?.name || 'Unknown',
        routeId: bus.route_id || '',
        lat: pos?.lat || 0,
        lng: pos?.lng || 0,
        heading: pos?.heading || 0,
        speed: pos?.speed || 0,
        seatsAvailable: pos?.seats_available || 0,
        totalSeats: bus.total_seats,
        tripId: trip.id,
        driverName: (trip as any).profiles?.display_name || 'Driver',
        isActive: true,
      });
    }

    setBusPositions(positions);
    setLoading(false);
  }, [routes]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRoutes();
    }
  }, [user, fetchRoutes]);

  useEffect(() => {
    if (user && routes.length >= 0) {
      fetchBusPositions();
    }
  }, [user, routes, fetchBusPositions]);

  // Realtime subscription for new positions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bus-positions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_positions',
        },
        () => {
          // Refetch positions on new insert
          fetchBusPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBusPositions]);

  return { busPositions, routes, loading, refetch: fetchBusPositions };
}

// Hook for drivers to broadcast GPS
export function useDriverBroadcast() {
  const { user } = useAuth();

  const broadcastPosition = useCallback(
    async (tripId: string, busId: string, lat: number, lng: number, heading: number, speed: number, seatsAvailable: number) => {
      if (!user) return;

      await supabase.from('bus_positions').insert({
        bus_id: busId,
        trip_id: tripId,
        lat,
        lng,
        heading,
        speed,
        seats_available: seatsAvailable,
      });
    },
    [user]
  );

  const startTrip = useCallback(
    async (busId: string) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('trips')
        .insert({
          bus_id: busId,
          driver_id: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) return null;
      return data;
    },
    [user]
  );

  const endTrip = useCallback(
    async (tripId: string) => {
      await supabase
        .from('trips')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', tripId);
    },
    []
  );

  return { broadcastPosition, startTrip, endTrip };
}
