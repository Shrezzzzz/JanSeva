const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in metres */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bounding box around a point at radius metres */
export function boundingBox(lat: number, lng: number, radiusM: number) {
  const latDelta = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east:  lng + lngDelta,
    west:  lng - lngDelta,
  };
}

/** Convert degrees to metres (rough) */
export function degreesToMetres(degrees: number, lat: number): number {
  const latM = (EARTH_RADIUS_M * Math.PI) / 180;
  const lngM = latM * Math.cos((lat * Math.PI) / 180);
  return Math.max(latM, lngM) * degrees;
}

/** Reverse geocode using Nominatim */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/** Forward geocode using Nominatim */
export async function geocode(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  } catch {
    return null;
  }
}

/** Detect ward from coordinates (mock — real impl would hit a PostGIS endpoint) */
export function detectZone(lat: number, _lng: number): string {
  // Round to 2 decimals to group nearby points into "wards"
  const wardN = Math.abs(Math.round(lat * 10)) % 20 + 1;
  return `Ward ${wardN}`;
}
