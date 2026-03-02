import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Route, Bus as BusIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RouteWithStops } from '@/hooks/useAllRoutes';

interface RouteSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredRoutes: RouteWithStops[];
  onSelectRoute: (route: RouteWithStops) => void;
  onSelectStop: (stop: { name: string; lat: number; lng: number }, routeName: string) => void;
  selectedRouteId: string | null;
  onSelectStopForAllBuses: (stopName: string, lat: number, lng: number) => void;
}

export default function RouteSearch({
  searchQuery,
  onSearchChange,
  filteredRoutes,
  onSelectRoute,
  onSelectStop,
  selectedRouteId,
  onSelectStopForAllBuses,
}: RouteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => setIsOpen(true);

  const handleSelect = (route: RouteWithStops) => {
    onSelectRoute(route);
    setIsOpen(false);
    onSearchChange('');
  };

  const handleStopSelect = (stop: { name: string; lat: number; lng: number }, routeName: string) => {
    onSelectStopForAllBuses(stop.name, stop.lat, stop.lng);
    setIsOpen(false);
    onSearchChange('');
  };

  // Close on click outside
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = searchQuery.toLowerCase();

  // Collect all unique stops matching the query across routes
  const matchingStopsGrouped = q
    ? (() => {
        const stopMap = new Map<string, { name: string; lat: number; lng: number; routes: string[] }>();
        filteredRoutes.forEach(route => {
          route.stops
            .filter(s => s.name.toLowerCase().includes(q))
            .forEach(s => {
              const key = s.name.toLowerCase();
              if (stopMap.has(key)) {
                stopMap.get(key)!.routes.push(route.name);
              } else {
                stopMap.set(key, { name: s.name, lat: s.lat, lng: s.lng, routes: [route.name] });
              }
            });
        });
        return Array.from(stopMap.values());
      })()
    : [];

  return (
    <div ref={containerRef} className="absolute top-4 left-4 right-16 z-[1001]">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search routes or stops..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleFocus}
          className="w-full bg-card/90 backdrop-blur-xl border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => { onSearchChange(''); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto"
          >
            {filteredRoutes.length === 0 && matchingStopsGrouped.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No routes or stops found
              </div>
            ) : (
              <>
                {/* Matching stops — show first with bus count */}
                {matchingStopsGrouped.length > 0 && (
                  <div className="border-b border-border">
                    <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary/30">
                      Stops
                    </div>
                    {matchingStopsGrouped.map((stop) => (
                      <button
                        key={stop.name}
                        onClick={() => handleStopSelect(stop, stop.routes[0])}
                        className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-medium">{stop.name}</p>
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <BusIcon size={10} />
                            {stop.routes.length} route{stop.routes.length > 1 ? 's' : ''}: {stop.routes.join(', ')}
                          </p>
                        </div>
                        <span className="text-xs text-primary font-mono">{stop.routes.length} 🚌</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Routes */}
                <div>
                  <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary/30">
                    Routes
                  </div>
                  {filteredRoutes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleSelect(route)}
                      className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex items-center gap-3 ${
                        selectedRouteId === route.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Route size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{route.name}</p>
                        <p className="text-muted-foreground text-xs truncate">
                          {route.stops.map(s => s.name).join(' → ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
