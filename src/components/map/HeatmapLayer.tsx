import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Issue } from '../../types/issue.types';

interface HeatmapLayerProps {
  issues: Issue[];
}

export function HeatmapLayer({ issues }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!issues.length) return;

    const points: [number, number, number][] = issues.map((i) => [
      i.latitude,
      i.longitude,
      Math.min((i.upvotes + 1) / 10, 1),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heat = (L as any).heatLayer(points, {
      radius:  35,
      blur:    25,
      maxZoom: 17,
      gradient: { 0.2: '#1A6B3C', 0.5: '#F59E0B', 0.8: '#DC2626' },
    });

    heat.addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [issues, map]);

  return null;
}

export default HeatmapLayer;
