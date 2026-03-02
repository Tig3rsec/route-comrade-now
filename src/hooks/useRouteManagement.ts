import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ManagedStop {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  stopOrder: number;
}

export interface ManagedRoute {
  id: string;
  name: string;
  description: string;
  stops: ManagedStop[];
  path: [number, number][];
}

export function useRouteManagement() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<ManagedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = useCallback(async () => {
    const { data: routesData } = await supabase.from('routes').select('*');
    if (!routesData) { setLoading(false); return; }

    const list: ManagedRoute[] = [];
    for (const r of routesData) {
      const { data: stops } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', r.id)
        .order('stop_order');

      const { data: paths } = await supabase
        .from('route_paths')
        .select('*')
        .eq('route_id', r.id)
        .order('path_order');

      list.push({
        id: r.id,
        name: r.name,
        description: r.description || '',
        stops: (stops || []).map(s => ({
          id: s.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          stopOrder: s.stop_order,
        })),
        path: (paths || []).map(p => [p.lat, p.lng] as [number, number]),
      });
    }
    setRoutes(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchRoutes();
  }, [user, fetchRoutes]);

  const createRoute = useCallback(async (
    name: string,
    description: string,
    stops: Omit<ManagedStop, 'id'>[],
    path: [number, number][]
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data: route, error } = await supabase
      .from('routes')
      .insert({ name, description })
      .select()
      .single();

    if (error || !route) return { error };

    // Insert stops
    if (stops.length > 0) {
      const { error: stopsError } = await supabase.from('stops').insert(
        stops.map((s, i) => ({
          route_id: route.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          stop_order: i,
        }))
      );
      if (stopsError) return { error: stopsError };
    }

    // Insert path points
    if (path.length > 0) {
      const { error: pathError } = await supabase.from('route_paths').insert(
        path.map((p, i) => ({
          route_id: route.id,
          lat: p[0],
          lng: p[1],
          path_order: i,
        }))
      );
      if (pathError) return { error: pathError };
    }

    await fetchRoutes();
    return { data: route };
  }, [user, fetchRoutes]);

  const updateRoute = useCallback(async (
    routeId: string,
    name: string,
    description: string,
    stops: Omit<ManagedStop, 'id'>[],
    path: [number, number][]
  ) => {
    const { error } = await supabase
      .from('routes')
      .update({ name, description })
      .eq('id', routeId);
    if (error) return { error };

    // Delete old stops and paths, then re-insert
    await supabase.from('stops').delete().eq('route_id', routeId);
    await supabase.from('route_paths').delete().eq('route_id', routeId);

    if (stops.length > 0) {
      await supabase.from('stops').insert(
        stops.map((s, i) => ({
          route_id: routeId,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          stop_order: i,
        }))
      );
    }

    if (path.length > 0) {
      await supabase.from('route_paths').insert(
        path.map((p, i) => ({
          route_id: routeId,
          lat: p[0],
          lng: p[1],
          path_order: i,
        }))
      );
    }

    await fetchRoutes();
    return { data: true };
  }, [fetchRoutes]);

  return { routes, loading, createRoute, updateRoute, refetch: fetchRoutes };
}
