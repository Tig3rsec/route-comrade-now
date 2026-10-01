import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DriverBus {
  id: string;
  number: string;
  color: string;
  type: string;
  totalSeats: number;
  routeId: string | null;
  routeName: string | null;
  tnRouteId: string | null;
}

export interface RouteOption {
  id: string;
  name: string;
}

export function useDriverBuses() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<DriverBus[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = useCallback(async () => {
    const { data } = await supabase.from('routes').select('id, name');
    setRoutes(data || []);
  }, []);

  const fetchBuses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('buses')
      .select('*, routes(name)')
      .eq('owner_id', user.id);

    setBuses(
      (data || []).map((b: any) => ({
        id: b.id,
        number: b.number,
        color: b.color,
        type: b.type,
        totalSeats: b.total_seats,
        routeId: b.route_id,
        routeName: b.routes?.name || null,
        tnRouteId: b.tn_route_id || null,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRoutes();
      fetchBuses();
    }
  }, [user, fetchRoutes, fetchBuses]);

  const createBus = useCallback(
    async (data: { number: string; color: string; type: string; totalSeats: number; routeId: string | null; tnRouteId?: string | null }) => {
      if (!user) return null;
      const { data: bus, error } = await supabase
        .from('buses')
        .insert({
          number: data.number,
          color: data.color,
          type: data.type,
          total_seats: data.totalSeats,
          route_id: data.routeId,
          tn_route_id: data.tnRouteId ?? null,
          owner_id: user.id,
        })
        .select()
        .single();
      if (error) return { error };
      await fetchBuses();
      return { data: bus };
    },
    [user, fetchBuses]
  );

  const updateBus = useCallback(
    async (busId: string, data: { number: string; color: string; type: string; totalSeats: number; routeId: string | null; tnRouteId?: string | null }) => {
      const { error } = await supabase
        .from('buses')
        .update({
          number: data.number,
          color: data.color,
          type: data.type,
          total_seats: data.totalSeats,
          route_id: data.routeId,
          tn_route_id: data.tnRouteId ?? null,
        })
        .eq('id', busId);
      if (error) return { error };
      await fetchBuses();
      return { data: true };
    },
    [fetchBuses]
  );

  const deleteBus = useCallback(
    async (busId: string) => {
      const { error } = await supabase.from('buses').delete().eq('id', busId);
      if (error) return { error };
      await fetchBuses();
      return { data: true };
    },
    [fetchBuses]
  );

  return { buses, routes, loading, createBus, updateBus, deleteBus, refetch: fetchBuses };
}
