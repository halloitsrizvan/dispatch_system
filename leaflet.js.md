# Antigravity Prompt — Migrate Map from Mapbox to Leaflet + OpenStreetMap

---

## Context

I have an existing Next.js 14 (App Router) project — the **HealthyCart Phlebotomist Dispatch System**. The UI was built using **Mapbox GL JS** for all map functionality. I need to completely replace Mapbox with **Leaflet.js + OpenStreetMap** because Mapbox requires a credit card even for free tier.

**No API key should be needed anywhere after this migration.**

---

## What to Remove (Delete Everything Mapbox)

1. Uninstall the `mapbox-gl` npm package:
   ```bash
   npm uninstall mapbox-gl
   ```

2. Remove all imports of `mapbox-gl` across the entire codebase:
   ```js
   // DELETE any lines like these:
   import mapboxgl from 'mapbox-gl'
   import 'mapbox-gl/dist/mapbox-gl.css'
   mapboxgl.accessToken = '...'
   ```

3. Remove all Mapbox environment variables from `.env.local` and `.env.example`:
   ```
   # DELETE these:
   NEXT_PUBLIC_MAPBOX_TOKEN=
   MAPBOX_SECRET_TOKEN=
   ```

4. Remove any Mapbox geocoding API calls (calls to `api.mapbox.com/geocoding/...`).

5. In `/admin/phlebotomists/new` — remove Mapbox autocomplete from the Home Address field.

---

## What to Install

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

No API key, no account, no `.env` variable needed.

---

## Global Leaflet CSS Setup

In `app/layout.tsx` (or `app/globals.css`), add the Leaflet CSS:

```tsx
// In app/layout.tsx — add this import at the top:
import 'leaflet/dist/leaflet.css'
```

Also add this to `app/globals.css` to fix the default Leaflet marker icon broken image issue in Next.js:

```css
/* Fix Leaflet default marker icons in Next.js */
.leaflet-default-icon-path {
  background-image: url(/leaflet/marker-icon.png);
}
```

And copy the Leaflet marker images to `public/leaflet/`:
- `marker-icon.png`
- `marker-icon-2x.png`
- `marker-shadow.png`

These files are inside `node_modules/leaflet/dist/images/` — copy them to `public/leaflet/`.

---

## Replace `<MapPanel />` Component

Replace the entire `components/MapPanel.tsx` with the following implementation:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon broken in Next.js/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
})

// --- Custom marker icons ---

// Patient location — blue pulsing marker (via CSS class)
const patientIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        width:20px;height:20px;border-radius:50%;
        background:#3B82F6;border:3px solid #fff;
        box-shadow:0 0 0 0 rgba(59,130,246,0.6);
        animation:patientPulse 1.5s infinite;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Phlebotomist markers — colored by status
const makePhlebIcon = (color: string) => L.divIcon({
  className: '',
  html: `
    <div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const icons = {
  available: makePhlebIcon('#00C896'),   // teal green
  busy:      makePhlebIcon('#F59E0B'),   // amber
  off_duty:  makePhlebIcon('#EF4444'),   // red
}

// --- Types ---
interface Phlebotomist {
  id: string
  name: string
  lat: number
  lng: number
  status: 'available' | 'busy' | 'off_duty'
  distance_km: number
  experience_years: number
  phone: string
}

interface MapPanelProps {
  patientLat: number
  patientLng: number
  phlebotomists: Phlebotomist[]
  selectedId: string | null
  onSelectPhlebotomist: (id: string) => void
}

export default function MapPanel({
  patientLat,
  patientLng,
  phlebotomists,
  selectedId,
  onSelectPhlebotomist,
}: MapPanelProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Initialize map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [patientLat, patientLng],
      zoom: 13,
      zoomControl: true,
    })

    // Dark tile layer — CartoDB Dark Matter (free, no API key)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add/update patient marker + phlebotomist markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Patient marker
    const patientMarker = L.marker([patientLat, patientLng], { icon: patientIcon })
      .addTo(map)
      .bindPopup('<b>📍 Patient Location</b>')
    markersRef.current.push(patientMarker)

    // Phlebotomist markers
    phlebotomists.forEach(p => {
      const icon = icons[p.status] ?? icons.available
      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:DM Sans,sans-serif;min-width:160px;">
            <div style="font-weight:700;font-size:14px;">${p.name}</div>
            <div style="color:#00C896;font-size:13px;">${p.distance_km} km away · ${p.experience_years} yrs exp</div>
            <div style="font-size:12px;margin-top:4px;">${p.phone}</div>
          </div>
        `)
      marker.on('click', () => onSelectPhlebotomist(p.id))
      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    const allPoints: L.LatLngExpression[] = [
      [patientLat, patientLng],
      ...phlebotomists.map(p => [p.lat, p.lng] as L.LatLngExpression),
    ]
    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] })
    }
  }, [patientLat, patientLng, phlebotomists])

  // Draw route line when a phlebotomist is selected
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove previous route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }

    if (!selectedId) return

    const selected = phlebotomists.find(p => p.id === selectedId)
    if (!selected) return

    // Draw dashed line from phlebotomist → patient
    const routeLine = L.polyline(
      [[selected.lat, selected.lng], [patientLat, patientLng]],
      {
        color: '#00C896',
        weight: 2,
        opacity: 0.8,
        dashArray: '8, 8',
      }
    ).addTo(map)

    routeLayerRef.current = routeLine

    // Pan map to show the route
    map.fitBounds(routeLine.getBounds(), { padding: [60, 60] })
  }, [selectedId, phlebotomists, patientLat, patientLng])

  return (
    <>
      {/* Pulse animation for patient marker */}
      <style>{`
        @keyframes patientPulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
          70%  { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>

      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}
      />
    </>
  )
}
```

---

## Replace Geocoding (Address Autocomplete)

Remove all calls to `api.mapbox.com/geocoding`. Replace with **Nominatim** (OpenStreetMap's free geocoder — no API key needed).

### New geocoding utility — `lib/geocode.ts`

```ts
export interface GeoResult {
  display_name: string
  lat: number
  lng: number
}

// Forward geocode: address string → lat/lng
// Uses Nominatim — free, no API key, no credit card
export async function geocodeAddress(query: string): Promise<GeoResult[]> {
  const encoded = encodeURIComponent(query + ', Kozhikode, Kerala, India')
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&countrycodes=in`

  const res = await fetch(url, {
    headers: {
      // Required by Nominatim usage policy — identify your app
      'User-Agent': 'HealthyCart-Dispatch/1.0 (internal tool)',
    },
  })

  if (!res.ok) throw new Error('Geocoding failed')

  const data = await res.json()
  return data.map((item: any) => ({
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}

// Reverse geocode: lat/lng → address string
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HealthyCart-Dispatch/1.0 (internal tool)' },
  })
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const data = await res.json()
  return data.display_name ?? 'Unknown location'
}
```

### Update the address autocomplete input in `/dispatch` and `/admin/phlebotomists/new`

Replace Mapbox autocomplete with this pattern:

```tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { geocodeAddress, GeoResult } from '@/lib/geocode'

export default function AddressSearch({ onSelect }: {
  onSelect: (result: GeoResult) => void
}) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<GeoResult[]>([])
  const [loading, setLoading]   = useState(false)
  const debounceRef             = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await geocodeAddress(query)
        setResults(res)
      } finally {
        setLoading(false)
      }
    }, 400) // debounce 400ms — important for Nominatim rate limits
  }, [query])

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type patient area or address..."
        className="w-full bg-[#161B22] border border-[#30363D] text-[#F0F6FC]
                   rounded-lg px-4 py-3 text-sm focus:outline-none
                   focus:border-[#00C896] focus:ring-1 focus:ring-[#00C896]"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-[#8B949E] text-xs">searching...</div>
      )}
      {results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-[#161B22] border border-[#30363D]
                       rounded-lg shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => { onSelect(r); setQuery(r.display_name); setResults([]) }}
              className="px-4 py-3 text-sm text-[#F0F6FC] hover:bg-[#00C896]/10
                         hover:text-[#00C896] cursor-pointer border-b border-[#30363D]
                         last:border-b-0 transition-colors"
            >
              📍 {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

## Update `/admin/phlebotomists/new` — Address Field

In the phlebotomist add/edit form, replace the Mapbox address autocomplete with the `<AddressSearch />` component above. When an address is selected:

1. Store `lat` and `lng` in component state.
2. Show the coordinates chip: `10.0261° N, 76.3083° E`
3. Render a small Leaflet map preview (100% width, 220px height) with a single green marker at the geocoded coordinates.

The small map preview component:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function MiniMapPreview({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15)
      return
    }
    const map = L.map(containerRef.current).setView([lat, lng], 15)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)
    L.marker([lat, lng]).addTo(map)
    mapRef.current = map
  }, [lat, lng])

  return <div ref={containerRef} style={{ width: '100%', height: '220px', borderRadius: '8px' }} />
}
```

---

## Update `<MapPanel />` in Component Registry

In `components/index.ts` or wherever `MapPanel` is exported, ensure the description is updated:

```ts
// BEFORE:
// MapPanel — Mapbox map with markers and route
// AFTER:
// MapPanel — Leaflet + OpenStreetMap map with markers and route (no API key)
```

---

## Remove All `.env` Mapbox References

Final `.env.local` after migration:

```dotenv
# Supabase (still required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NO Mapbox tokens needed — Leaflet + OSM is fully free with no API key
```

Also update `.env.example` to remove the Mapbox lines and add a comment:
```dotenv
# Map: No API key needed — uses Leaflet.js + OpenStreetMap (free, no credit card)
```

---

## Important: Disable SSR for Map Components

Leaflet accesses `window` and `document` — it will crash on server-side render in Next.js. Wrap every component that imports Leaflet with `dynamic`:

```tsx
// In any page that uses MapPanel or MiniMapPreview:
import dynamic from 'next/dynamic'

const MapPanel = dynamic(() => import('@/components/MapPanel'), { ssr: false })
const MiniMapPreview = dynamic(() => import('@/components/MiniMapPreview'), { ssr: false })
```

This is mandatory — do not skip this step.

---

## Nominatim Usage Rules (important)

Nominatim is free but has a fair-use policy:
- **Max 1 request per second** — the 400ms debounce in the autocomplete handles this.
- **Always send `User-Agent` header** — already included in `lib/geocode.ts` above.
- **Do not store geocoding results** as permanent data — use them only for the active session.
- For an internal tool with 5–10 dispatchers, you will never hit any limits.

---

## Summary of All Changes

| What | Before | After |
|---|---|---|
| Map library | `mapbox-gl` | `leaflet` + `react-leaflet` |
| Map tiles | Mapbox dark style (requires token) | CartoDB Dark Matter (free, no key) |
| Geocoding | Mapbox Geocoding API (requires token) | Nominatim OSM (free, no key) |
| Address autocomplete | Mapbox Places API | Custom `<AddressSearch />` using Nominatim |
| Mini map preview | Mapbox static map | Leaflet `<MiniMapPreview />` component |
| API keys needed | 2 (public + secret) | **0** |
| Credit card needed | Yes | **No** |
| Monthly cost | $0 (within free tier) | **$0 forever** |