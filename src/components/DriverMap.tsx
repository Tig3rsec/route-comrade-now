import { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const TOMTOM_API_KEY = 'ZIqVy8Z5Xe97tgcDulimtx3jMDEH9qRj';

function createDriverMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    ">
      <div style="
        position: relative;
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          inset: -6px;
          background: hsl(160 84% 44% / 0.25);
          border-radius: 50%;
          animation: bus-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
        "></div>
        <div style="
          position: absolute;
          inset: -12px;
          border: 2px solid hsl(160 84% 44% / 0.15);
          border-radius: 50%;
          animation: bus-ring 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
        "></div>
        <span style="font-size: 34px; filter: drop-shadow(0 3px 10px rgba(0,0,0,0.6));">🚌</span>
      </div>
      <div style="
        background: hsl(160 84% 44%);
        color: white;
        font-size: 9px;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
        padding: 2px 10px;
        border-radius: 8px;
        white-space: nowrap;
        box-shadow: 0 2px 10px hsl(160 84% 44% / 0.4);
        letter-spacing: 1px;
      ">YOU</div>
    </div>
  `;
  return el;
}

interface DriverMapProps {
  position: { lat: number; lng: number } | null;
}

export default function DriverMap({ position }: DriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<tt.Map | null>(null);
  const markerRef = useRef<tt.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] = position
      ? [position.lng, position.lat]
      : [80.2707, 13.0827];

    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: mapContainerRef.current,
      center,
      zoom: 15,
      style: { map: 'basic_night' } as any,
    });

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bus-pulse {
        0%, 100% { opacity: 0.25; transform: scale(1); }
        50% { opacity: 0.05; transform: scale(1.8); }
      }
      @keyframes bus-ring {
        0%, 100% { opacity: 0.15; transform: scale(1); }
        50% { opacity: 0; transform: scale(1.5); }
      }
    `;
    document.head.appendChild(style);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      style.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([position.lng, position.lat]);
    } else {
      markerRef.current = new tt.Marker({ element: createDriverMarkerElement() })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
    }

    map.easeTo({
      center: [position.lng, position.lat] as any,
      zoom: 16,
      duration: 800,
    });
  }, [position?.lat, position?.lng]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full rounded-2xl overflow-hidden border border-border"
      style={{ height: '280px' }}
    />
  );
}
