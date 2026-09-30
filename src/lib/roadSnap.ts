// Snap a bus moving between stops onto the real road polyline, Google-nav style.
type LngLat = [number, number];

const dist = (a: LngLat, b: LngLat) => {
  const dx = (a[0] - b[0]) * Math.cos((a[1] * Math.PI) / 180);
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const cache = new WeakMap<LngLat[], { cum: number[]; stopIdx: number[] | null; key: string }>();

function prep(road: LngLat[], stops: { lat: number; lng: number }[]) {
  const key = stops.map((s) => `${s.lat},${s.lng}`).join('|');
  const c = cache.get(road);
  if (c && c.key === key) return c;
  const cum = [0];
  for (let i = 1; i < road.length; i++) cum.push(cum[i - 1] + dist(road[i - 1], road[i]));
  // nearest road vertex for each stop, forced monotonic
  let last = 0;
  const stopIdx = stops.map((s) => {
    let best = last, bd = Infinity;
    for (let i = last; i < road.length; i++) {
      const d = dist(road[i], [s.lng, s.lat]);
      if (d < bd) { bd = d; best = i; }
    }
    last = best;
    return best;
  });
  const out = { cum, stopIdx, key };
  cache.set(road, out);
  return out;
}

/** Returns snapped position and heading (degrees, 0 = north). */
export function snapToRoad(
  road: LngLat[] | undefined,
  stops: { lat: number; lng: number }[],
  stopIndex: number,
  progress: number,
): { lng: number; lat: number; heading: number } | null {
  if (!road || road.length < 2 || stops.length < 2) return null;
  const { cum, stopIdx } = prep(road, stops);
  const a = stopIdx![Math.min(stopIndex, stops.length - 1)];
  const b = stopIdx![Math.min(stopIndex + 1, stops.length - 1)];
  const target = cum[a] + (cum[b] - cum[a]) * progress;
  let i = a;
  while (i < road.length - 2 && cum[i + 1] < target) i++;
  const seg = cum[i + 1] - cum[i] || 1;
  const t = Math.max(0, Math.min(1, (target - cum[i]) / seg));
  const p0 = road[i], p1 = road[i + 1];
  const lng = p0[0] + (p1[0] - p0[0]) * t;
  const lat = p0[1] + (p1[1] - p0[1]) * t;
  const heading = ((Math.atan2((p1[0] - p0[0]) * Math.cos((lat * Math.PI) / 180), p1[1] - p0[1]) * 180) / Math.PI + 360) % 360;
  return { lng, lat, heading };
}

/** Top-down vehicle icon that rotates with road direction. */
export function createVehicleElement(label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '44px';
  el.style.height = '44px';
  el.innerHTML = `
    <div class="veh-rot" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;will-change:transform">
      <svg viewBox="0 0 40 40" width="44" height="44">
        <circle cx="20" cy="20" r="19" fill="#1a73e8" fill-opacity="0.18"/>
        <rect x="13" y="6" width="14" height="28" rx="4" fill="#1a73e8" stroke="white" stroke-width="2"/>
        <rect x="15" y="9" width="10" height="5" rx="1.5" fill="white" fill-opacity="0.9"/>
        <rect x="15" y="28" width="10" height="3" rx="1" fill="white" fill-opacity="0.6"/>
        <path d="M20 0 L25 6 L15 6 Z" fill="#1a73e8" stroke="white" stroke-width="1.5"/>
      </svg>
    </div>
    <div style="position:absolute;top:46px;left:50%;transform:translateX(-50%);background:#1a73e8;color:white;font:700 10px 'Space Grotesk',sans-serif;padding:2px 8px;border-radius:8px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.35)">${label}</div>`;
  return el;
}
