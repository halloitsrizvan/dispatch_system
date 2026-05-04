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

interface MiniMapPreviewProps {
  lat: number;
  lng: number;
  radius?: number; // In KM
  onLocationSelect?: (lat: number, lng: number) => void;
}

export default function MiniMapPreview({ lat, lng, radius, onLocationSelect }: MiniMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([lat || 11.2588, lng || 75.7804], 12)
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map)
      
      const marker = L.marker([lat || 11.2588, lng || 75.7804], { draggable: true }).addTo(map)
      
      // Initial circle if radius exists
      if (radius) {
        const circle = L.circle([lat || 11.2588, lng || 75.7804], {
          radius: radius * 1000,
          color: '#00C896',
          fillColor: '#00C896',
          fillOpacity: 0.1,
          weight: 1
        }).addTo(map)
        circleRef.current = circle
      }

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
        onLocationSelect?.(lat, lng);
      });

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        if (circleRef.current) circleRef.current.setLatLng(position);
        onLocationSelect?.(position.lat, position.lng);
      });

      mapRef.current = map
      markerRef.current = marker
    } else {
      // Update marker, circle and view when props change
      if (lat && lng) {
        // mapRef.current.setView([lat, lng], mapRef.current.getZoom())
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        }
        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng])
        } else if (radius) {
           circleRef.current = L.circle([lat, lng], {
            radius: radius * 1000,
            color: '#00C896',
            fillColor: '#00C896',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(mapRef.current)
        }
      }

      // Update radius
      if (circleRef.current && radius) {
        circleRef.current.setRadius(radius * 1000)
        // Zoom to fit circle if it's too big/small
        // mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] })
      }
    }
  }, [lat, lng, radius])

  return (
    <div className="relative group rounded-xl overflow-hidden border border-outline-variant shadow-glow">
      <div ref={containerRef} style={{ width: '100%', height: '300px' }} />
      <div className="absolute top-3 left-3 z-[1000] bg-background/80 backdrop-blur-md px-3 py-1 text-[10px] border border-outline-variant font-data text-primary-container uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
        Interactive Map Mode: Active
      </div>
      <div className="absolute bottom-3 right-3 z-[1000] bg-background/80 backdrop-blur-md px-3 py-1 text-[9px] border border-outline-variant font-data text-outline uppercase tracking-tight rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Drag marker or click map to set base
      </div>
    </div>
  )
}
