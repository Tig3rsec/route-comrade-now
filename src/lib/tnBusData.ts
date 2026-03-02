// Comprehensive Tamil Nadu Bus Stops & Routes Database

export interface TNBusStop {
  id: string;
  name: string;
  tamil: string;
  lat: number;
  lng: number;
  district: string;
  amenities: ('shelter' | 'water' | 'seating' | 'toilet')[];
  type: 'major' | 'town' | 'local';
}

export interface TNRouteStop extends TNBusStop {
  stopOrder: number;
  distanceToNext: string;
  timeToNext: string;
  cumulativeDistance: string;
  cumulativeTime: string;
  arrived: boolean;
  trafficCondition: 'green' | 'yellow' | 'red';
}

export interface TNRoute {
  id: string;
  routeNumber: string;
  name: string;
  tamil: string;
  from: string;
  to: string;
  stops: TNRouteStop[];
  totalDistance: string;
  totalTime: string;
  busPosition: { stopIndex: number; progress: number };
  type: 'local' | 'express' | 'deluxe' | 'ultra-deluxe';
  frequency: string;
}

// ==========================================
// ALL MAJOR BUS STANDS IN TAMIL NADU
// ==========================================

export const tnBusStands: TNBusStop[] = [
  // Chennai
  { id: 'cmbt', name: 'CMBT Koyambedu', tamil: 'கோயம்பேடு', lat: 13.0694, lng: 80.1948, district: 'Chennai', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'broadway', name: 'Broadway', tamil: 'பிராட்வே', lat: 13.0878, lng: 80.2785, district: 'Chennai', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'tambaram', name: 'Tambaram', tamil: 'தாம்பரம்', lat: 12.9249, lng: 80.1000, district: 'Chennai', amenities: ['shelter', 'water', 'seating'], type: 'major' },
  { id: 'egmore', name: 'Egmore', tamil: 'எழும்பூர்', lat: 13.0732, lng: 80.2609, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'tnagar', name: 'T. Nagar', tamil: 'தி.நகர்', lat: 13.0418, lng: 80.2341, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'adyar', name: 'Adyar', tamil: 'அடையாறு', lat: 13.0063, lng: 80.2574, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'vadapalani', name: 'Vadapalani', tamil: 'வடபழனி', lat: 13.0500, lng: 80.2125, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'guindy', name: 'Guindy', tamil: 'கிண்டி', lat: 13.0067, lng: 80.2206, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'porur', name: 'Porur', tamil: 'போரூர்', lat: 13.0382, lng: 80.1584, district: 'Chennai', amenities: ['shelter'], type: 'local' },
  { id: 'avadi', name: 'Avadi', tamil: 'ஆவடி', lat: 13.1067, lng: 80.0970, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'ambattur', name: 'Ambattur', tamil: 'அம்பத்தூர்', lat: 13.0987, lng: 80.1474, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'poonamallee', name: 'Poonamallee', tamil: 'பூந்தமல்லி', lat: 13.0468, lng: 80.0914, district: 'Chennai', amenities: ['shelter', 'water'], type: 'town' },
  { id: 'thiruvottiyur', name: 'Thiruvottiyur', tamil: 'திருவொற்றியூர்', lat: 13.1594, lng: 80.3003, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'mylapore', name: 'Mylapore', tamil: 'மயிலாப்பூர்', lat: 13.0339, lng: 80.2696, district: 'Chennai', amenities: ['shelter'], type: 'local' },
  { id: 'chromepet', name: 'Chromepet', tamil: 'குரோம்பேட்டை', lat: 12.9516, lng: 80.1462, district: 'Chennai', amenities: ['shelter', 'seating'], type: 'town' },

  // Coimbatore
  { id: 'gandhipuram', name: 'Gandhipuram', tamil: 'காந்திபுரம்', lat: 11.0168, lng: 76.9558, district: 'Coimbatore', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'ukkadam', name: 'Ukkadam', tamil: 'உக்கடம்', lat: 10.9925, lng: 76.9614, district: 'Coimbatore', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'singanallur', name: 'Singanallur', tamil: 'சிங்காநல்லூர்', lat: 10.9965, lng: 77.0048, district: 'Coimbatore', amenities: ['shelter', 'seating'], type: 'town' },
  { id: 'peelamedu', name: 'Peelamedu', tamil: 'பீளமேடு', lat: 11.0245, lng: 77.0196, district: 'Coimbatore', amenities: ['shelter'], type: 'local' },
  { id: 'saibaba_colony', name: 'Saibaba Colony', tamil: 'சாய்பாபா காலனி', lat: 11.0245, lng: 76.9394, district: 'Coimbatore', amenities: ['shelter', 'seating'], type: 'local' },

  // Madurai
  { id: 'mattuthavani', name: 'Mattuthavani', tamil: 'மாட்டுத்தாவணி', lat: 9.9400, lng: 78.1450, district: 'Madurai', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'periyar', name: 'Periyar Bus Stand', tamil: 'பெரியார் பேருந்து நிலையம்', lat: 9.9252, lng: 78.1198, district: 'Madurai', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'arappalayam', name: 'Arappalayam', tamil: 'அரப்பாளையம்', lat: 9.9350, lng: 78.1095, district: 'Madurai', amenities: ['shelter', 'seating'], type: 'town' },

  // Trichy
  { id: 'trichy_central', name: 'Trichy Central', tamil: 'திருச்சி மத்திய', lat: 10.7905, lng: 78.7047, district: 'Trichy', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'chatram', name: 'Chatram Bus Stand', tamil: 'சத்திரம் பேருந்து நிலையம்', lat: 10.8050, lng: 78.6850, district: 'Trichy', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'srirangam', name: 'Srirangam', tamil: 'ஸ்ரீரங்கம்', lat: 10.8627, lng: 78.6927, district: 'Trichy', amenities: ['shelter', 'seating'], type: 'town' },

  // Salem
  { id: 'salem_new', name: 'Salem New Bus Stand', tamil: 'சேலம் புதிய பேருந்து நிலையம்', lat: 11.6643, lng: 78.1460, district: 'Salem', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },
  { id: 'salem_old', name: 'Salem Old Bus Stand', tamil: 'சேலம் பழைய பேருந்து நிலையம்', lat: 11.6500, lng: 78.1550, district: 'Salem', amenities: ['shelter', 'seating'], type: 'town' },

  // Erode
  { id: 'erode', name: 'Erode Bus Stand', tamil: 'ஈரோடு பேருந்து நிலையம்', lat: 11.3410, lng: 77.7172, district: 'Erode', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Tirunelveli
  { id: 'tirunelveli', name: 'Tirunelveli New Bus Stand', tamil: 'திருநெல்வேலி புதிய பேருந்து நிலையம்', lat: 8.7139, lng: 77.7567, district: 'Tirunelveli', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Vellore
  { id: 'vellore', name: 'Vellore Bus Stand', tamil: 'வேலூர் பேருந்து நிலையம்', lat: 12.9165, lng: 79.1325, district: 'Vellore', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Puducherry
  { id: 'puducherry', name: 'Puducherry Bus Stand', tamil: 'புதுச்சேரி பேருந்து நிலையம்', lat: 11.9340, lng: 79.8306, district: 'Puducherry', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Thanjavur
  { id: 'thanjavur', name: 'Thanjavur Bus Stand', tamil: 'தஞ்சாவூர் பேருந்து நிலையம்', lat: 10.7870, lng: 79.1378, district: 'Thanjavur', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Tiruppur
  { id: 'tiruppur', name: 'Tiruppur Bus Stand', tamil: 'திருப்பூர் பேருந்து நிலையம்', lat: 11.1085, lng: 77.3411, district: 'Tiruppur', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Dindigul
  { id: 'dindigul', name: 'Dindigul Bus Stand', tamil: 'திண்டுக்கல் பேருந்து நிலையம்', lat: 10.3624, lng: 77.9695, district: 'Dindigul', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Nagercoil
  { id: 'nagercoil', name: 'Nagercoil Bus Stand', tamil: 'நாகர்கோவில் பேருந்து நிலையம்', lat: 8.1833, lng: 77.4119, district: 'Kanyakumari', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Kanyakumari
  { id: 'kanyakumari', name: 'Kanyakumari Bus Stand', tamil: 'கன்னியாகுமரி பேருந்து நிலையம்', lat: 8.0883, lng: 77.5385, district: 'Kanyakumari', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Hosur
  { id: 'hosur', name: 'Hosur Bus Stand', tamil: 'ஓசூர் பேருந்து நிலையம்', lat: 12.7409, lng: 77.8253, district: 'Krishnagiri', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Villupuram
  { id: 'villupuram', name: 'Villupuram Bus Stand', tamil: 'விழுப்புரம் பேருந்து நிலையம்', lat: 11.9401, lng: 79.4861, district: 'Villupuram', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Cuddalore
  { id: 'cuddalore', name: 'Cuddalore Bus Stand', tamil: 'கடலூர் பேருந்து நிலையம்', lat: 11.7480, lng: 79.7714, district: 'Cuddalore', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Karur
  { id: 'karur', name: 'Karur Bus Stand', tamil: 'கரூர் பேருந்து நிலையம்', lat: 10.9601, lng: 78.0766, district: 'Karur', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Kumbakonam
  { id: 'kumbakonam', name: 'Kumbakonam Bus Stand', tamil: 'கும்பகோணம் பேருந்து நிலையம்', lat: 10.9617, lng: 79.3881, district: 'Thanjavur', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Thoothukudi
  { id: 'thoothukudi', name: 'Thoothukudi Bus Stand', tamil: 'தூத்துக்குடி பேருந்து நிலையம்', lat: 8.7642, lng: 78.1348, district: 'Thoothukudi', amenities: ['shelter', 'water', 'seating', 'toilet'], type: 'major' },

  // Ramanathapuram
  { id: 'ramanathapuram', name: 'Ramanathapuram Bus Stand', tamil: 'ராமநாதபுரம் பேருந்து நிலையம்', lat: 9.3639, lng: 78.8395, district: 'Ramanathapuram', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Sivaganga
  { id: 'sivaganga', name: 'Sivaganga Bus Stand', tamil: 'சிவகங்கை பேருந்து நிலையம்', lat: 10.1283, lng: 78.4872, district: 'Sivaganga', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Dharmapuri
  { id: 'dharmapuri', name: 'Dharmapuri Bus Stand', tamil: 'தர்மபுரி பேருந்து நிலையம்', lat: 12.1211, lng: 78.1582, district: 'Dharmapuri', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Namakkal
  { id: 'namakkal', name: 'Namakkal Bus Stand', tamil: 'நாமக்கல் பேருந்து நிலையம்', lat: 11.2189, lng: 78.1674, district: 'Namakkal', amenities: ['shelter', 'water', 'seating'], type: 'major' },

  // Krishnagiri
  { id: 'krishnagiri', name: 'Krishnagiri Bus Stand', tamil: 'கிருஷ்ணகிரி பேருந்து நிலையம்', lat: 12.5186, lng: 78.2138, district: 'Krishnagiri', amenities: ['shelter', 'water', 'seating'], type: 'major' },
];

// ==========================================
// DETAILED LOCAL ROUTES
// ==========================================

function makeStop(
  stand: TNBusStop, order: number,
  distNext: string, timeNext: string,
  cumDist: string, cumTime: string,
  arrived: boolean, traffic: 'green' | 'yellow' | 'red'
): TNRouteStop {
  return { ...stand, stopOrder: order, distanceToNext: distNext, timeToNext: timeNext, cumulativeDistance: cumDist, cumulativeTime: cumTime, arrived, trafficCondition: traffic };
}

const findStop = (id: string) => tnBusStands.find(s => s.id === id)!;

export const tnRoutes: TNRoute[] = [
  // Route 109: Koyambedu → Broadway (Chennai city)
  {
    id: 'tn-109',
    routeNumber: '109',
    name: 'Koyambedu → Broadway',
    tamil: 'கோயம்பேடு → பிராட்வே',
    from: 'Koyambedu',
    to: 'Broadway',
    type: 'local',
    frequency: 'Every 10 mins',
    totalDistance: '18.4 km',
    totalTime: '52 mins',
    busPosition: { stopIndex: 3, progress: 0.6 },
    stops: [
      makeStop(findStop('cmbt'), 1, '2.3 km', '7 mins', '0 km', '0 mins', true, 'green'),
      makeStop(findStop('vadapalani'), 2, '3.1 km', '9 mins', '2.3 km', '7 mins', true, 'green'),
      makeStop(findStop('tnagar'), 3, '2.8 km', '8 mins', '5.4 km', '16 mins', true, 'yellow'),
      makeStop(findStop('egmore'), 4, '4.2 km', '12 mins', '8.2 km', '24 mins', false, 'red'),
      makeStop(findStop('broadway'), 5, '0 km', '—', '18.4 km', '52 mins', false, 'yellow'),
    ],
  },

  // Route 15A: Tambaram → Broadway
  {
    id: 'tn-15a',
    routeNumber: '15A',
    name: 'Tambaram → Broadway',
    tamil: 'தாம்பரம் → பிராட்வே',
    from: 'Tambaram',
    to: 'Broadway',
    type: 'local',
    frequency: 'Every 8 mins',
    totalDistance: '28.5 km',
    totalTime: '75 mins',
    busPosition: { stopIndex: 2, progress: 0.4 },
    stops: [
      makeStop(findStop('tambaram'), 1, '3.5 km', '10 mins', '0 km', '0 mins', true, 'green'),
      makeStop(findStop('chromepet'), 2, '4.2 km', '12 mins', '3.5 km', '10 mins', true, 'green'),
      makeStop(findStop('guindy'), 3, '5.8 km', '15 mins', '7.7 km', '22 mins', false, 'yellow'),
      makeStop(findStop('tnagar'), 4, '3.1 km', '9 mins', '13.5 km', '37 mins', false, 'yellow'),
      makeStop(findStop('egmore'), 5, '4.2 km', '12 mins', '16.6 km', '46 mins', false, 'red'),
      makeStop(findStop('broadway'), 6, '0 km', '—', '28.5 km', '75 mins', false, 'yellow'),
    ],
  },

  // Route 27C: Avadi → Adyar
  {
    id: 'tn-27c',
    routeNumber: '27C',
    name: 'Avadi → Adyar',
    tamil: 'ஆவடி → அடையாறு',
    from: 'Avadi',
    to: 'Adyar',
    type: 'local',
    frequency: 'Every 12 mins',
    totalDistance: '32.1 km',
    totalTime: '85 mins',
    busPosition: { stopIndex: 1, progress: 0.8 },
    stops: [
      makeStop(findStop('avadi'), 1, '4.1 km', '11 mins', '0 km', '0 mins', true, 'green'),
      makeStop(findStop('ambattur'), 2, '5.5 km', '14 mins', '4.1 km', '11 mins', false, 'green'),
      makeStop(findStop('vadapalani'), 3, '6.2 km', '16 mins', '9.6 km', '25 mins', false, 'yellow'),
      makeStop(findStop('tnagar'), 4, '4.8 km', '13 mins', '15.8 km', '41 mins', false, 'red'),
      makeStop(findStop('guindy'), 5, '5.1 km', '14 mins', '20.6 km', '54 mins', false, 'yellow'),
      makeStop(findStop('adyar'), 6, '0 km', '—', '32.1 km', '85 mins', false, 'green'),
    ],
  },

  // Express: Chennai → Coimbatore
  {
    id: 'tn-exp-cbe',
    routeNumber: 'EXP-1',
    name: 'Chennai → Coimbatore Express',
    tamil: 'சென்னை → கோயம்புத்தூர் விரைவு',
    from: 'Chennai',
    to: 'Coimbatore',
    type: 'express',
    frequency: 'Every 30 mins',
    totalDistance: '505 km',
    totalTime: '8h 30m',
    busPosition: { stopIndex: 2, progress: 0.3 },
    stops: [
      makeStop(findStop('cmbt'), 1, '135 km', '2h 15m', '0 km', '0h', true, 'green'),
      makeStop(findStop('vellore'), 2, '110 km', '1h 45m', '135 km', '2h 15m', true, 'green'),
      makeStop(findStop('salem_new'), 3, '65 km', '1h 10m', '245 km', '4h', false, 'yellow'),
      makeStop(findStop('erode'), 4, '80 km', '1h 20m', '310 km', '5h 10m', false, 'green'),
      makeStop(findStop('tiruppur'), 5, '55 km', '50m', '390 km', '6h 30m', false, 'green'),
      makeStop(findStop('gandhipuram'), 6, '0 km', '—', '505 km', '8h 30m', false, 'green'),
    ],
  },

  // Express: Chennai → Madurai
  {
    id: 'tn-exp-mdu',
    routeNumber: 'EXP-2',
    name: 'Chennai → Madurai Express',
    tamil: 'சென்னை → மதுரை விரைவு',
    from: 'Chennai',
    to: 'Madurai',
    type: 'express',
    frequency: 'Every 20 mins',
    totalDistance: '462 km',
    totalTime: '7h 45m',
    busPosition: { stopIndex: 3, progress: 0.5 },
    stops: [
      makeStop(findStop('cmbt'), 1, '160 km', '2h 30m', '0 km', '0h', true, 'green'),
      makeStop(findStop('villupuram'), 2, '95 km', '1h 30m', '160 km', '2h 30m', true, 'green'),
      makeStop(findStop('trichy_central'), 3, '70 km', '1h 10m', '255 km', '4h', true, 'yellow'),
      makeStop(findStop('dindigul'), 4, '90 km', '1h 30m', '325 km', '5h 10m', false, 'green'),
      makeStop(findStop('mattuthavani'), 5, '0 km', '—', '462 km', '7h 45m', false, 'green'),
    ],
  },

  // Coimbatore city: Gandhipuram → Ukkadam
  {
    id: 'tn-cbe-1',
    routeNumber: 'CBE-1',
    name: 'Gandhipuram → Ukkadam',
    tamil: 'காந்திபுரம் → உக்கடம்',
    from: 'Gandhipuram',
    to: 'Ukkadam',
    type: 'local',
    frequency: 'Every 5 mins',
    totalDistance: '5.8 km',
    totalTime: '18 mins',
    busPosition: { stopIndex: 1, progress: 0.5 },
    stops: [
      makeStop(findStop('gandhipuram'), 1, '2.1 km', '6 mins', '0 km', '0 mins', true, 'green'),
      makeStop(findStop('saibaba_colony'), 2, '1.8 km', '5 mins', '2.1 km', '6 mins', false, 'green'),
      makeStop(findStop('ukkadam'), 3, '0 km', '—', '5.8 km', '18 mins', false, 'green'),
    ],
  },

  // Trichy → Thanjavur
  {
    id: 'tn-tch-thj',
    routeNumber: '324',
    name: 'Trichy → Thanjavur',
    tamil: 'திருச்சி → தஞ்சாவூர்',
    from: 'Trichy',
    to: 'Thanjavur',
    type: 'local',
    frequency: 'Every 15 mins',
    totalDistance: '56 km',
    totalTime: '1h 15m',
    busPosition: { stopIndex: 1, progress: 0.2 },
    stops: [
      makeStop(findStop('chatram'), 1, '8 km', '15 mins', '0 km', '0 mins', true, 'green'),
      makeStop(findStop('srirangam'), 2, '18 km', '25 mins', '8 km', '15 mins', false, 'green'),
      makeStop(findStop('kumbakonam'), 3, '30 km', '35 mins', '26 km', '40 mins', false, 'yellow'),
      makeStop(findStop('thanjavur'), 4, '0 km', '—', '56 km', '1h 15m', false, 'green'),
    ],
  },

  // Madurai → Tirunelveli
  {
    id: 'tn-mdu-tnv',
    routeNumber: '137',
    name: 'Madurai → Tirunelveli',
    tamil: 'மதுரை → திருநெல்வேலி',
    from: 'Madurai',
    to: 'Tirunelveli',
    type: 'express',
    frequency: 'Every 20 mins',
    totalDistance: '158 km',
    totalTime: '3h 15m',
    busPosition: { stopIndex: 0, progress: 0.7 },
    stops: [
      makeStop(findStop('mattuthavani'), 1, '52 km', '55 mins', '0 km', '0 mins', false, 'green'),
      makeStop(findStop('sivaganga'), 2, '45 km', '50 mins', '52 km', '55 mins', false, 'yellow'),
      makeStop(findStop('thoothukudi'), 3, '61 km', '1h 10m', '97 km', '1h 45m', false, 'green'),
      makeStop(findStop('tirunelveli'), 4, '0 km', '—', '158 km', '3h 15m', false, 'green'),
    ],
  },

  // Poonamallee → Thiruvottiyur (Chennai local)
  {
    id: 'tn-70',
    routeNumber: '70',
    name: 'Poonamallee → Thiruvottiyur',
    tamil: 'பூந்தமல்லி → திருவொற்றியூர்',
    from: 'Poonamallee',
    to: 'Thiruvottiyur',
    type: 'local',
    frequency: 'Every 15 mins',
    totalDistance: '35.2 km',
    totalTime: '90 mins',
    busPosition: { stopIndex: 2, progress: 0.3 },
    stops: [
      makeStop(findStop('poonamallee'), 1, '5.2 km', '14 mins', '0 km', '0 mins', true, 'green'),
      makeStop(findStop('porur'), 2, '6.8 km', '16 mins', '5.2 km', '14 mins', true, 'yellow'),
      makeStop(findStop('vadapalani'), 3, '4.5 km', '12 mins', '12 km', '30 mins', false, 'yellow'),
      makeStop(findStop('egmore'), 4, '7.1 km', '18 mins', '16.5 km', '42 mins', false, 'red'),
      makeStop(findStop('thiruvottiyur'), 5, '0 km', '—', '35.2 km', '90 mins', false, 'green'),
    ],
  },

  // Salem → Dharmapuri
  {
    id: 'tn-slm-dhp',
    routeNumber: '401',
    name: 'Salem → Dharmapuri',
    tamil: 'சேலம் → தர்மபுரி',
    from: 'Salem',
    to: 'Dharmapuri',
    type: 'local',
    frequency: 'Every 20 mins',
    totalDistance: '65 km',
    totalTime: '1h 30m',
    busPosition: { stopIndex: 0, progress: 0.5 },
    stops: [
      makeStop(findStop('salem_new'), 1, '25 km', '30 mins', '0 km', '0 mins', false, 'green'),
      makeStop(findStop('namakkal'), 2, '40 km', '55 mins', '25 km', '30 mins', false, 'green'),
      makeStop(findStop('dharmapuri'), 3, '0 km', '—', '65 km', '1h 30m', false, 'green'),
    ],
  },
];

// Utility: Get all unique districts
export const tnDistricts = [...new Set(tnBusStands.map(s => s.district))].sort();

// Utility: Find nearby stops
export function findNearbyStops(lat: number, lng: number, radiusKm = 0.5): TNBusStop[] {
  return tnBusStands.filter(stop => {
    const dist = haversineDistance(lat, lng, stop.lat, stop.lng);
    return dist <= radiusKm;
  });
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Utility: Search routes by from/to
export function searchRoutes(query: string): TNRoute[] {
  const q = query.toLowerCase().trim();
  if (!q) return tnRoutes;
  return tnRoutes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.tamil.includes(q) ||
    r.routeNumber.toLowerCase().includes(q) ||
    r.from.toLowerCase().includes(q) ||
    r.to.toLowerCase().includes(q) ||
    r.stops.some(s => s.name.toLowerCase().includes(q) || s.tamil.includes(q))
  );
}
