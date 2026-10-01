import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveBus {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: number;
}

const bearing = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  ((Math.atan2((b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 180) / Math.PI + 360) % 360;

/**
 * Follows the real GPS of a driver currently running the given TN route.
 * Positions are smoothly interpolated between updates (~3s) so the bus glides.
 */
export function useLiveTNBus(tnRouteId: string | null) {
  const [live, setLive] = useState<LiveBus | null>(null);
  const fromRef = useRef<LiveBus | null>(null);
  const toRef = useRef<LiveBus | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setLive(null);
    fromRef.current = toRef.current = null;
    if (!tnRouteId) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const push = (p: { lat: number; lng: number; heading: number; speed: number; created_at: string }) => {
      const prev = toRef.current;
      let heading = p.heading;
      if (prev && (Math.abs(prev.lat - p.lat) > 1e-5 || Math.abs(prev.lng - p.lng) > 1e-5)) heading = bearing(prev, p);
      else if (prev && !heading) heading = prev.heading;
      const next: LiveBus = { lat: p.lat, lng: p.lng, heading, speed: p.speed, updatedAt: new Date(p.created_at).getTime() };
      fromRef.current = live_current() || next;
      toRef.current = next;
      startRef.current = performance.now();
    };
    const live_current = () => currentRef.current;

    (async () => {
      const { data: buses } = await supabase.from('buses').select('id').eq('tn_route_id', tnRouteId);
      const busIds = (buses || []).map((b) => b.id);
      if (!busIds.length || cancelled) return;
      const { data: trips } = await supabase
        .from('trips').select('id').in('bus_id', busIds).eq('status', 'active')
        .order('started_at', { ascending: false }).limit(1);
      const trip = trips?.[0];
      if (!trip || cancelled) return;
      const { data: pos } = await supabase
        .from('bus_positions').select('*').eq('trip_id', trip.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (pos && !cancelled) push(pos);
      channel = supabase
        .channel(`live-tn-${tnRouteId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bus_positions', filter: `trip_id=eq.${trip.id}` },
          (payload) => push(payload.new as any))
        .subscribe();
    })();

    const tick = (now: number) => {
      const a = fromRef.current, b = toRef.current;
      if (a && b) {
        const t = Math.min(1, (now - startRef.current) / 3000);
        let dh = ((b.heading - a.heading + 540) % 360) - 180;
        const cur: LiveBus = {
          lat: a.lat + (b.lat - a.lat) * t,
          lng: a.lng + (b.lng - a.lng) * t,
          heading: (a.heading + dh * t + 360) % 360,
          speed: b.speed,
          updatedAt: b.updatedAt,
        };
        currentRef.current = cur;
        setLive(cur);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [tnRouteId]);

  const currentRef = useRef<LiveBus | null>(null);
  return live;
}
