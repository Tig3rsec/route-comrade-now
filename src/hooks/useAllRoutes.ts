import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RouteWithStops {
  id: string;
  name: string;
  description: string | null;
  stops: { id: string; name: string; lat: number; lng: number; stopOrder: number }[];
  path: [number, number][];
}

export function useAllRoutes() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStopName, setSelectedStopName] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    const { data: routesData } = await supabase.from('routes').select('*').order('name');
    if (!routesData) { setLoading(false); return; }

    const routeList: RouteWithStops[] = [];
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
        description: route.description,
        stops: (stops || []).map(s => ({
          id: s.id, name: s.name, lat: s.lat, lng: s.lng, stopOrder: s.stop_order,
        })),
        path: (paths || []).map(p => [p.lat, p.lng] as [number, number]),
      });
    }
    setRoutes(routeList);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchRoutes();
  }, [user, fetchRoutes]);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase();
    return routes.filter(
      r => r.name.toLowerCase().includes(q) ||
           r.stops.some(s => s.name.toLowerCase().includes(q))
    );
  }, [routes, searchQuery]);

  // Routes that pass through the selected stop
  const routesThroughStop = useMemo(() => {
    if (!selectedStopName) return [];
    const q = selectedStopName.toLowerCase();
    return routes.filter(r => r.stops.some(s => s.name.toLowerCase() === q));
  }, [routes, selectedStopName]);

  return {
    routes, filteredRoutes, loading, searchQuery, setSearchQuery,
    selectedStopName, setSelectedStopName, routesThroughStop,
  };
}
