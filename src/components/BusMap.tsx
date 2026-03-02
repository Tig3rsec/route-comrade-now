import { useEffect, useRef, useCallback } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { Bus } from '@/lib/mockData';
import type { RouteWithStops } from '@/hooks/useAllRoutes';
import type { TNRoute } from '@/lib/tnBusData';

const TOMTOM_API_KEY = 'ZIqVy8Z5Xe97tgcDulimtx3jMDEH9qRj';

function createBusEmojiMarker(bus: Bus, isSelected: boolean): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.className = 'bus-marker-container';
  el.innerHTML = `
    <div style="
      position: relative;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform: scale(${isSelected ? 1.3 : 1});
    ">
      <div style="
        position: absolute;
        inset: -6px;
        background: ${bus.color};
        border-radius: 50%;
        opacity: ${isSelected ? 0.25 : 0.15};
        animation: bus-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>
      ${isSelected ? `<div style="
        position: absolute;
        inset: -12px;
        border: 2px solid ${bus.color};
        border-radius: 50%;
        opacity: 0.3;
        animation: bus-ring 2s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>` : ''}
      <div style="
        font-size: 30px;
        line-height: 1;
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.6));
        transform: scaleX(${bus.heading > 90 && bus.heading < 270 ? -1 : 1});
        transition: transform 1.5s ease;
      ">🚌</div>
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bus.color};
        color: white;
        font-size: 9px;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
        padding: 2px 6px;
        border-radius: 6px;
        white-space: nowrap;
        box-shadow: 0 2px 10px ${bus.color}88;
        letter-spacing: 0.5px;
      ">${bus.number}</div>
      <div style="
        position: absolute;
        top: 2px;
        right: 2px;
        width: 10px;
        height: 10px;
        background: ${bus.isActive ? '#10B981' : '#EF4444'};
        border-radius: 50%;
        border: 2px solid rgba(15,23,42,0.9);
        box-shadow: 0 0 6px ${bus.isActive ? '#10B98188' : '#EF444488'};
      "></div>
    </div>
  `;
  return el;
}

function createTNBusMarker(routeNumber: string, lat: number, lng: number, color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        inset: -4px;
        background: ${color};
        border-radius: 50%;
        opacity: 0.2;
        animation: bus-pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>
      <div style="
        font-size: 26px;
        line-height: 1;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      ">🚌</div>
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        font-size: 8px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        padding: 1px 5px;
        border-radius: 5px;
        white-space: nowrap;
        box-shadow: 0 2px 8px ${color}66;
      ">${routeNumber}</div>
    </div>
  `;
  return el;
}

function createStopMarkerElement(isHighlighted = false, stopName?: string, isJourneyStop = false): HTMLDivElement {
  const el = document.createElement('div');
  const size = isHighlighted || isJourneyStop ? 20 : 14;
  const borderColor = isJourneyStop
    ? 'hsl(210, 100%, 56%)'
    : isHighlighted
    ? 'hsl(160, 84%, 44%)'
    : 'hsl(210, 100%, 56%)';

  el.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    ">
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${isJourneyStop ? borderColor : 'hsl(0 0% 7%)'};
        border: 2.5px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 0 ${isHighlighted || isJourneyStop ? '14' : '8'}px ${borderColor.replace(')', ' / 0.5)')};
        ${isHighlighted || isJourneyStop ? 'animation: bus-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;' : ''}
      "></div>
      ${(isHighlighted || isJourneyStop) && stopName ? `
        <div style="
          background: hsl(0 0% 7% / 0.95);
          border: 1px solid ${borderColor.replace(')', ' / 0.4)')};
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-family: 'Space Grotesk', sans-serif;
          color: ${borderColor};
          white-space: nowrap;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        ">${stopName}</div>
      ` : ''}
    </div>
  `;
  return el;
}

function createUserMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="
      width: 24px;
      height: 24px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        inset: -8px;
        background: hsl(210 100% 56% / 0.2);
        border-radius: 50%;
        animation: bus-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>
      <div style="
        position: absolute;
        inset: -4px;
        background: hsl(210 100% 56% / 0.15);
        border-radius: 50%;
      "></div>
      <div style="
        width: 16px;
        height: 16px;
        background: hsl(210, 100%, 56%);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 16px hsl(210 100% 56% / 0.6);
      "></div>
    </div>
  `;
  return el;
}

function createJourneyMarkerElement(type: 'from' | 'to'): HTMLDivElement {
  const el = document.createElement('div');
  const color = type === 'from' ? 'hsl(145, 72%, 40%)' : 'hsl(0, 78%, 50%)';
  const label = type === 'from' ? 'A' : 'B';
  el.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px ${color.replace(')', ' / 0.5)')};
        border: 2px solid white;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
        ">${label}</span>
      </div>
      <div style="
        width: 3px;
        height: 6px;
        background: ${color};
        opacity: 0.6;
        border-radius: 0 0 2px 2px;
      "></div>
    </div>
  `;
  return el;
}

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
const TN_ROUTE_COLORS: Record<string, string> = {
  local: '#10B981',
  express: '#3B82F6',
  deluxe: '#F59E0B',
  'ultra-deluxe': '#EF4444',
};

import type { MapStyleId } from './MapStyleSwitcher';

const TOMTOM_STYLE_MAP: Record<MapStyleId, string> = {
  night: 'basic_night',
  day: 'basic_main',
  satellite: 'hybrid_main',
  terrain: 'basic_main',
  hybrid: 'hybrid_main',
};

interface BusMapProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onSelectBus: (bus: Bus) => void;
  userLocation?: [number, number];
  routes?: RouteWithStops[];
  selectedRouteId?: string | null;
  highlightedRouteIds?: string[];
  highlightedStopName?: string | null;
  flyTo?: { lat: number; lng: number; zoom: number } | null;
  onFlyToDone?: () => void;
  // Journey planner
  journeyFrom?: { lat: number; lng: number; name: string } | null;
  journeyTo?: { lat: number; lng: number; name: string } | null;
  // TN Route tracking
  trackedTNRoute?: TNRoute | null;
  tnBusPosition?: { lat: number; lng: number } | null;
  // Map style
  mapStyle?: MapStyleId;
}

export default function BusMap({
  buses, selectedBus, onSelectBus, userLocation,
  routes = [], selectedRouteId, highlightedRouteIds = [],
  highlightedStopName, flyTo, onFlyToDone,
  journeyFrom, journeyTo, trackedTNRoute, tnBusPosition,
  mapStyle = 'night',
}: BusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<tt.Map | null>(null);
  const markersRef = useRef<tt.Marker[]>([]);
  const routeLayersRef = useRef<string[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const activeBus = buses.find(b => b.isActive);
    const center: [number, number] = userLocation
      ? [userLocation[1], userLocation[0]]
      : activeBus
      ? [activeBus.currentPosition[1], activeBus.currentPosition[0]]
      : [78.6569, 11.1271];

    const map = tt.map({
      key: TOMTOM_API_KEY,
      container: mapContainerRef.current,
      center,
      zoom: userLocation ? 13 : 7,
      style: { map: TOMTOM_STYLE_MAP[mapStyle] } as any,
    });

    mapRef.current = map;

    // Add custom CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bus-pulse {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.05; transform: scale(1.8); }
      }
      @keyframes bus-ring {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0; transform: scale(1.6); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      mapRef.current = null;
      style.remove();
    };
  }, []);

  // Handle map style change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const styleName = TOMTOM_STYLE_MAP[mapStyle];
    try {
      (map as any).setStyle({ map: styleName });
    } catch (e) {
      console.warn('Style change error:', e);
    }
  }, [mapStyle]);

  // Handle flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;

    map.easeTo({
      center: [flyTo.lng, flyTo.lat] as any,
      zoom: flyTo.zoom,
      duration: 1200,
    });
    onFlyToDone?.();
  }, [flyTo, onFlyToDone]);

  // Update markers & routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    routeLayersRef.current.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    routeLayersRef.current = [];

    const activeBuses = buses.filter(b => b.isActive);
    const activeRouteIds = new Set(activeBuses.map(b => b.route.id));

    const addLayers = () => {
      // Draw TN tracked route polyline
      if (trackedTNRoute) {
        const coords = trackedTNRoute.stops.map(s => [s.lng, s.lat]);
        const sourceId = 'tn-tracked-route';
        const layerId = 'tn-tracked-route-layer';
        const glowLayerId = 'tn-tracked-route-glow';
        const color = TN_ROUTE_COLORS[trackedTNRoute.type] || '#3B82F6';

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: coords },
            },
          });
        }

        // Glow layer
        if (!map.getLayer(glowLayerId)) {
          map.addLayer({
            id: glowLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 12,
              'line-opacity': 0.15,
              'line-blur': 8,
            },
          });
        }

        // Main line
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 4,
              'line-opacity': 0.9,
            },
          });
        }

        routeLayersRef.current.push(sourceId, layerId, glowLayerId);

        // Stop markers for tracked route
        trackedTNRoute.stops.forEach(stop => {
          const marker = new tt.Marker({
            element: createStopMarkerElement(true, stop.name, false),
          })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map);
          markersRef.current.push(marker);
        });

        // Simulated bus marker
        if (tnBusPosition) {
          const tnBusEl = createTNBusMarker(trackedTNRoute.routeNumber, tnBusPosition.lat, tnBusPosition.lng, color);
          const marker = new tt.Marker({ element: tnBusEl })
            .setLngLat([tnBusPosition.lng, tnBusPosition.lat])
            .addTo(map);
          markersRef.current.push(marker);
        }
      }

      // Draw DB routes
      routes.forEach((route, idx) => {
        if (route.path.length < 2) return;
        if (activeRouteIds.has(route.id)) return;

        const sourceId = `db-route-${route.id}`;
        const layerId = `db-route-layer-${route.id}`;
        const isSelected = selectedRouteId === route.id;
        const isHighlighted = highlightedRouteIds.includes(route.id);
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.path.map(([lat, lng]) => [lng, lat]),
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
              'line-color': color,
              'line-width': (isSelected || isHighlighted) ? 4 : 2,
              'line-opacity': (isSelected || isHighlighted) ? 0.85 : 0.2,
              'line-dasharray': (isSelected || isHighlighted) ? [1] : [4, 4],
            },
          });
        }
        routeLayersRef.current.push(sourceId, layerId);

        if (isSelected || isHighlighted) {
          route.stops.forEach(stop => {
            const isThisStop = highlightedStopName && stop.name.toLowerCase() === highlightedStopName.toLowerCase();
            const marker = new tt.Marker({
              element: createStopMarkerElement(true, isThisStop ? stop.name : undefined),
            })
              .setLngLat([stop.lng, stop.lat])
              .addTo(map);
            markersRef.current.push(marker);
          });
        }
      });

      // Active bus routes
      activeBuses.forEach((bus) => {
        if (bus.route.path.length < 2) return;
        const sourceId = `route-${bus.id}`;
        const layerId = `route-layer-${bus.id}`;
        const glowId = `route-glow-${bus.id}`;
        const isSelected = selectedBus?.id === bus.id;
        const isHighlighted = highlightedRouteIds.includes(bus.route.id);

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: bus.route.path.map(([lat, lng]) => [lng, lat]),
              },
            },
          });
        }

        // Glow for selected
        if (isSelected && !map.getLayer(glowId)) {
          map.addLayer({
            id: glowId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': bus.color,
              'line-width': 14,
              'line-opacity': 0.1,
              'line-blur': 8,
            },
          });
          routeLayersRef.current.push(glowId);
        }

        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': bus.color,
              'line-width': (isSelected || isHighlighted) ? 5 : 3,
              'line-opacity': (isSelected || isHighlighted) ? 0.9 : 0.3,
              'line-dasharray': (isSelected || isHighlighted) ? [1] : [2, 2],
            },
          });
        }
        routeLayersRef.current.push(sourceId, layerId);
      });
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('styledata', addLayers);
    }

    // Stop markers (non-highlighted)
    if (!highlightedStopName && !trackedTNRoute) {
      const seen = new Set<string>();
      activeBuses
        .flatMap(b => b.route.stops)
        .filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; })
        .forEach(stop => {
          const marker = new tt.Marker({ element: createStopMarkerElement() })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map);
          markersRef.current.push(marker);
        });
    }

    // Bus markers
    activeBuses.forEach(bus => {
      const isSelected = selectedBus?.id === bus.id;
      const el = createBusEmojiMarker(bus, isSelected);
      el.addEventListener('click', () => onSelectBus(bus));
      const marker = new tt.Marker({ element: el })
        .setLngLat([bus.currentPosition[1], bus.currentPosition[0]])
        .addTo(map);
      markersRef.current.push(marker);
    });

    // User location
    if (userLocation) {
      const marker = new tt.Marker({ element: createUserMarkerElement() })
        .setLngLat([userLocation[1], userLocation[0]])
        .addTo(map);
      markersRef.current.push(marker);
    }

    // Journey markers
    if (journeyFrom) {
      const marker = new tt.Marker({ element: createJourneyMarkerElement('from') })
        .setLngLat([journeyFrom.lng, journeyFrom.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
    if (journeyTo) {
      const marker = new tt.Marker({ element: createJourneyMarkerElement('to') })
        .setLngLat([journeyTo.lng, journeyTo.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [buses, selectedBus, userLocation, onSelectBus, routes, selectedRouteId, highlightedRouteIds, highlightedStopName, trackedTNRoute, tnBusPosition, journeyFrom, journeyTo]);

  // Fly to selected bus smoothly
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBus) return;

    map.easeTo({
      center: [selectedBus.currentPosition[1], selectedBus.currentPosition[0]] as any,
      zoom: 15,
      duration: 1200,
    });
  }, [selectedBus?.currentPosition[0], selectedBus?.currentPosition[1]]);

  return (
    <div ref={mapContainerRef} className="w-full h-full" />
  );
}
