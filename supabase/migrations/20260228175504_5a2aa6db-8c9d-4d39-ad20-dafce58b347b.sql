
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('driver', 'passenger');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Routes table
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Routes readable by all authenticated" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers can create routes" ON public.routes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'driver'));
CREATE POLICY "Drivers can update routes" ON public.routes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'driver'));

-- Stops table
CREATE TABLE public.stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  stop_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stops readable by all authenticated" ON public.stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers can manage stops" ON public.stops FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'driver'));

-- Route path points (polyline)
CREATE TABLE public.route_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  path_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.route_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Route paths readable" ON public.route_paths FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers can manage paths" ON public.route_paths FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'driver'));

-- Buses table
CREATE TABLE public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  type TEXT NOT NULL DEFAULT 'Standard',
  total_seats INT NOT NULL DEFAULT 40,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buses readable by all authenticated" ON public.buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers manage own buses" ON public.buses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'driver'));
CREATE POLICY "Drivers update own buses" ON public.buses FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Drivers delete own buses" ON public.buses FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON public.buses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trips readable by all authenticated" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers manage own trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id AND public.has_role(auth.uid(), 'driver'));
CREATE POLICY "Drivers update own trips" ON public.trips FOR UPDATE TO authenticated USING (auth.uid() = driver_id);

-- Bus positions (real-time GPS data)
CREATE TABLE public.bus_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  speed DOUBLE PRECISION NOT NULL DEFAULT 0,
  seats_available INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bus_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Positions readable by all authenticated" ON public.bus_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers insert positions" ON public.bus_positions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'driver'));

-- Enable realtime on bus_positions
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_positions;

-- Indexes for fast lookups
CREATE INDEX idx_bus_positions_bus_id ON public.bus_positions(bus_id, created_at DESC);
CREATE INDEX idx_bus_positions_trip_id ON public.bus_positions(trip_id, created_at DESC);
CREATE INDEX idx_stops_route_id ON public.stops(route_id, stop_order);
CREATE INDEX idx_route_paths_route_id ON public.route_paths(route_id, path_order);
