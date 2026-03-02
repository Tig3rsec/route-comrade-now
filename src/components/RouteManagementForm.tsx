import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, X, MapPin, Route, Trash2, Map } from 'lucide-react';
import type { ManagedRoute, ManagedStop } from '@/hooks/useRouteManagement';
import RouteMapPicker from '@/components/RouteMapPicker';

interface RouteManagementFormProps {
  routes: ManagedRoute[];
  onCreate: (name: string, description: string, stops: Omit<ManagedStop, 'id'>[], path: [number, number][]) => Promise<any>;
  onUpdate: (routeId: string, name: string, description: string, stops: Omit<ManagedStop, 'id'>[], path: [number, number][]) => Promise<any>;
}

interface StopForm {
  name: string;
  lat: string;
  lng: string;
}

export default function RouteManagementForm({ routes, onCreate, onUpdate }: RouteManagementFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ManagedRoute | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stops, setStops] = useState<StopForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true);

  const openCreate = () => {
    setEditingRoute(null);
    setName('');
    setDescription('');
    setStops([]);
    setShowForm(true);
    setShowMap(true);
    setError('');
  };

  const openEdit = (route: ManagedRoute) => {
    setEditingRoute(route);
    setName(route.name);
    setDescription(route.description);
    setStops(
      route.stops.length > 0
        ? route.stops.map(s => ({ name: s.name, lat: String(s.lat), lng: String(s.lng) }))
        : []
    );
    setShowForm(true);
    setShowMap(true);
    setError('');
  };

  const addStop = () => setStops(prev => [...prev, { name: '', lat: '', lng: '' }]);

  const removeStop = (idx: number) => {
    setStops(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStop = (idx: number, field: keyof StopForm, val: string) => {
    setStops(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)));
  };

  const handleMapAddStop = useCallback((lat: number, lng: number) => {
    setStops(prev => [...prev, { name: `Stop ${prev.length + 1}`, lat: lat.toFixed(6), lng: lng.toFixed(6) }]);
  }, []);

  const handleMapUpdateStop = useCallback((index: number, lat: number, lng: number) => {
    setStops(prev => prev.map((s, i) => i === index ? { ...s, lat: lat.toFixed(6), lng: lng.toFixed(6) } : s));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Route name is required'); return; }

    const validStops = stops.filter(s => s.lat && s.lng);
    if (validStops.length < 2) { setError('At least 2 stops with coordinates are required. Tap the map to add stops!'); return; }

    setSaving(true);
    setError('');

    const parsedStops: Omit<ManagedStop, 'id'>[] = validStops.map((s, i) => ({
      name: s.name || `Stop ${i + 1}`,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lng),
      stopOrder: i,
    }));

    const path: [number, number][] = parsedStops.map(s => [s.lat, s.lng]);

    const result = editingRoute
      ? await onUpdate(editingRoute.id, name, description, parsedStops, path)
      : await onCreate(name, description, parsedStops, path);

    if (result?.error) {
      setError(result.error.message || 'Something went wrong');
    } else {
      setShowForm(false);
    }
    setSaving(false);
  };

  const mapStops = stops
    .filter(s => s.lat && s.lng)
    .map(s => ({ name: s.name, lat: parseFloat(s.lat), lng: parseFloat(s.lng) }));

  return (
    <div className="space-y-4">
      {/* Route list */}
      {routes.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Route size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No routes yet. Create your first route!</p>
        </div>
      ) : (
        routes.map(route => (
          <motion.div key={route.id} layout className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Route size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">{route.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {route.stops.length} stops • {route.description || 'No description'}
                  </p>
                </div>
              </div>
              <button onClick={() => openEdit(route)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Pencil size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {route.stops.map((stop, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-secondary rounded-lg px-2 py-1 text-xs text-muted-foreground">
                  <MapPin size={10} className="text-primary" />
                  {stop.name}
                </span>
              ))}
            </div>
          </motion.div>
        ))
      )}

      {/* Add button */}
      {!showForm && (
        <button onClick={openCreate} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-sm">
          <Plus size={16} />
          Add Route
        </button>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl border border-primary/30 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-semibold">
                {editingRoute ? 'Edit Route' : 'New Route'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>

            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Route Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Chennai - Coimbatore Express"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Description</label>
              <input
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Map picker toggle */}
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground text-xs uppercase tracking-wider">
                Stops ({stops.length})
              </label>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  showMap ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Map size={12} />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>

            {/* Map */}
            {showMap && (
              <RouteMapPicker
                stops={mapStops}
                onAddStop={handleMapAddStop}
                onUpdateStopPosition={handleMapUpdateStop}
              />
            )}

            {/* Stop list */}
            <div className="space-y-2">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="w-6 h-8 flex items-center justify-center text-xs text-muted-foreground font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text" value={stop.name} onChange={e => updateStop(idx, 'name', e.target.value)}
                      placeholder="Stop name"
                      className="bg-secondary border border-border rounded-lg py-2 px-2.5 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text" value={stop.lat} onChange={e => updateStop(idx, 'lat', e.target.value)}
                      placeholder="Latitude"
                      className="bg-secondary border border-border rounded-lg py-2 px-2.5 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                    <input
                      type="text" value={stop.lng} onChange={e => updateStop(idx, 'lng', e.target.value)}
                      placeholder="Longitude"
                      className="bg-secondary border border-border rounded-lg py-2 px-2.5 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <button type="button" onClick={() => removeStop(idx)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addStop} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus size={12} /> Add Stop Manually
            </button>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit" disabled={saving}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm glow-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
