# Remix of Remix of Remix of Remix of Remix of Live Bus Tracker

REAL-TIME GPS:

☑ Driver opens app → GPS starts broadcasting every 3 seconds

☑ Passenger sees bus icon moving LIVE on Google Maps

☑ Bus icon rotates based on heading direction

☑ Bus icon color matches bus color set by driver

☑ ETA updates every 3 seconds automatically

☑ Multiple buses all visible simultaneously on map

BUS MANAGEMENT:

☑ Driver can add bus with all details (number, route, type, color, logo)

☑ Driver can edit bus details and see changes instantly

☑ Bus icon on map reflects the color driver chose

☑ Bus number shows on icon

NOTIFICATIONS:

☑ At 10 min ETA → blue notification slides up in app

☑ At 5 min ETA → amber urgent alert + phone vibrates

☑ At 2 min / 500m → red final call alert

☑ On bus arrival → green arrival notification

☑ Push notification works when app is in background

☑ Issue reported by driver → all tracking passengers notified instantly

MAP FEATURES:

☑ Bus icons animated (smooth 3s position transitions)

☑ Stop markers show on route

☑ Route polyline drawn on map

☑ User location (pulsing blue dot)

☑ Dark/light map theme toggle

☑ Traffic layer toggle

☑ Tap bus → info panel appears

☑ Map auto-follows selected bus

DRIVER:

☑ Driver logs in → sees assigned bus

☑ Starts trip → GPS begins broadcasting

☑ Can report issues → passengers notified in <1 second

☑ Can update seats available

☑ Trip stats tracked in real-time

PERFORMANCE:

☑ Map loads in < 3 seconds

☑ GPS update latency < 500ms (Socket.io) 

☑ Firestore persistence < 2 seconds

☑ App installable as PWA

☑ Works offline with cached data

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://route-comrade-now.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f0a070f0-21b7-43bf-a751-cfa98939b5c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
