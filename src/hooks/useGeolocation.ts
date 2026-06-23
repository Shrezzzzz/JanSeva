import { useState, useEffect, useCallback } from 'react';

interface GeoState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(autoFetch = false) {
  const [state, setState] = useState<GeoState>({ lat: null, lng: null, error: null, loading: false });

  const fetch = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      (err) => setState((s) => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  useEffect(() => { if (autoFetch) fetch(); }, [autoFetch, fetch]);

  return { ...state, fetch };
}
