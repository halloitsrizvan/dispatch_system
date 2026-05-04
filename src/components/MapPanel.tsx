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

// Patient location — blue pulsing marker
const patientIcon = L.divIcon({
  className: 'patient-marker-container',
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        width:20px;height:20px;border-radius:50%;
        background:#3B82F6;border:3px solid #fff;
        box-shadow:0 0 10px rgba(59,130,246,0.6);
      " class="patient-pulse-dot"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Phlebotomist markers — colored by status
const makePhlebIcon = (color: string) => L.divIcon({
  className: 'phleb-marker-container',
  html: `
    <div style="
      width:16px;height:16px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 0 12px ${color}80;
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const icons: Record<string, L.DivIcon> = {
  active: makePhlebIcon('#00C896'),   // primary-container
  busy:      makePhlebIcon('#ff9467'),   // tertiary-container
  inactive:  makePhlebIcon('#ffb4ab'),   // error
}

interface Phlebotomist {
  id: string
  name: string
  lat?: number
  lng?: number
  status: 'active' | 'busy' | 'inactive'
  phone?: string
}

interface MapPanelProps {
  patientLat?: number
  patientLng?: number
  phlebotomists: Phlebotomist[]
  selectedId?: string | null
  onSelectPhlebotomist?: (id: string) => void
  onLocationSelect?: (lat: number, lng: number) => void
}

export default function MapPanel({
  patientLat = 11.2588, // Default Kozhikode
  patientLng = 75.7804,
  phlebotomists,
  selectedId,
  onSelectPhlebotomist,
  onLocationSelect,
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
      attributionControl: false
    })

    // Dark tile layer — CartoDB Dark Matter (free, no API key)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map)

    // Handle map click for location selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      onLocationSelect?.(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map

    return () => {
      map.off('click');
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add/update markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Patient marker (only if coords exist)
    if (patientLat && patientLng) {
      const patientMarker = L.marker([patientLat, patientLng], { icon: patientIcon })
        .addTo(map)
        .bindPopup('<b style="font-family:IBM Plex Sans; color:#3B82F6">📍 TARGET LOCATION</b>')
      markersRef.current.push(patientMarker)
    }

    // Phlebotomist markers
    phlebotomists.forEach(p => {
      if (!p.lat || !p.lng) return
      
      const icon = icons[p.status] ?? icons.active
      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:IBM Plex Sans,sans-serif; min-width:180px; background:#161B22; color:#dce4de; padding:8px; border-radius:8px;">
            <div style="font-weight:700; font-size:14px; color:#42e5b0; text-transform:uppercase;">${p.name}</div>
            <div style="font-size:12px; margin-top:4px; opacity:0.8;">${p.phone || 'No phone'}</div>
            <div style="font-size:10px; margin-top:4px; font-weight:bold; color:${p.status === 'active' ? '#00C896' : '#ffb4ab'}">${p.status.toUpperCase()}</div>
          </div>
        `, { className: 'custom-leaflet-popup' })
      
      if (onSelectPhlebotomist) {
        marker.on('click', () => onSelectPhlebotomist(p.id))
      }
      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    const allPoints: [number, number][] = []
    if (patientLat && patientLng) allPoints.push([patientLat, patientLng])
    phlebotomists.forEach(p => {
      if (p.lat && p.lng) allPoints.push([p.lat, p.lng])
    })

    if (allPoints.length > 1) {
      map.fitBounds(allPoints, { padding: [50, 50] })
    } else if (allPoints.length === 1) {
      map.setView(allPoints[0], 14)
    }
  }, [patientLat, patientLng, phlebotomists])

  // Draw route line
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }

    if (!selectedId || !patientLat || !patientLng) return

    const selected = phlebotomists.find(p => p.id === selectedId)
    if (!selected || !selected.lat || !selected.lng) return

    const routeLine = L.polyline(
      [[selected.lat, selected.lng], [patientLat, patientLng]],
      {
        color: '#00C896',
        weight: 2,
        opacity: 0.8,
        dashArray: '10, 10',
      }
    ).addTo(map)

    routeLayerRef.current = routeLine
    map.fitBounds(routeLine.getBounds(), { padding: [80, 80] })
  }, [selectedId, phlebotomists, patientLat, patientLng])

  return (
    <div className="w-full h-full relative group">
      <style>{`
        @keyframes patientPulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
          70%  { box-shadow: 0 0 0 15px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .patient-pulse-dot {
          animation: patientPulse 2s infinite;
        }
        .leaflet-container {
          background: #0d1117 !important;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #161B22 !important;
          color: #dce4de !important;
          border: 1px solid #3c4a43;
          border-radius: 8px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #161B22 !important;
        }
      `}</style>

      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[400px]"
      />
    </div>
  )
}
