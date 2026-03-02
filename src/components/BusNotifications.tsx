import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus } from '@/lib/mockData';
import { AlertTriangle, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'urgent' | 'arrival';
  title: string;
  message: string;
  busNumber: string;
  busColor: string;
}

interface BusNotificationsProps {
  buses: Bus[];
}

export default function BusNotifications({ buses }: BusNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newNotifications: Notification[] = [];

    buses.forEach((bus) => {
      if (!bus.isActive || bus.eta === undefined) return;

      if (bus.eta <= 2) {
        const id = `${bus.id}-arrival`;
        if (!dismissed.has(id)) {
          newNotifications.push({
            id,
            type: bus.eta <= 1 ? 'arrival' : 'urgent',
            title: bus.eta <= 1 ? 'Bus Arriving!' : 'Final Call',
            message: bus.eta <= 1
              ? `Bus ${bus.number} is arriving now`
              : `Bus ${bus.number} is ${bus.eta} min away`,
            busNumber: bus.number,
            busColor: bus.color,
          });
        }
      } else if (bus.eta <= 5) {
        const id = `${bus.id}-5min`;
        if (!dismissed.has(id)) {
          newNotifications.push({
            id,
            type: 'warning',
            title: 'Almost Here',
            message: `Bus ${bus.number} arriving in ${bus.eta} min`,
            busNumber: bus.number,
            busColor: bus.color,
          });
        }
      } else if (bus.eta <= 10) {
        const id = `${bus.id}-10min`;
        if (!dismissed.has(id)) {
          newNotifications.push({
            id,
            type: 'info',
            title: 'Heads Up',
            message: `Bus ${bus.number} is ${bus.eta} min away`,
            busNumber: bus.number,
            busColor: bus.color,
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [buses, dismissed]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const typeConfig = {
    info: {
      bg: 'bg-info/10 border-info/30',
      icon: <Clock size={18} className="text-info" />,
      glow: '',
    },
    warning: {
      bg: 'bg-warning/10 border-warning/30',
      icon: <AlertTriangle size={18} className="text-warning" />,
      glow: 'glow-warning',
    },
    urgent: {
      bg: 'bg-destructive/10 border-destructive/30',
      icon: <MapPin size={18} className="text-destructive" />,
      glow: 'glow-destructive',
    },
    arrival: {
      bg: 'bg-success/10 border-success/30',
      icon: <CheckCircle2 size={18} className="text-success" />,
      glow: 'glow-accent',
    },
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 max-w-md mx-auto pointer-events-none">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notif) => {
          const config = typeConfig[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ y: -60, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -30, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`glass rounded-xl border p-3 flex items-center gap-3 pointer-events-auto cursor-pointer ${config.bg} ${config.glow}`}
              onClick={() => dismiss(notif.id)}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-semibold">{notif.title}</p>
                <p className="text-muted-foreground text-xs">{notif.message}</p>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: notif.busColor, color: 'white' }}
              >
                {notif.busNumber}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
