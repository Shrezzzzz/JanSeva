import { useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Layers, Flame, MapPin, Plus, Minus } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../store/mapStore';
import { fetchIssuesForMap } from '../../services/issueService';
import {
  TILE_URL, TILE_ATTRIBUTION, SATELLITE_TILE_URL,
  DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM,
} from '../../utils/constants';
import IssueMarker from './IssueMarker';
import { HeatmapLayer } from './HeatmapLayer';
import type { Issue } from '../../types/issue.types';

function MapEventHandler() {
  const { setView, setMapIssues } = useMapStore();
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      setView({ center: [c.lat, c.lng], zoom: map.getZoom() });
      const b = map.getBounds();
      fetchIssuesForMap({
        north: b.getNorth(), south: b.getSouth(),
        east:  b.getEast(),  west:  b.getWest(),
      }).then(setMapIssues).catch(() => null);
    },
  });
  return null;
}

function IssueCountBar({ count }: { count: number }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] glass rounded-full px-4 py-2 text-sm font-medium text-[#0D0D0B] shadow">
      Showing {count} issue{count !== 1 ? 's' : ''} in this area
    </div>
  );
}

function MapControls({
  onToggleHeatmap,
  onToggleSatellite,
  onMyLocation,
  showHeatmap,
  showSatellite,
}: {
  onToggleHeatmap: () => void;
  onToggleSatellite: () => void;
  onMyLocation: () => void;
  showHeatmap: boolean;
  showSatellite: boolean;
}) {
  const map = useMap();
  return (
    <div className="absolute top-16 right-4 z-[500] flex flex-col gap-2">
      {[
        { icon: <MapPin size={16} />,  label: 'My location',      fn: onMyLocation,       active: false },
        { icon: <Flame  size={16} />,  label: 'Toggle heatmap',   fn: onToggleHeatmap,    active: showHeatmap },
        { icon: <Plus   size={16} />,  label: 'Zoom in',          fn: () => map.zoomIn(), active: false },
        { icon: <Minus  size={16} />,  label: 'Zoom out',         fn: () => map.zoomOut(),active: false },
        { icon: <Layers size={16} />,  label: 'Toggle satellite',  fn: onToggleSatellite,  active: showSatellite },
      ].map((c) => (
        <button
          key={c.label}
          onClick={c.fn}
          title={c.label}
          aria-label={c.label}
          className={`w-9 h-9 rounded-full flex items-center justify-center shadow transition-colors ${
            c.active
              ? 'bg-[#1A6B3C] text-white'
              : 'glass text-[#0D0D0B] hover:bg-[#E8F5EE] hover:text-[#1A6B3C]'
          }`}
        >
          {c.icon}
        </button>
      ))}
    </div>
  );
}

export default function IssueMap({ onSelectIssue }: { onSelectIssue: (issue: Issue) => void }) {
  const {
    mapIssues, showSatellite, filter,
    toggleHeatmap, toggleSatellite, setMapIssues,
  } = useMapStore();

  function handleMyLocation() {
    navigator.geolocation.getCurrentPosition(() => {
      // The map event handler will re-fetch on moveend after flyTo
    });
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          url={showSatellite ? SATELLITE_TILE_URL : TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
        />

        <MapEventHandler />

        <MapControls
          onToggleHeatmap={toggleHeatmap}
          onToggleSatellite={toggleSatellite}
          onMyLocation={handleMyLocation}
          showHeatmap={filter.showHeatmap}
          showSatellite={showSatellite}
        />

        {/* Heatmap layer — renders when toggle is on */}
        {filter.showHeatmap && <HeatmapLayer issues={mapIssues} />}

        {/* Clustered markers — hidden when heatmap is on for clarity */}
        {!filter.showHeatmap && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
          >
            {mapIssues.map((issue) => (
              <IssueMarker key={issue.id} issue={issue} onClick={onSelectIssue} />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      <IssueCountBar count={mapIssues.length} />
    </div>
  );
}
