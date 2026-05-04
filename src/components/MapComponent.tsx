"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  markers: Array<{
    id: string;
    lng: number;
    lat: number;
    color: string;
    popup?: string;
  }>;
  onMarkerClick?: (id: string) => void;
}

export default function MapComponent({ center, zoom, markers, onMarkerClick }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!hasToken || map.current || !mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: center,
        zoom: zoom,
      });

      map.current.addControl(new mapboxgl.NavigationControl());
    } catch (error) {
      console.error("Mapbox initialization failed:", error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [hasToken]);

  useEffect(() => {
    if (!map.current || !hasToken) return;

    // Update center if it changes significantly
    map.current.flyTo({ center, zoom, essential: true });
  }, [center, zoom, hasToken]);

  useEffect(() => {
    if (!map.current || !hasToken) return;

    // Remove old markers
    Object.values(markerRefs.current).forEach(marker => marker.remove());
    markerRefs.current = {};

    // Add new markers
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.backgroundColor = m.color;
      el.style.width = "15px";
      el.style.height = "15px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([m.lng, m.lat])
        .addTo(map.current!);

      if (m.popup) {
        marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(m.popup));
      }

      el.addEventListener("click", () => {
        if (onMarkerClick) onMarkerClick(m.id);
      });

      markerRefs.current[m.id] = marker;
    });
  }, [markers, hasToken]);

  if (!hasToken) {
    return (
      <div className="map-placeholder">
        <div className="placeholder-content">
          <p>Mapbox Token Missing</p>
          <span>Please add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to your <code>.env.local</code> file to enable the map.</span>
        </div>
        <style jsx>{`
          .map-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            border-radius: 12px;
            color: #666;
            text-align: center;
            padding: 20px;
          }
          .placeholder-content p {
            font-weight: 700;
            margin-bottom: 8px;
          }
          code {
            background: #eee;
            padding: 2px 4px;
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }

  return <div ref={mapContainer} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />;
}
