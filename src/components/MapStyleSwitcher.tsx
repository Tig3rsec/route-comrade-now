import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Satellite, Mountain, Moon, Sun, Layers } from 'lucide-react';

export type MapStyleId = 'night' | 'day' | 'satellite' | 'terrain' | 'hybrid';

interface MapStyleOption {
  id: MapStyleId;
  label: string;
  tamil: string;
  icon: React.ReactNode;
  color: string;
}

const MAP_STYLES: MapStyleOption[] = [
  { id: 'night', label: 'Night', tamil: 'இரவு', icon: <Moon size={20} />, color: 'text-info' },
  { id: 'day', label: 'Day', tamil: 'பகல்', icon: <Sun size={20} />, color: 'text-warning' },
  { id: 'satellite', label: 'Satellite', tamil: 'செயற்கைக்கோள்', icon: <Satellite size={20} />, color: 'text-accent' },
  { id: 'terrain', label: 'Terrain', tamil: 'நிலப்பரப்பு', icon: <Mountain size={20} />, color: 'text-primary' },
  { id: 'hybrid', label: 'Hybrid', tamil: 'கலப்பு', icon: <Layers size={20} />, color: 'text-purple-400' },
];

interface MapStyleSwitcherProps {
  currentStyle: MapStyleId;
  onStyleChange: (style: MapStyleId) => void;
}

export default function MapStyleSwitcher({ currentStyle, onStyleChange }: MapStyleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = MAP_STYLES.find(s => s.id === currentStyle) || MAP_STYLES[0];

  return (
    <div className="relative">
      {/* Toggle button - large and icon-based */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass rounded-xl w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
        title={`Map: ${currentOption.label}`}
      >
        <div className={currentOption.color}>{currentOption.icon}</div>
      </button>

      {/* Style options popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden w-[180px] z-50"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                🗺️ Map Style
              </p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {MAP_STYLES.map((style) => {
                const isActive = currentStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      onStyleChange(style.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.97] ${
                      isActive
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-secondary border border-transparent'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-primary/20' : 'bg-secondary'
                    } ${style.color}`}>
                      {style.icon}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {style.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-tamil">{style.tamil}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
