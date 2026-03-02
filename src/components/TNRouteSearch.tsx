import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Route, Bus as BusIcon, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchRoutes, tnDistricts, findNearbyStops, type TNRoute, type TNBusStop } from '@/lib/tnBusData';

interface TNRouteSearchProps {
  onSelectRoute: (route: TNRoute) => void;
  selectedRouteId: string | null;
}

export default function TNRouteSearch({ onSelectRoute, selectedRouteId }: TNRouteSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchRoutes(query);
  const filteredResults = districtFilter
    ? results.filter(r => r.stops.some(s => s.district === districtFilter))
    : results;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (route: TNRoute) => {
    onSelectRoute(route);
    setIsOpen(false);
    setQuery('');
  };

  const routeTypeColors: Record<string, string> = {
    local: 'bg-accent/20 text-accent',
    express: 'bg-primary/20 text-primary',
    deluxe: 'bg-warning/20 text-warning',
    'ultra-deluxe': 'bg-destructive/20 text-destructive',
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 right-16 z-[1001]">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search: Koyambedu to Broadway, Route 109..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-card/90 backdrop-blur-xl border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
            {/* District filter chips */}
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-b border-border">
              <button
                onClick={() => setDistrictFilter(null)}
                className={`shrink-0 text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${
                  !districtFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'].map(d => (
                <button
                  key={d}
                  onClick={() => setDistrictFilter(districtFilter === d ? null : d)}
                  className={`shrink-0 text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${
                    districtFilter === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No routes found</div>
            ) : (
              <div>
                <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary/30">
                  {filteredResults.length} Routes
                </div>
                {filteredResults.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => handleSelect(route)}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex items-center gap-3 ${
                      selectedRouteId === route.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-xs font-mono">{route.routeNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground text-sm font-medium truncate">{route.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${routeTypeColors[route.type]}`}>
                          {route.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{route.tamil}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>📍 {route.totalDistance}</span>
                        <span>🕐 {route.totalTime}</span>
                        <span>🚏 {route.stops.length} stops</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
