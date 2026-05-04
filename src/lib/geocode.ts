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
