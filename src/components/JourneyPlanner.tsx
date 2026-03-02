import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Bus as BusIcon, ArrowRight, LocateFixed, ChevronDown, Eye, Route } from 'lucide-react';
import { tnBusStands, tnRoutes, type TNRoute, type TNBusStop } from '@/lib/tnBusData';

interface JourneyPlannerProps {
  userLocation: { lat: number; lng: number } | null;
  onSelectRoute: (route: TNRoute) => void;
  onTrackRoute: (route: TNRoute) => void;
  onSetMapLocation: (lat: number, lng: number, zoom: number) => void;
  selectedRouteId: string | null;
}

interface LocationSelection {
  name: string;
  lat: number;
  lng: number;
  id: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findRoutesForJourney(fromId: string, toId: string): { route: TNRoute; fromStop: string; toStop: string }[] {
  const results: { route: TNRoute; fromStop: string; toStop: string }[] = [];

  for (const route of tnRoutes) {
    const fromIndex = route.stops.findIndex(s => s.id === fromId);
    const toIndex = route.stops.findIndex(s => s.id === toId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
      results.push({
        route,
        fromStop: route.stops[fromIndex].name,
        toStop: route.stops[toIndex].name,
      });
    }
  }

  return results;
}

export default function JourneyPlanner({ userLocation, onSelectRoute, onTrackRoute, onSetMapLocation, selectedRouteId }: JourneyPlannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [fromLocation, setFromLocation] = useState<LocationSelection | null>(null);
  const [toLocation, setToLocation] = useState<LocationSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedRoutes, setMatchedRoutes] = useState<{ route: TNRoute; fromStop: string; toStop: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort stops by distance from user
  const sortedStops = useMemo(() => {
    if (!userLocation) return tnBusStands;
    return [...tnBusStands].sort(
      (a, b) =>
        haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
    );
  }, [userLocation]);

  const filteredStops = useMemo(() => {
    if (!searchQuery.trim()) return sortedStops.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return sortedStops.filter(
      s => s.name.toLowerCase().includes(q) || s.tamil.includes(q) || s.district.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [sortedStops, searchQuery]);

  // Find routes when both locations are set
  useEffect(() => {
    if (fromLocation && toLocation) {
      const routes = findRoutesForJourney(fromLocation.id, toLocation.id);
      // Also try reverse direction
      if (routes.length === 0) {
        const reverseRoutes = findRoutesForJourney(toLocation.id, fromLocation.id);
        setMatchedRoutes(reverseRoutes);
      } else {
        setMatchedRoutes(routes);
      }
    } else {
      setMatchedRoutes([]);
    }
  }, [fromLocation, toLocation]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectStop = (stop: TNBusStop) => {
    const selection: LocationSelection = {
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      id: stop.id,
    };

    if (activeField === 'from') {
      setFromLocation(selection);
      onSetMapLocation(stop.lat, stop.lng, 14);
    } else if (activeField === 'to') {
      setToLocation(selection);
      onSetMapLocation(stop.lat, stop.lng, 14);
    }

    setActiveField(null);
    setSearchQuery('');
  };

  const handleUseMyLocation = () => {
    if (!userLocation) return;
    // Find nearest stop to user
    const nearest = sortedStops[0];
    if (nearest && activeField === 'from') {
      setFromLocation({
        name: `Near ${nearest.name}`,
        lat: userLocation.lat,
        lng: userLocation.lng,
        id: nearest.id,
      });
      onSetMapLocation(userLocation.lat, userLocation.lng, 14);
    }
    setActiveField(null);
    setSearchQuery('');
  };

  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const distanceStr = (stop: TNBusStop) => {
    if (!userLocation) return '';
    const d = haversineKm(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 right-16 z-[1001]">
      {/* Collapsed search bar */}
      {!isExpanded && !activeField && matchedRoutes.length === 0 && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsExpanded(true)}
          className="w-full bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-primary/40 transition-all shadow-lg"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Search size={16} className="text-primary" />
          </div>
          <span className="text-muted-foreground text-sm flex-1 text-left">Where are you going?</span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.button>
      )}

      {/* Expanded journey planner */}
      {(isExpanded || activeField || matchedRoutes.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* From/To fields */}
          <div className="p-3">
            <div className="flex items-stretch gap-2">
              {/* Timeline dots */}
              <div className="flex flex-col items-center py-2 px-1 gap-0">
                <div className="w-3 h-3 rounded-full bg-accent border-2 border-accent" />
                <div className="w-0.5 flex-1 bg-border my-1" />
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary" />
              </div>

              {/* Input fields */}
              <div className="flex-1 space-y-2">
                {/* From */}
                <button
                  onClick={() => { setActiveField('from'); setSearchQuery(''); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeField === 'from'
                      ? 'bg-accent/10 border border-accent/40 text-foreground'
                      : 'bg-secondary border border-transparent text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {fromLocation ? (
                    <span className="flex items-center gap-2">
                      <LocateFixed size={14} className="text-accent shrink-0" />
                      <span className="truncate">{fromLocation.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <LocateFixed size={14} className="shrink-0" />
                      Set starting point
                    </span>
                  )}
                </button>

                {/* To */}
                <button
                  onClick={() => { setActiveField('to'); setSearchQuery(''); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeField === 'to'
                      ? 'bg-primary/10 border border-primary/40 text-foreground'
                      : 'bg-secondary border border-transparent text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {toLocation ? (
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span className="truncate">{toLocation.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin size={14} className="shrink-0" />
                      Set destination
                    </span>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center justify-between py-1">
                <button
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Swap"
                >
                  <ArrowRight size={14} className="rotate-90" />
                </button>
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setActiveField(null);
                    setFromLocation(null);
                    setToLocation(null);
                    setMatchedRoutes([]);
                  }}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Search dropdown */}
          <AnimatePresence>
            {activeField && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border overflow-hidden"
              >
                {/* Search input */}
                <div className="p-3 pb-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search bus stops..."
                      autoFocus
                      className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Use my location button */}
                {activeField === 'from' && userLocation && (
                  <button
                    onClick={handleUseMyLocation}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border"
                  >
                    <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                      <LocateFixed size={14} className="text-info" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-foreground text-sm font-medium">Use my current location</p>
                      <p className="text-muted-foreground text-xs">GPS location</p>
                    </div>
                  </button>
                )}

                {/* Stop list */}
                <div className="max-h-[40vh] overflow-y-auto">
                  <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary/30">
                    {searchQuery ? 'Search Results' : 'Nearby Stops'}
                  </div>
                  {filteredStops.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => handleSelectStop(stop)}
                      className="w-full text-left px-4 py-2.5 hover:bg-secondary/50 transition-colors flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        stop.type === 'major' ? 'bg-primary/10' : stop.type === 'town' ? 'bg-accent/10' : 'bg-secondary'
                      }`}>
                        <MapPin size={14} className={
                          stop.type === 'major' ? 'text-primary' : stop.type === 'town' ? 'text-accent' : 'text-muted-foreground'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{stop.name}</p>
                        <p className="text-muted-foreground text-xs">{stop.tamil} · {stop.district}</p>
                      </div>
                      {userLocation && (
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {distanceStr(stop)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Matched routes */}
          <AnimatePresence>
            {matchedRoutes.length > 0 && !activeField && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border overflow-hidden"
              >
                <div className="px-4 py-2 flex items-center justify-between bg-secondary/30">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {matchedRoutes.length} Route{matchedRoutes.length !== 1 ? 's' : ''} Found
                  </span>
                  <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                    <BusIcon size={10} />
                    {matchedRoutes.length} bus{matchedRoutes.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="max-h-[35vh] overflow-y-auto">
                  {matchedRoutes.map(({ route, fromStop, toStop }) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <div
                        key={route.id}
                        className={`px-4 py-3 border-b border-border/50 transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-xs font-mono">{route.routeNumber}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-foreground text-sm font-semibold truncate">{route.name}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                                route.type === 'express' ? 'bg-primary/20 text-primary' :
                                route.type === 'deluxe' ? 'bg-warning/20 text-warning' :
                                'bg-accent/20 text-accent'
                              }`}>
                                {route.type}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {fromStop} → {toStop} · {route.totalDistance} · {route.totalTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onSelectRoute(route)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                          >
                            <Route size={12} />
                            View Route
                          </button>
                          <button
                            onClick={() => onTrackRoute(route)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                          >
                            <Eye size={12} />
                            Track Live
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
