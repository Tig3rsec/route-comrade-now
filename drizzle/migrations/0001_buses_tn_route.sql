ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS tn_route_id text;
CREATE INDEX IF NOT EXISTS buses_tn_route_idx ON public.buses(tn_route_id);
CREATE INDEX IF NOT EXISTS bus_positions_trip_created_idx ON public.bus_positions(trip_id, created_at DESC);