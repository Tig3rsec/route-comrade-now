import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Bus as BusIcon } from 'lucide-react';
import { tnRoutes } from '@/lib/tnBusData';
import type { DriverBus, RouteOption } from '@/hooks/useDriverBuses';

interface BusManagementFormProps {
  buses: DriverBus[];
  routes: RouteOption[];
  onCreate: (data: { number: string; color: string; type: string; totalSeats: number; routeId: string | null; tnRouteId?: string | null }) => Promise<any>;
  onUpdate: (busId: string, data: { number: string; color: string; type: string; totalSeats: number; routeId: string | null; tnRouteId?: string | null }) => Promise<any>;
  onDelete: (busId: string) => Promise<any>;
}

const BUS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const BUS_TYPES = ['Standard', 'Express', 'Mini'];

interface FormData {
  number: string;
  color: string;
  type: string;
  totalSeats: number;
  routeId: string | null;
  tnRouteId: string | null;
}

export default function BusManagementForm({ buses, routes, onCreate, onUpdate, onDelete }: BusManagementFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<DriverBus | null>(null);
  const [formData, setFormData] = useState<FormData>({
    number: '',
    color: '#3B82F6',
    type: 'Standard',
    totalSeats: 40,
    routeId: null,
    tnRouteId: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingBus(null);
    setFormData({ number: '', color: '#3B82F6', type: 'Standard', totalSeats: 40, routeId: null, tnRouteId: null });
    setShowForm(true);
    setError('');
  };

  const openEdit = (bus: DriverBus) => {
    setEditingBus(bus);
    setFormData({
      number: bus.number,
      color: bus.color,
      type: bus.type,
      totalSeats: bus.totalSeats,
      routeId: bus.routeId,
      tnRouteId: bus.tnRouteId,
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number.trim()) {
      setError('Bus number is required');
      return;
    }
    setSaving(true);
    setError('');

    const result = editingBus
      ? await onUpdate(editingBus.id, formData)
      : await onCreate(formData);

    if (result?.error) {
      setError(result.error.message || 'Something went wrong');
    } else {
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (busId: string) => {
    if (!confirm('Delete this bus?')) return;
    await onDelete(busId);
  };

  return (
    <div className="space-y-4">
      {/* Bus list */}
      {buses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <BusIcon size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No buses yet. Add your first bus!</p>
        </div>
      ) : (
        buses.map((bus) => (
          <motion.div
            key={bus.id}
            layout
            className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: bus.color, color: 'white' }}
              >
                {bus.number}
              </div>
              <div>
                <p className="text-foreground font-semibold">{bus.type}</p>
                <p className="text-muted-foreground text-xs">
                  {bus.routeName || 'No route'} • {bus.totalSeats} seats
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(bus)}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(bus.id)}
                className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-sm"
        >
          <Plus size={16} />
          Add Bus
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
                {editingBus ? 'Edit Bus' : 'New Bus'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            {/* Bus number */}
            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                Bus Number
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData((p) => ({ ...p, number: e.target.value }))}
                placeholder="e.g. 42, 7X"
                maxLength={6}
                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {BUS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, color: c }))}
                    className={`w-9 h-9 rounded-lg transition-all ${
                      formData.color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">
                Type
              </label>
              <div className="flex gap-2">
                {BUS_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, type: t }))}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                      formData.type === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Total seats */}
            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                Total Seats
              </label>
              <input
                type="number"
                value={formData.totalSeats}
                onChange={(e) => setFormData((p) => ({ ...p, totalSeats: Math.max(1, parseInt(e.target.value) || 1) }))}
                min={1}
                max={100}
                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Route */}
            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                Route (optional)
              </label>
              <select
                value={formData.routeId || ''}
                onChange={(e) => setFormData((p) => ({ ...p, routeId: e.target.value || null }))}
                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">
                🚌 TN Route (passengers see your live GPS)
              </label>
              <select
                value={formData.tnRouteId || ''}
                onChange={(e) => setFormData((p) => ({ ...p, tnRouteId: e.target.value || null }))}
                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">None</option>
                {tnRoutes.map((r) => (
                  <option key={r.id} value={r.id}>{r.routeNumber} · {r.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm glow-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingBus ? 'Update Bus' : 'Create Bus'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
