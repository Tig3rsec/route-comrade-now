// Blue pin marker with bus icon, styled like a navigation app pin.
const BUS_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 3v0M7 21v-3M17 21v-3"/><circle cx="8" cy="15" r="1" fill="white"/><circle cx="16" cy="15" r="1" fill="white"/></svg>`;

export function createBusPinElement(label: string, color = '#1a73e8', heading = 0, selected = false): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:scale(${selected ? 1.2 : 1});transform-origin:bottom center;transition:transform .3s">
      <div style="width:50px;height:50px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35);border:3px solid white;flex-direction:column">
        ${BUS_SVG}
        <span style="color:white;font:700 8px 'Space Grotesk',sans-serif;line-height:1;margin-top:1px;max-width:44px;overflow:hidden;white-space:nowrap">${label}</span>
      </div>
      <div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:12px solid ${color};margin-top:-2px"></div>
      <div class="bus-pin-dot" style="position:relative;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 6px ${color}33;margin-top:-2px">
        <div style="position:absolute;left:50%;top:-14px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid ${color};transform:translateX(-50%) rotate(${heading}deg);transform-origin:50% 22px"></div>
      </div>
    </div>`;
  return el;
}

/** Smoothly animate a marker between GPS fixes (Google-Maps-like glide). */
export function animateMarker(
  marker: { getLngLat: () => { lng: number; lat: number }; setLngLat: (c: [number, number]) => unknown },
  to: [number, number],
  duration = 1000,
) {
  const from = marker.getLngLat();
  const start = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - start) / duration);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    marker.setLngLat([from.lng + (to[0] - from.lng) * e, from.lat + (to[1] - from.lat) * e]);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toR = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toR(b.lng - a.lng)) * Math.cos(toR(b.lat));
  const x = Math.cos(toR(a.lat)) * Math.sin(toR(b.lat)) - Math.sin(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.cos(toR(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
