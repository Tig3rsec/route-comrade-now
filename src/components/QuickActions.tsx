import { motion } from 'framer-motion';
import { LocateFixed, LogOut, Home, Bus as BusIcon, Search } from 'lucide-react';
import MapStyleSwitcher, { type MapStyleId } from './MapStyleSwitcher';

interface QuickActionsProps {
  onCenterUser: () => void;
  onExit: () => void;
  onToggleSearch: () => void;
  mapStyle: MapStyleId;
  onMapStyleChange: (style: MapStyleId) => void;
  hasUserLocation: boolean;
}

export default function QuickActions({
  onCenterUser,
  onExit,
  onToggleSearch,
  mapStyle,
  onMapStyleChange,
  hasUserLocation,
}: QuickActionsProps) {
  const buttons = [
    {
      icon: <Home size={18} />,
      label: 'Home',
      tamil: 'வீடு',
      onClick: onExit,
      color: 'text-muted-foreground hover:text-foreground',
    },
    {
      icon: <Search size={18} />,
      label: 'Search',
      tamil: 'தேடு',
      onClick: onToggleSearch,
      color: 'text-primary hover:text-primary',
    },
    ...(hasUserLocation
      ? [
          {
            icon: <LocateFixed size={18} />,
            label: 'Me',
            tamil: 'நான்',
            onClick: onCenterUser,
            color: 'text-info hover:text-info',
          },
        ]
      : []),
  ];

  return (
    <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-2">
      {buttons.map((btn, i) => (
        <motion.button
          key={btn.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={btn.onClick}
          className={`glass rounded-xl w-11 h-11 flex flex-col items-center justify-center transition-all active:scale-95 ${btn.color}`}
          title={`${btn.label} (${btn.tamil})`}
        >
          {btn.icon}
        </motion.button>
      ))}
      <MapStyleSwitcher currentStyle={mapStyle} onStyleChange={onMapStyleChange} />
    </div>
  );
}
