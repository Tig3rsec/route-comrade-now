import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDriverBuses } from '@/hooks/useDriverBuses';
import { useGpsBroadcast } from '@/hooks/useGpsBroadcast';
import { useRouteManagement } from '@/hooks/useRouteManagement';
import BusManagementForm from '@/components/BusManagementForm';
import RouteManagementForm from '@/components/RouteManagementForm';
import DriverMap from '@/components/DriverMap';
import {
  Play, Square, Users, AlertTriangle, Navigation, MapPin,
  Minus, Plus, Bus as BusIcon, Settings, Radio, Route,
} from 'lucide-react';

interface DriverDashboardProps {
  onBack: () => void;
}

export default function DriverDashboard({ onBack }: DriverDashboardProps) {
  const { buses, routes: busRoutes, loading, createBus, updateBus, deleteBus, refetch: refetchBuses } = useDriverBuses();
  const { routes: managedRoutes, loading: routesLoading, createRoute, updateRoute } = useRouteManagement();
  const {
    activeTrip, currentPosition, gpsError, seatsAvailable,
    setSeatsAvailable, startTrip, endTrip,
  } = useGpsBroadcast();
  const [tab, setTab] = useState<'drive' | 'manage' | 'routes'>('drive');
  const [reportOpen, setReportOpen] = useState(false);

  const activeBus = activeTrip ? buses.find(b => b.id === activeTrip.busId) : null;

  // Refetch bus routes when routes change
  const handleRouteCreated = async (...args: Parameters<typeof createRoute>) => {
    const result = await createRoute(...args);
    if (!result?.error) refetchBuses();
    return result;
  };

  const handleRouteUpdated = async (...args: Parameters<typeof updateRoute>) => {
    const result = await updateRoute(...args);
    if (!result?.error) refetchBuses();
    return result;
  };

  if (loading || routesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'drive' as const, label: 'Drive', icon: Radio },
    { id: 'manage' as const, label: 'Buses', icon: Settings },
    { id: 'routes' as const, label: 'Routes', icon: Route },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm">← Back</button>
        <h1 className="text-foreground font-heading font-bold text-lg">Driver Dashboard</h1>
        <div className="w-12" />
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'routes' ? (
        <RouteManagementForm
          routes={managedRoutes}
          onCreate={handleRouteCreated}
          onUpdate={handleRouteUpdated}
        />
      ) : tab === 'manage' ? (
        <BusManagementForm
          buses={buses}
          routes={busRoutes}
          onCreate={createBus}
          onUpdate={updateBus}
          onDelete={deleteBus}
        />
      ) : (
        <DriveTab
          buses={buses}
          activeTrip={activeTrip}
          activeBus={activeBus}
          currentPosition={currentPosition}
          gpsError={gpsError}
          seatsAvailable={seatsAvailable}
          setSeatsAvailable={setSeatsAvailable}
          startTrip={startTrip}
          endTrip={endTrip}
          reportOpen={reportOpen}
          setReportOpen={setReportOpen}
        />
      )}
    </div>
  );
}

function DriveTab({
  buses, activeTrip, activeBus, currentPosition, gpsError,
  seatsAvailable, setSeatsAvailable, startTrip, endTrip,
  reportOpen, setReportOpen,
}: any) {
  if (buses.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <BusIcon size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-semibold mb-1">No Buses</p>
        <p className="text-muted-foreground text-sm">Go to "Buses" tab to create a bus first.</p>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm text-center mb-4">
          Select a bus to start broadcasting your location
        </p>
        {buses.map((bus: any) => (
          <motion.button
            key={bus.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => startTrip(bus.id, bus.totalSeats)}
            className="w-full bg-card rounded-2xl border border-border p-5 flex items-center justify-between hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: bus.color, color: 'white' }}>
                {bus.number}
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold">{bus.routeName || 'No route'}</p>
                <p className="text-muted-foreground text-xs">{bus.type} • {bus.totalSeats} seats</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={18} />
              <span className="text-sm font-medium">Start</span>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Driver Map - auto-centers on GPS position */}
      <DriverMap position={currentPosition} />

      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
        gpsError ? 'bg-destructive/10 border-destructive/30' : currentPosition ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'
      }`}>
        <div className={`w-3 h-3 rounded-full ${gpsError ? 'bg-destructive' : currentPosition ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'}`} />
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">
            {gpsError ? 'GPS Error' : currentPosition ? 'Broadcasting Live' : 'Acquiring GPS...'}
          </p>
          <p className="text-muted-foreground text-xs">
            {gpsError || (currentPosition ? `${currentPosition.lat.toFixed(5)}, ${currentPosition.lng.toFixed(5)}` : 'Waiting for location fix')}
          </p>
        </div>
        <Radio size={18} className={currentPosition ? 'text-success' : 'text-muted-foreground'} />
      </div>

      {activeBus && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: activeBus.color, color: 'white' }}>
                {activeBus.number}
              </div>
              <div>
                <h2 className="text-foreground font-semibold text-xl">{activeBus.routeName || 'No route'}</h2>
                <p className="text-muted-foreground text-sm">{activeBus.type}</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">LIVE</div>
          </div>

          <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-accent" />
              <span className="text-foreground text-sm font-medium">Available Seats</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSeatsAvailable(Math.max(0, seatsAvailable - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-border transition-colors">
                <Minus size={14} />
              </button>
              <span className="font-mono text-foreground font-semibold w-8 text-center">{seatsAvailable}</span>
              <button onClick={() => setSeatsAvailable(Math.min(activeBus.totalSeats, seatsAvailable + 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-border transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={endTrip} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
              <Square size={16} /> End Trip
            </button>
            <button onClick={() => setReportOpen(!reportOpen)} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-warning/10 text-warning font-semibold text-sm hover:bg-warning/20 transition-all">
              <AlertTriangle size={16} /> Report
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card rounded-2xl border border-warning/30 p-5">
          <h3 className="text-foreground font-semibold mb-3">Report Issue</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Breakdown', 'Traffic Delay', 'Accident', 'Route Change'].map(issue => (
              <button key={issue} onClick={() => setReportOpen(false)} className="py-2.5 px-3 rounded-xl bg-secondary text-foreground text-sm hover:bg-warning/10 hover:text-warning border border-border hover:border-warning/30 transition-all">
                {issue}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
