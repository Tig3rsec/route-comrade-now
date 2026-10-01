import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Clock, MapPin, Navigation, AlertTriangle, ChevronUp, Footprints, Loader2, Sparkles } from 'lucide-react';
import type { TNRoute, TNRouteStop } from '@/lib/tnBusData';
import { nextArrivals, fmtTime, minsUntil } from '@/lib/tnSchedule';

type SheetState = 'collapsed' | 'half' | 'full';

interface RouteDetailSheetProps {
  route: TNRoute | null;
  onClose: () => void;
  onSelectStop: (stop: TNRouteStop) => void;
  aiSuggestion?: string | null;
  aiLoading?: boolean;
  isLive?: boolean;
}

const COLLAPSED_HEIGHT = 120;
const HALF_HEIGHT_RATIO = 0.5;
const FULL_HEIGHT_RATIO = 0.9;

export default function RouteDetailSheet({ route, onClose, onSelectStop, aiSuggestion, aiLoading, isLive }: RouteDetailSheetProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [selectedStop, setSelectedStop] = useState<TNRouteStop | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (route) setSheetState('half');
  }, [route]);

  const getHeight = useCallback(() => {
    if (typeof window === 'undefined') return 400;
    switch (sheetState) {
      case 'collapsed': return COLLAPSED_HEIGHT;
      case 'half': return window.innerHeight * HALF_HEIGHT_RATIO;
      case 'full': return window.innerHeight * FULL_HEIGHT_RATIO;
    }
  }, [sheetState]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 100) {
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('collapsed');
      else onClose();
    } else if (velocity < -500 || offset < -100) {
      if (sheetState === 'collapsed') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    }
  };

  const handleStopTap = (stop: TNRouteStop) => {
    setSelectedStop(stop === selectedStop ? null : stop);
    onSelectStop(stop);
  };

  const trafficColor = (c: 'green' | 'yellow' | 'red') => {
    switch (c) {
      case 'green': return 'bg-accent';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-destructive';
    }
  };

  const trafficLabel = (c: 'green' | 'yellow' | 'red') => {
    switch (c) {
      case 'green': return 'Clear';
      case 'yellow': return 'Moderate';
      case 'red': return 'Heavy';
    }
  };

  return (
    <AnimatePresence>
      {route && (
        <motion.div
          ref={containerRef}
          initial={{ y: '100%' }}
          animate={{ y: 0, height: getHeight() }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="fixed bottom-0 left-0 right-0 z-[1100] flex flex-col"
          style={{ touchAction: 'none' }}
        >
          {/* Sheet background */}
          <div className="flex-1 bg-card/95 backdrop-blur-2xl border-t border-border rounded-t-[24px] flex flex-col overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.4)]">
            {/* Drag handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-primary/20 text-primary font-mono">
                    {route.routeNumber}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize bg-secondary/50 px-2 py-0.5 rounded-md">
                    {route.type}
                  </span>
                  <span className="text-xs text-muted-foreground">⏱ {route.frequency}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isLive ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                    {isLive ? '● LIVE GPS' : 'SCHEDULE'}
                  </span>
                </div>
                <h3 className="text-foreground font-semibold text-lg leading-tight">{route.name}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">{route.tamil}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2">
                <X size={16} />
              </button>
            </div>

            {/* Summary bar */}
            <div className="mx-4 mb-3 flex items-center gap-4 bg-secondary/40 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                <span className="text-foreground text-sm font-semibold">{route.totalDistance}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-accent" />
                <span className="text-foreground text-sm font-semibold">{route.totalTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Navigation size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground text-sm">{route.stops.length} stops</span>
              </div>
            </div>

            {/* AI Suggestion bubble */}
            {(aiSuggestion || aiLoading) && (
              <div className="mx-4 mb-3">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    {aiLoading ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <Sparkles size={16} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-semibold mb-0.5">AI Suggestion</p>
                    <p className="text-foreground text-sm leading-relaxed">
                      {aiLoading ? 'Analyzing route conditions...' : aiSuggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="relative">
                {route.stops.map((stop, idx) => {
                  const isCurrentBus = idx === route.busPosition.stopIndex;
                  const isPassed = stop.arrived;
                  const isLast = idx === route.stops.length - 1;
                  const isSelected = selectedStop?.id === stop.id;

                  return (
                    <div key={stop.id} className="relative">
                      {/* Stop row */}
                      <button
                        onClick={() => handleStopTap(stop)}
                        className={`w-full text-left flex items-start gap-3 py-3 px-2 rounded-xl transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-secondary/30'
                        }`}
                      >
                        {/* Timeline column */}
                        <div className="flex flex-col items-center w-8 shrink-0 relative">
                          {/* Dot */}
                          {isCurrentBus ? (
                            <div className="relative">
                              <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)] z-10 relative flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                              </div>
                              <div className="absolute inset-0 w-5 h-5 rounded-full bg-primary/40 animate-ping" />
                            </div>
                          ) : isPassed ? (
                            <div className="w-4 h-4 rounded-full bg-accent border-2 border-accent" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 bg-card" />
                          )}
                          {/* Connecting line */}
                          {!isLast && (
                            <div className={`w-0.5 flex-1 min-h-[40px] mt-1 ${
                              isPassed ? 'bg-accent/60' : 'bg-border'
                            }`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 -mt-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium text-sm">{stop.name}</span>
                            {isCurrentBus && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/20 text-primary font-semibold uppercase tracking-wider">Bus here</span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs mt-0.5">{stop.tamil}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {nextArrivals(route, idx, now).map((t, i) => (
                              <span key={i} className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${i === 0 ? 'bg-primary/15 text-primary font-semibold' : 'bg-secondary/60 text-muted-foreground'}`}>
                                {fmtTime(t)}{i === 0 ? ` · ${minsUntil(t, now)} min` : ''}
                              </span>
                            ))}
                          </div>

                          {/* Distance & time to next */}
                          {!isLast && (
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                🕐 {stop.timeToNext}
                              </span>
                              <span className="text-muted-foreground flex items-center gap-1">
                                📍 {stop.distanceToNext}
                              </span>
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                                stop.trafficCondition === 'green' ? 'bg-accent/10 text-accent' :
                                stop.trafficCondition === 'yellow' ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                🚦 {trafficLabel(stop.trafficCondition)}
                              </span>
                            </div>
                          )}

                          {/* Expanded stop details */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 bg-secondary/30 rounded-xl p-3 space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin size={12} />
                                    <span>{stop.district} District • {stop.type === 'major' ? 'Major Bus Stand' : stop.type === 'town' ? 'Town Stop' : 'Local Stop'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Navigation size={12} />
                                    <span>Cumulative: {stop.cumulativeDistance} • {stop.cumulativeTime}</span>
                                  </div>
                                  {stop.amenities.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-muted-foreground">Amenities:</span>
                                      <div className="flex gap-1">
                                        {stop.amenities.map(a => (
                                          <span key={a} className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize text-[10px]">
                                            {a === 'shelter' ? '🏠' : a === 'water' ? '💧' : a === 'seating' ? '💺' : '🚻'} {a}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <button className="w-full mt-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Footprints size={14} />
                                    Board Here — Get walking directions
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Stop order badge */}
                        <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">#{stop.stopOrder}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Cumulative totals */}
              <div className="mt-4 border-t border-border pt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Journey</span>
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-semibold">{route.totalDistance}</span>
                  <span className="text-foreground font-semibold">{route.totalTime}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
