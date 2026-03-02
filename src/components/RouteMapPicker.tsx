import { useEffect, useRef, useState, useCallback } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const TOMTOM_API_KEY = 'ZIqVy8Z5Xe97tgcDulimtx3jMDEH9qRj';

interface RouteMapPickerProps {
  stops: { name: string; lat: number; lng: number }[];
  onAddStop: (lat: number, lng: number) => void;
  onUpdateStopPosition?: (index: number, lat: number, lng: number) => void;
  height?: string;
}

export default function RouteMapPicker({ stops, onAddStop, onUpdateStopPosition, height = '300px' }: RouteMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<tt.Map | null>(null);
  const markersRef = useRef<tt.Marker[]>([]);
  const routeLayerRef = useRef<string[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] = stops.length > 0
      ? [stops[0].lng, stops[0].lat]
      : [80.2707, 13.0827]; // Chennai default

    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: mapContainerRef.current,
      center,
      zoom: stops.length > 0 ? 12 : 8,
    });

    // Click to add stop
    map.on('click', (e: any) => {
      const { lat, lng } = e.lngLat;
      onAddStop(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and route line when stops change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear old route layers
    routeLayerRef.current.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    routeLayerRef.current = [];

    // Add stop markers
    stops.forEach((stop, idx) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: grab;
        ">
          <div style="
            width: 28px;
            height: 28px;
            background: ${idx === 0 ? 'hsl(145, 72%, 40%)' : idx === stops.length - 1 ? 'hsl(0, 78%, 50%)' : 'hsl(210, 100%, 56%)'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 700;
            font-family: 'Space Grotesk', sans-serif;
            box-shadow: 0 3px 12px rgba(0,0,0,0.4);
            border: 2px solid white;
          ">${idx + 1}</div>
          ${stop.name ? `<div style="
            margin-top: 2px;
            background: rgba(15,23,42,0.9);
            color: white;
            font-size: 9px;
            padding: 1px 6px;
            border-radius: 4px;
            font-family: 'Space Grotesk', sans-serif;
            white-space: nowrap;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${stop.name}</div>` : ''}
        </div>
      `;

      const marker = new tt.Marker({ element: el, draggable: true })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        onUpdateStopPosition?.(idx, pos.lat, pos.lng);
      });

      markersRef.current.push(marker);
    });

    // Draw route line
    if (stops.length >= 2) {
      const addLine = () => {
        const sourceId = 'route-builder-source';
        const layerId = 'route-builder-layer';

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: stops.map(s => [s.lng, s.lat]),
              },
            },
          });
        }

        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#3B82F6',
              'line-width': 3,
              'line-opacity': 0.7,
              'line-dasharray': [2, 2],
            },
          });
        }

        routeLayerRef.current = [sourceId, layerId];
      };

      if (map.isStyleLoaded()) addLine();
      else map.once('styledata', addLine);
    }
  }, [stops, onUpdateStopPosition]);

  return (
    <div>
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl overflow-hidden border border-border"
        style={{ height }}
      />
      <p className="text-muted-foreground text-[10px] mt-1.5 text-center">
        👆 Tap on map to add stops • Drag markers to reposition
      </p>
    </div>
  );
}
