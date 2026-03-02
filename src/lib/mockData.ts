export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface BusRoute {
  id: string;
  name: string;
  stops: BusStop[];
  path: [number, number][];
}

export interface Bus {
  id: string;
  number: string;
  route: BusRoute;
  color: string;
  type: 'Standard' | 'Express' | 'Mini';
  driver: string;
  seatsAvailable: number;
  totalSeats: number;
  currentPosition: [number, number];
  heading: number;
  speed: number;
  isActive: boolean;
  currentStopIndex: number;
  eta?: number; // minutes
}

// Tamil Nadu routes
const route1Stops: BusStop[] = [
  { id: 's1', name: 'Chennai CMBT', lat: 13.0694, lng: 80.2002 },
  { id: 's2', name: 'Vellore', lat: 12.9165, lng: 79.1325 },
  { id: 's3', name: 'Salem', lat: 11.6643, lng: 78.1460 },
  { id: 's4', name: 'Erode', lat: 11.3410, lng: 77.7172 },
  { id: 's5', name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
];

const route1Path: [number, number][] = [
  [13.0694, 80.2002],
  [13.0100, 79.8500],
  [12.9165, 79.1325],
  [12.3000, 78.6500],
  [11.6643, 78.1460],
  [11.3410, 77.7172],
  [11.0168, 76.9558],
];

const route2Stops: BusStop[] = [
  { id: 's6', name: 'Chennai Egmore', lat: 13.0732, lng: 80.2609 },
  { id: 's7', name: 'Villupuram', lat: 11.9401, lng: 79.4861 },
  { id: 's8', name: 'Trichy', lat: 10.7905, lng: 78.7047 },
  { id: 's9', name: 'Madurai', lat: 9.9252, lng: 78.1198 },
];

const route2Path: [number, number][] = [
  [13.0732, 80.2609],
  [12.6100, 79.9500],
  [11.9401, 79.4861],
  [11.3500, 79.1000],
  [10.7905, 78.7047],
  [10.3600, 78.4200],
  [9.9252, 78.1198],
];

export const routes: BusRoute[] = [
  { id: 'r1', name: 'Chennai - Coimbatore Express', stops: route1Stops, path: route1Path },
  { id: 'r2', name: 'Chennai - Madurai Express', stops: route2Stops, path: route2Path },
];

export const initialBuses: Bus[] = [
  {
    id: 'b1',
    number: 'TN01',
    route: routes[0],
    color: '#3B82F6',
    type: 'Express',
    driver: 'Rajesh Kumar',
    seatsAvailable: 18,
    totalSeats: 48,
    currentPosition: [12.9165, 79.1325],
    heading: 220,
    speed: 65,
    isActive: true,
    currentStopIndex: 1,
    eta: 45,
  },
  {
    id: 'b2',
    number: 'TN02',
    route: routes[1],
    color: '#10B981',
    type: 'Express',
    driver: 'Murugan S',
    seatsAvailable: 5,
    totalSeats: 48,
    currentPosition: [10.7905, 78.7047],
    heading: 200,
    speed: 70,
    isActive: true,
    currentStopIndex: 2,
    eta: 90,
  },
  {
    id: 'b3',
    number: 'TN03',
    route: routes[0],
    color: '#F59E0B',
    type: 'Standard',
    driver: 'Senthil M',
    seatsAvailable: 22,
    totalSeats: 52,
    currentPosition: [11.3410, 77.7172],
    heading: 45,
    speed: 55,
    isActive: true,
    currentStopIndex: 3,
    eta: 120,
  },
];

export function interpolatePosition(
  path: [number, number][],
  progress: number
): { position: [number, number]; heading: number } {
  const totalSegments = path.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const t = segmentProgress - segmentIndex;

  const from = path[segmentIndex];
  const to = path[Math.min(segmentIndex + 1, path.length - 1)];

  const lat = from[0] + (to[0] - from[0]) * t;
  const lng = from[1] + (to[1] - from[1]) * t;

  const heading = Math.atan2(to[1] - from[1], to[0] - from[0]) * (180 / Math.PI);

  return { position: [lat, lng], heading };
}
