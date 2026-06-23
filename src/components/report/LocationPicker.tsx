import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Crosshair, AlertTriangle, Search, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode, detectZone } from '../../utils/geoUtils';
import { TILE_URL, TILE_ATTRIBUTION, DEFAULT_MAP_CENTER, NOMINATIM_BASE_URL } from '../../utils/constants';
import Spinner from '../ui/Spinner';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  address: string;
  zone: string;
  onChange: (lat: number, lng: number, address: string, zone: string) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({ lat, lng, address, zone, onChange }: LocationPickerProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef  = useRef<L.Marker | null>(null);

  // Latest watched GPS coords for re-center
  const watchedLatLng = useRef<{ lat: number; lng: number } | null>(null);

  const [resolving,     setResolving]     = useState(false);
  const [locationError, setLocationError] = useState('');

  // Search state
  const [searchQuery,    setSearchQuery]    = useState('');
  const [suggestions,    setSuggestions]    = useState<NominatimResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Fix Leaflet default icon paths broken by Vite ────────────────────────
  useEffect(() => {
    // @ts-expect-error -- private property
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const center: L.LatLngTuple = lat && lng ? [lat, lng] : DEFAULT_MAP_CENTER;
    const map = L.map(mapRef.current, { center, zoom: 15, zoomControl: false });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    leafletRef.current = map;

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      setupMarkerDrag(markerRef.current);
    }

    map.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng));

    return () => {
      map.remove();
      leafletRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── watchPosition — follows the user in real time ─────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Use the search or drag the pin.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationError('');
        watchedLatLng.current = { lat: latitude, lng: longitude };
        leafletRef.current?.flyTo([latitude, longitude], 16, { duration: 1.2 });
        placeMarker(latitude, longitude);
      },
      (err) => {
        if (err.code === 1) {
          setLocationError(
            'Please allow location access to auto-pin your issue. You can also search or drag the pin manually.',
          );
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Nominatim search with 400ms debounce ──────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=0`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'JanSeva/1.0' },
        });
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ── Handle suggestion click ───────────────────────────────────────────────
  async function handleSuggestionSelect(result: NominatimResult) {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);

    setSearchQuery(result.display_name);
    setSuggestions([]);
    setShowDropdown(false);
    searchInputRef.current?.blur();

    // Fly and pin
    leafletRef.current?.flyTo([newLat, newLng], 17, { duration: 1.0 });
    await placeMarker(newLat, newLng);
  }

  // ── Map helpers ───────────────────────────────────────────────────────────
  async function placeMarker(newLat: number, newLng: number) {
    const map = leafletRef.current;
    if (!map) return;

    if (!markerRef.current) {
      markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(map);
      setupMarkerDrag(markerRef.current);
    } else {
      markerRef.current.setLatLng([newLat, newLng]);
    }

    await resolve(newLat, newLng);
  }

  function setupMarkerDrag(marker: L.Marker) {
    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      await resolve(pos.lat, pos.lng);
    });
  }

  async function resolve(newLat: number, newLng: number) {
    setResolving(true);
    const addr = await reverseGeocode(newLat, newLng);
    const z    = detectZone(newLat, newLng);
    onChange(newLat, newLng, addr, z);
    setResolving(false);
  }

  // ── Re-center ─────────────────────────────────────────────────────────────
  const handleReCenter = useCallback(() => {
    const coords = watchedLatLng.current;
    if (coords && leafletRef.current) {
      leafletRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 1.0 });
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => leafletRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16),
        () => setLocationError('Please allow location access to auto-pin your issue. You can also drag the pin manually.'),
        { enableHighAccuracy: true },
      );
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-[#6F6F6F] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search for an address in India…"
            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-[#E5E5E0] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
          />
          {searchLoading && (
            <Loader2 size={15} className="absolute right-3 text-[#6F6F6F] animate-spin" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-[1000] top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-[#E5E5E0] overflow-hidden">
            {suggestions.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={() => handleSuggestionSelect(r)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[#E8F5EE] hover:text-[#1A6B3C] transition-colors"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">📍</span>
                  <span className="text-[#0D0D0B] leading-snug line-clamp-2">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 300 }}>
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Location permission warning */}
      {locationError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-snug">{locationError}</p>
        </div>
      )}

      {/* Re-center button */}
      <button
        type="button"
        onClick={handleReCenter}
        className="flex items-center gap-2 text-sm font-medium text-[#1A6B3C] hover:text-[#145530] transition-colors"
      >
        <Crosshair size={15} />
        📍 Re-center to my location
      </button>

      {/* Address display */}
      <div className="flex items-start gap-2 text-sm">
        {resolving ? (
          <Spinner size={16} className="text-[#6F6F6F] mt-0.5" />
        ) : (
          <MapPin size={16} className="text-[#1A6B3C] mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-[#0D0D0B]">{address || 'Search or click the map to set location'}</p>
          {zone && (
            <span className="inline-block mt-1 text-xs bg-[#E8F5EE] text-[#1A6B3C] px-2 py-0.5 rounded-full">
              {zone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
