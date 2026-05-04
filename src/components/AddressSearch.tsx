'use client'
import { useState, useEffect, useRef } from 'react'
import { geocodeAddress, GeoResult } from '@/lib/geocode'

export default function AddressSearch({ initialValue = '', onSelect }: {
  initialValue?: string
  onSelect: (result: GeoResult) => void
}) {
  const [query, setQuery]       = useState(initialValue)
  const [results, setResults]   = useState<GeoResult[]>([])
  const [loading, setLoading]   = useState(false)
  const debounceRef             = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await geocodeAddress(query)
        setResults(res)
      } catch (err) {
        console.error('Geocoding error:', err)
      } finally {
        setLoading(false)
      }
    }, 400) // debounce 400ms — important for Nominatim rate limits
  }, [query])

  return (
    <div className="relative w-full">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search patient area or address..."
          className="w-full bg-background border border-outline-variant text-text
                     rounded-lg px-md py-sm text-[13px] font-data focus:outline-none
                     focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all pr-12"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="icon text-outline-variant text-[18px]">search</span>
          )}
        </div>
      </div>
      
      {results.length > 0 && (
        <ul className="absolute z-[100] w-full mt-2 bg-surface-container border border-outline-variant
                       rounded-lg shadow-xl overflow-hidden animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => { onSelect(r); setQuery(r.display_name); setResults([]) }}
              className="px-md py-sm text-[12px] font-data text-text hover:bg-primary-container/10
                         hover:text-primary-container cursor-pointer border-b border-outline-variant/30
                         last:border-b-0 transition-colors flex items-start gap-2"
            >
              <span className="icon text-[14px] mt-0.5 text-primary-container">location_on</span>
              <span>{r.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
