import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePassengerBuses } from '@/hooks/usePassengerBuses';
import { useAllRoutes } from '@/hooks/useAllRoutes';
import { useUserLocation } from '@/hooks/useUserLocation';
import BusMap from '@/components/BusMap';
import BusInfoPanel from '@/components/BusInfoPanel';
import BusNotifications from '@/components/BusNotifications';
import JourneyPlanner from '@/components/JourneyPlanner';
import RouteDetailSheet from '@/components/RouteDetailSheet';
import DriverDashboard from '@/components/DriverDashboard';
import { Bus } from '@/lib/mockData';
import { type TNRoute, type TNRouteStop, tnRoutes } from '@/lib/tnBusData';
import { useTNBusSimulation } from '@/hooks/useTNBusSimulation';
import { useLiveTNBus } from '@/hooks/useLiveTNBus';
import { useRoadRoute } from '@/hooks/useRoadRoute';
import { haversineKm } from '@/lib/etaUtils';
import { motion } from 'framer-motion';
import { MapPin, Bus as BusIcon, LogOut, LocateFixed } from 'lucide-react';
import QuickActions from '@/components/QuickActions';
import type { MapStyleId } from '@/components/MapStyleSwitcher';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type AppMode = 'select' | 'passenger' | 'driver';

const Index = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AppMode>('select');

  const { buses, loading: busesLoading } = usePassengerBuses();
  const { location: userLocation } = useUserLocation();
  const {
    filteredRoutes, searchQuery, setSearchQuery,
    selectedStopName, setSelectedStopName, routesThroughStop,
  } = useAllRoutes();
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleId>('night');

  // Journey planner state
  const [journeyFrom, setJourneyFrom] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [journeyTo, setJourneyTo] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // TN Route system
  const [selectedTNRoute, setSelectedTNRoute] = useState<TNRoute | null>(null);
  const [trackedTNRoute, setTrackedTNRoute] = useState<TNRoute | null>(null);
  const simulatedRoute = useTNBusSimulation(selectedTNRoute || trackedTNRoute, 8);
  const { roadCoords } = useRoadRoute(trackedTNRoute || selectedTNRoute);
  const liveBus = useLiveTNBus((trackedTNRoute || selectedTNRoute)?.id || null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (role === 'driver') setMode('driver');
    else if (role === 'passenger') setMode('passenger');
  }, [role]);

  const syncedSelectedBus = selectedBus
    ? buses.find((b) => b.id === selectedBus.id) || null
    : null;

  const userLocationTuple: [number, number] | undefined = userLocation
    ? [userLocation.lat, userLocation.lng]
    : undefined;

  // Get simulated TN bus position
  const tnBusPosition = simulatedRoute
    ? { lat: (simulatedRoute as any)._simLat, lng: (simulatedRoute as any)._simLng }
    : null;

  // When a driver is broadcasting, derive the stop progress from real GPS
  const displayRoute = (() => {
    if (!simulatedRoute || !liveBus) return simulatedRoute;
    let best = 0, bd = Infinity;
    simulatedRoute.stops.forEach((s, i) => {
      const d = haversineKm(liveBus.lat, liveBus.lng, s.lat, s.lng);
      if (d < bd) { bd = d; best = i; }
    });
    return {
      ...simulatedRoute,
      busPosition: { stopIndex: best, progress: 0 },
      stops: simulatedRoute.stops.map((s, i) => ({ ...s, arrived: i <= best })),
    };
  })();

  // Fetch AI suggestion
  const fetchAiSuggestion = useCallback(async (route: TNRoute) => {
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke('bus-ai-suggest', {
        body: {
          routeName: route.name,
          routeNumber: route.routeNumber,
          from: route.from,
          to: route.to,
          stops: route.stops.map(s => ({ name: s.name, trafficCondition: s.trafficCondition })),
          totalDistance: route.totalDistance,
          totalTime: route.totalTime,
          type: route.type,
        },
      });
      if (error) throw error;
      setAiSuggestion(data?.suggestion || null);
    } catch (err) {
      console.error('AI suggestion error:', err);
      setAiSuggestion(null);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const handleSelectTNRoute = useCallback((route: TNRoute) => {
    setSelectedTNRoute(route);
    setTrackedTNRoute(null);
    setSelectedBus(null);
    setSelectedRouteId(null);
    setSelectedStopName(null);
    const midStop = route.stops[Math.floor(route.stops.length / 2)];
    if (midStop) {
      setMapFlyTo({ lat: midStop.lat, lng: midStop.lng, zoom: route.type === 'local' ? 13 : 8 });
    }
    fetchAiSuggestion(route);
  }, [setSelectedStopName, fetchAiSuggestion]);

  const handleTrackTNRoute = useCallback((route: TNRoute) => {
    setTrackedTNRoute(route);
    setSelectedTNRoute(route); // Also show the detail sheet
    setSelectedBus(null);
    setSelectedRouteId(null);
    setSelectedStopName(null);
    // Fly to first stop
    if (route.stops.length > 0) {
      setMapFlyTo({
        lat: route.stops[0].lat,
        lng: route.stops[0].lng,
        zoom: route.type === 'local' ? 13 : 8,
      });
    }
    fetchAiSuggestion(route);
  }, [setSelectedStopName, fetchAiSuggestion]);

  const handleSelectTNStop = useCallback((stop: TNRouteStop) => {
    setMapFlyTo({ lat: stop.lat, lng: stop.lng, zoom: 15 });
  }, []);

  const handleCloseTNRoute = useCallback(() => {
    setSelectedTNRoute(null);
    setTrackedTNRoute(null);
    setAiSuggestion(null);
  }, []);

  const handleSelectRoute = useCallback((route: { id: string; path: [number, number][] }) => {
    setSelectedRouteId(route.id);
    setSelectedBus(null);
    setSelectedStopName(null);
    setSelectedTNRoute(null);
    setTrackedTNRoute(null);
    if (route.path.length > 0) {
      const mid = route.path[Math.floor(route.path.length / 2)];
      setMapFlyTo({ lat: mid[0], lng: mid[1], zoom: 8 });
    }
  }, [setSelectedStopName]);

  const handleSetMapLocation = useCallback((lat: number, lng: number, zoom: number) => {
    setMapFlyTo({ lat, lng, zoom });
  }, []);

  const handleCenterOnUser = useCallback(() => {
    if (userLocation) {
      setMapFlyTo({ lat: userLocation.lat, lng: userLocation.lng, zoom: 14 });
    }
  }, [userLocation]);

  // One-tap nearest bus tracking
  const handleNearestBus = useCallback(() => {
    if (!userLocation) return;
    
    // Find closest TN route based on user location
    let bestRoute: TNRoute | null = null;
    let bestDist = Infinity;
    
    for (const route of tnRoutes) {
      for (const stop of route.stops) {
        const dist = haversineKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
        if (dist < bestDist) {
          bestDist = dist;
          bestRoute = route;
        }
      }
    }
    
    if (bestRoute) {
      handleTrackTNRoute(bestRoute);
    }
  }, [userLocation, handleTrackTNRoute]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (mode === 'driver') return <DriverDashboard onBack={() => setMode('passenger')} />;

  const highlightedRouteIds = routesThroughStop.map(r => r.id);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <BusMap
        buses={buses}
        selectedBus={syncedSelectedBus}
        onSelectBus={setSelectedBus}
        userLocation={userLocationTuple}
        routes={filteredRoutes}
        selectedRouteId={selectedRouteId}
        highlightedRouteIds={highlightedRouteIds}
        highlightedStopName={selectedStopName}
        flyTo={mapFlyTo}
        onFlyToDone={() => setMapFlyTo(null)}
        journeyFrom={journeyFrom}
        journeyTo={journeyTo}
        trackedTNRoute={trackedTNRoute}
        tnBusPosition={tnBusPosition}
        tnSim={trackedTNRoute && simulatedRoute ? simulatedRoute.busPosition : null}
        tnLive={liveBus}
        mapStyle={mapStyle}
        roadRouteCoords={roadCoords}
      />
      <BusNotifications buses={buses} />

      {/* Journey Planner - replaces old TNRouteSearch */}
      <JourneyPlanner
        userLocation={userLocation}
        onSelectRoute={handleSelectTNRoute}
        onTrackRoute={handleTrackTNRoute}
        onSetMapLocation={handleSetMapLocation}
        selectedRouteId={selectedTNRoute?.id || null}
      />

      {/* Quick action buttons with map style switcher */}
      <QuickActions
        onCenterUser={handleCenterOnUser}
        onExit={() => { setMode('select'); setSelectedRouteId(null); setSelectedStopName(null); setSelectedTNRoute(null); setTrackedTNRoute(null); }}
        onToggleSearch={() => {}}
        onNearestBus={handleNearestBus}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        hasUserLocation={!!userLocation}
      />

      {/* Selected stop info banner */}
      {selectedStopName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 z-[1000] bg-card/90 backdrop-blur-xl border border-accent/30 rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            <div>
              <p className="text-foreground text-sm font-semibold">{selectedStopName}</p>
              <p className="text-muted-foreground text-xs">
                {routesThroughStop.length} route{routesThroughStop.length !== 1 ? 's' : ''} pass through this stop
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStopName(null)}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-lg bg-secondary/50"
          >
            Clear
          </button>
        </motion.div>
      )}

      {/* Bus chips - show when no journey planner and no TN route */}
      {!selectedStopName && !selectedTNRoute && !trackedTNRoute && (busesLoading ? (
        <div className="absolute top-16 left-4 right-4 z-[1000] glass rounded-xl p-3 text-center text-muted-foreground text-sm">
          Loading buses...
        </div>
      ) : buses.length > 0 && (
        <div className="absolute top-16 left-4 right-4 z-[1000] flex gap-2 overflow-x-auto pb-2">
          {buses.map((bus) => (
            <button
              key={bus.id}
              onClick={() => { setSelectedBus(bus); setSelectedRouteId(null); setSelectedStopName(null); setSelectedTNRoute(null); setTrackedTNRoute(null); }}
              className={`shrink-0 glass rounded-xl px-3 py-2 flex items-center gap-2 transition-all ${
                syncedSelectedBus?.id === bus.id ? 'ring-1 ring-primary/50' : ''
              }`}
            >
              <span className="text-lg">🚌</span>
              <span className="text-foreground text-xs font-mono">{bus.number} · {bus.route.name}</span>
            </button>
          ))}
        </div>
      ))}

      <BusInfoPanel bus={syncedSelectedBus} onClose={() => setSelectedBus(null)} />

      {/* Route Detail Bottom Sheet */}
      <RouteDetailSheet
        route={displayRoute}
        isLive={!!liveBus}
        onClose={handleCloseTNRoute}
        onSelectStop={handleSelectTNStop}
        aiSuggestion={aiSuggestion}
        aiLoading={aiLoading}
      />
    </div>
  );
};

function RoleSelect({
  onSelect,
  userRole,
  onSignOut,
}: {
  onSelect: (mode: AppMode) => void;
  userRole: 'driver' | 'passenger' | null;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 rounded-2xl gradient-tn glow-primary flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚌</span>
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground mb-3">
          TN<span className="text-gradient"> Bus Tracker</span>
        </h1>
        <p className="text-muted-foreground text-lg">Real-time local bus tracking across Tamil Nadu</p>
        <p className="text-muted-foreground/60 text-sm mt-1 font-tamil">தமிழ்நாடு பேருந்து தடமறிதல்</p>
        {userRole && (
          <p className="text-primary text-sm mt-2 font-mono uppercase">Logged in as {userRole}</p>
        )}
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('passenger')}
          className="group bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/40 transition-all hover:glow-primary"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <MapPin size={22} className="text-primary" />
          </div>
          <h2 className="text-foreground font-semibold text-lg mb-1">பயணி · Passenger</h2>
          <p className="text-muted-foreground text-sm">Track buses in real-time on the map</p>
        </motion.button>

        {(userRole === 'driver' || !userRole) && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onSelect('driver')}
            className="group bg-card border border-border rounded-2xl p-6 text-left hover:border-accent/40 transition-all hover:glow-accent"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <BusIcon size={22} className="text-accent" />
            </div>
            <h2 className="text-foreground font-semibold text-lg mb-1">ஓட்டுநர் · Driver</h2>
            <p className="text-muted-foreground text-sm">Manage your bus and broadcast location</p>
          </motion.button>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onSignOut}
          className="flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive text-sm mt-4 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground/50 text-xs mt-12 font-mono"
      >
        v4.0 • Tamil Nadu Transit • AI Powered • Live GPS
      </motion.p>
    </div>
  );
}

export default Index;
