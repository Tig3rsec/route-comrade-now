import { useEffect, useRef, useState } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { createBusPinElement, animateMarker, bearing } from '@/lib/busPinMarker';
import { Navigation, Compass } from 'lucide-react';

const TOMTOM_API_KEY = 'ZIqVy8Z5Xe97tgcDulimtx3jMDEH9qRj';

interface DriverMapProps {
  position: { lat: number; lng: number } | null;
}

export default function DriverMap({ position }: DriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<tt.Map | null>(null);
  const markerRef = useRef<tt.Marker | null>(null);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);
  const headingRef = useRef(0);
  const trailRef = useRef<[number, number][]>([]);
  const [follow, setFollow] = useState(true);
  const followRef = useRef(true);
  followRef.current = follow;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const center: [number, number] = position ? [position.lng, position.lat] : [80.2707, 13.0827];
    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: mapContainerRef.current,
      center,
      zoom: 17,
      pitch: 55,
      style: { map: 'basic_main' } as any,
    });
    map.on('load', () => {
      map.addSource('trail', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } } as any);
      map.addLayer({ id: 'trail-casing', type: 'line', source: 'trail', paint: { 'line-color': '#ffffff', 'line-width': 10 }, layout: { 'line-cap': 'round', 'line-join': 'round' } } as any);
      map.addLayer({ id: 'trail-line', type: 'line', source: 'trail', paint: { 'line-color': '#1a73e8', 'line-width': 6 }, layout: { 'line-cap': 'round', 'line-join': 'round' } } as any);
    });
    map.on('dragstart', () => setFollow(false));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    const prev = lastPos.current;
    if (prev && (Math.abs(prev.lat - position.lat) > 1e-6 || Math.abs(prev.lng - position.lng) > 1e-6)) {
      headingRef.current = bearing(prev, position);
    }
    lastPos.current = position;
    const to: [number, number] = [position.lng, position.lat];

    trailRef.current = [...trailRef.current, to].slice(-300);
    const src = map.getSource('trail') as any;
    src?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trailRef.current } });

    if (markerRef.current) {
      animateMarker(markerRef.current as any, to, 1000);
    } else {
      markerRef.current = new tt.Marker({ element: createBusPinElement('YOU'), anchor: 'bottom' }).setLngLat(to).addTo(map);
    }
    if (followRef.current) {
      map.easeTo({ center: to as any, bearing: headingRef.current, pitch: 55, zoom: 17, duration: 1000 });
    }
  }, [position?.lat, position?.lng]);

  const recenter = () => {
    setFollow(true);
    if (mapRef.current && lastPos.current) {
      mapRef.current.easeTo({ center: [lastPos.current.lng, lastPos.current.lat] as any, bearing: headingRef.current, pitch: 55, zoom: 17, duration: 800 });
    }
  };

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="w-full rounded-2xl overflow-hidden border border-border" style={{ height: '360px' }} />
      <button
        onClick={recenter}
        className={`absolute bottom-3 right-3 w-12 h-12 rounded-full shadow-lg flex items-center justify-center border border-border ${follow ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}
        aria-label="Follow my bus"
      >
        {follow ? <Navigation size={20} /> : <Compass size={20} />}
      </button>
    </div>
  );
}
