"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

interface GeocodingInputProps {
  onSelect: (lng: number, lat: number, address: string) => void;
  placeholder?: string;
  initialValue?: string;
}

import "./geocoding.css";

export default function GeocodingInput({ onSelect, placeholder, initialValue }: GeocodingInputProps) {
  const [query, setQuery] = useState(initialValue || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (val: string) => {
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(val)}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await resp.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query !== (initialValue || "")) {
      debounceTimer.current = setTimeout(() => fetchSuggestions(query), 400);
    }
  }, [query]);

  return (
    <div className="geocoding-wrapper">
      <div className="input-with-icon">
        <MapPin size={18} className="icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Search address..."}
        />
        {loading && <Loader2 size={18} className="animate-spin loader" />}
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestions-list glass">
          {suggestions.map((s) => (
            <li 
              key={s.id} 
              onClick={() => {
                const [lng, lat] = s.geometry.coordinates;
                const address = s.properties.full_address || s.properties.name;
                setQuery(address);
                setSuggestions([]);
                onSelect(lng, lat, address);
              }}
            >
              <strong>{s.properties.name}</strong>
              <span>{s.properties.place_formatted}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
