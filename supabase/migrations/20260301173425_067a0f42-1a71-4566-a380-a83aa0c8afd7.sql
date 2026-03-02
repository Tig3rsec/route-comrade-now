
-- Allow drivers to delete stops (needed for route updates)
CREATE POLICY "Drivers can delete stops"
ON public.stops
FOR DELETE
USING (has_role(auth.uid(), 'driver'::app_role));

-- Allow drivers to update stops
CREATE POLICY "Drivers can update stops"
ON public.stops
FOR UPDATE
USING (has_role(auth.uid(), 'driver'::app_role));

-- Allow drivers to delete route paths (needed for route updates)
CREATE POLICY "Drivers can delete paths"
ON public.route_paths
FOR DELETE
USING (has_role(auth.uid(), 'driver'::app_role));

-- Allow drivers to update route paths
CREATE POLICY "Drivers can update paths"
ON public.route_paths
FOR UPDATE
USING (has_role(auth.uid(), 'driver'::app_role));

-- Allow drivers to delete routes
CREATE POLICY "Drivers can delete routes"
ON public.routes
FOR DELETE
USING (has_role(auth.uid(), 'driver'::app_role));
