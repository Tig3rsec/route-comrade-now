import { motion, AnimatePresence } from 'framer-motion';
import { Bus } from '@/lib/mockData';
import { X, Users, Navigation, Clock, Gauge, Route } from 'lucide-react';

interface BusInfoPanelProps {
  bus: Bus | null;
  onClose: () => void;
}

export default function BusInfoPanel({ bus, onClose }: BusInfoPanelProps) {
  return (
    <AnimatePresence>
      {bus && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 z-[1000] p-4"
        >
          <div className="glass rounded-2xl p-5 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: bus.color, color: 'white' }}
                >
                  {bus.number}
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-lg">{bus.route.name}</h3>
                  <p className="text-muted-foreground text-sm">{bus.type} • {bus.driver}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                icon={<Clock size={16} />}
                label="ETA"
                value={bus.eta != null ? `${bus.eta}m` : '—'}
                accent={bus.eta != null ? (bus.eta <= 2 ? 'destructive' : bus.eta <= 5 ? 'warning' : 'primary') : 'primary'}
              />
              <StatCard
                icon={<Gauge size={16} />}
                label="Speed"
                value={`${bus.speed}`}
                unit="mph"
                accent="primary"
              />
              <StatCard
                icon={<Users size={16} />}
                label="Seats"
                value={`${bus.seatsAvailable}`}
                unit={`/${bus.totalSeats}`}
                accent={bus.seatsAvailable < 5 ? 'warning' : 'accent'}
              />
              <StatCard
                icon={<Route size={16} />}
                label="Stops"
                value={`${bus.currentStopIndex + 1}`}
                unit={`/${bus.route.stops.length}`}
                accent="primary"
              />
            </div>

            {/* Next stop */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Navigation size={14} className="text-primary" />
              <span className="text-muted-foreground">Next stop:</span>
              <span className="text-foreground font-medium">
                {bus.route.stops[Math.min(bus.currentStopIndex + 1, bus.route.stops.length - 1)]?.name}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent: 'primary' | 'accent' | 'warning' | 'destructive';
}) {
  const accentClasses = {
    primary: 'text-primary',
    accent: 'text-accent',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <div className="bg-secondary/50 rounded-xl p-3 text-center">
      <div className={`flex justify-center mb-1 ${accentClasses[accent]}`}>{icon}</div>
      <div className="font-mono font-semibold text-foreground">
        <span className={accentClasses[accent]}>{value}</span>
        {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
