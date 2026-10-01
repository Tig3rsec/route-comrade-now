import type { TNRoute } from '@/lib/tnBusData';

// Parse "52 mins", "1h 20m", "50m" into minutes
export function parseMinutes(s: string): number {
  let m = 0;
  const h = s.match(/(\d+)\s*h/);
  if (h) m += parseInt(h[1]) * 60;
  const mm = s.match(/(\d+)\s*m/);
  if (mm) m += parseInt(mm[1]);
  return m;
}

export function frequencyMinutes(route: TNRoute): number {
  const f = route.frequency.match(/(\d+)/);
  return f ? parseInt(f[1]) : 15;
}

// TNSTC/MTC typical service window
const FIRST_DEP = 5 * 60; // 05:00
const LAST_DEP = 22 * 60 + 30; // 22:30

export const fmtTime = (mins: number) => {
  const d = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(d / 60), m = d % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
};

/** Next `count` scheduled arrival times (minutes since midnight) at a stop. */
export function nextArrivals(route: TNRoute, stopIdx: number, now = new Date(), count = 3): number[] {
  const freq = frequencyMinutes(route);
  const offset = parseMinutes(route.stops[stopIdx]?.cumulativeTime || '0');
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out: number[] = [];
  for (let dep = FIRST_DEP; dep <= LAST_DEP && out.length < count; dep += freq) {
    if (dep + offset >= nowMin) out.push(dep + offset);
  }
  if (out.length < count) {
    for (let dep = FIRST_DEP; out.length < count; dep += freq) out.push(dep + offset + 1440);
  }
  return out;
}

export const minsUntil = (t: number, now = new Date()) => Math.max(0, Math.round(t - (now.getHours() * 60 + now.getMinutes())));
