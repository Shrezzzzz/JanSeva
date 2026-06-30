import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap, Circle, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Layers, Flame, MapPin, Plus, Minus, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../store/mapStore';
import { useAuthStore } from '../../store/authStore';
import { fetchIssuesForMap } from '../../services/issueService';
import {
  TILE_URL, TILE_ATTRIBUTION, SATELLITE_TILE_URL,
  DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM,
} from '../../utils/constants';
import IssueMarker from './IssueMarker';
import { HeatmapLayer } from './HeatmapLayer';
import type { Issue } from '../../types/issue.types';
import { getAvatarById, isAvatarId } from '../avatars/avatar-data';

// ── Avatar color from name ──────────────────────────────────
const COLORS = ['#1A6B3C','#0284C7','#7C3AED','#D97706','#DC2626','#0891B2'];
function avatarColor(name: string) {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── User avatar marker ──────────────────────────────────────
function UserAvatarMarker({ position, user, activeCharacter, huntMode }: {
  position: [number, number];
  user: { name: string; activeCharacter?: string };
  activeCharacter?: string | null;
  huntMode: boolean;
}) {
  const avatar = isAvatarId(activeCharacter) ? getAvatarById(activeCharacter) : null;
  const color  = avatar ? avatar.background : avatarColor(user.name);
  const label  = initials(user.name);

  const icon = L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;position:relative;">
        <div style="
          width:44px;height:44px;border-radius:50%;
          background:${color};border:3px solid white;
          box-shadow:0 0 0 3px ${color},0 0 20px ${color}80;
          display:flex;align-items:center;justify-content:center;
          animation:avatarPulse 2s ease-in-out infinite;
          position:relative;
        ">
          ${
            avatar
              ? `<img src="${avatar.src}" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover;object-position:top;transform:scale(1.25) translateY(7%);" />`
              : `<span style="color:white;font-weight:700;font-size:14px;font-family:sans-serif;">${label}</span>`
          }
          ${huntMode ? `<div style="position:absolute;top:-6px;right:-6px;background:#D97706;color:white;font-size:8px;font-weight:700;padding:1px 4px;border-radius:999px;white-space:nowrap;">HUNTING</div>` : ''}
        </div>
        <div style="
          background:white;border-radius:999px;
          padding:1px 8px;font-size:10px;font-weight:600;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
          margin-top:2px;white-space:nowrap;
          font-family:sans-serif;
        ">${user.name.split(' ')[0]}</div>
      </div>
    `,
    className: '',
    iconSize: [70, 65],
    iconAnchor: [35, 62],
  });

  return <Marker position={position} icon={icon} zIndexOffset={1000} />;
}

// ── Map event handler ───────────────────────────────────────
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

// ── Fly-to-user controller ──────────────────────────────────
function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const flown = useRef(false);
  useEffect(() => {
    if (position && !flown.current) {
      map.flyTo(position, 15, { duration: 1.5 });
      flown.current = true;
    }
  }, [position, map]);
  return null;
}

// ── Issue count bar ─────────────────────────────────────────
function IssueCountBar({ count, huntMode }: { count: number; huntMode: boolean }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] glass rounded-full px-4 py-2 text-sm font-medium text-[#0D0D0B] shadow flex items-center gap-2">
      {huntMode && <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />}
      {huntMode ? '🎯 Hunt Mode — find civic issues!' : `Showing ${count} issue${count !== 1 ? 's' : ''} in this area`}
    </div>
  );
}

function HeatmapInsightCard({ issues, visible }: { issues: Issue[]; visible: boolean }) {
  if (!visible || !issues.length) return null;
  const heatmapInsight = issues.find((issue) => issue.heatmapInsight)?.heatmapInsight as {
    hotspotNames?: string[];
    emergingRiskZones?: string[];
    predictedHighRiskAreas?: string[];
  } | undefined;
  const zones = Array.from(new Set(issues.map((issue) => issue.zone).filter(Boolean) as string[])).slice(0, 3);
  const hotspots = heatmapInsight?.hotspotNames?.length ? heatmapInsight.hotspotNames : zones;
  const emerging = heatmapInsight?.emergingRiskZones?.length ? heatmapInsight.emergingRiskZones : zones.slice(0, 2);

  return (
    <div className="absolute left-4 bottom-20 z-[500] w-[min(320px,calc(100%-2rem))] glass rounded-2xl p-4 shadow text-sm text-[#0D0D0B]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">AI Heatmap Insights</span>
        <span className="text-xs text-[#6F6F6F]">{issues.length} reports</span>
      </div>
      <div className="mt-3 space-y-2 text-xs text-[#6F6F6F]">
        <p><span className="font-semibold text-[#1A6B3C]">Hotspots:</span> {hotspots.join(', ') || 'Emerging from current view'}</p>
        <p><span className="font-semibold text-[#D97706]">Risk zones:</span> {emerging.join(', ') || 'No elevated zone detected'}</p>
      </div>
    </div>
  );
}

// ── Map controls ────────────────────────────────────────────
function MapControls({
  onToggleHeatmap, onToggleSatellite, onMyLocation,
  onToggleHunt, showHeatmap, showSatellite, huntMode,
}: {
  onToggleHeatmap: () => void;
  onToggleSatellite: () => void;
  onMyLocation: () => void;
  onToggleHunt: () => void;
  showHeatmap: boolean;
  showSatellite: boolean;
  huntMode: boolean;
}) {
  const map = useMap();
  return (
    <div className="absolute top-16 right-4 z-[500] flex flex-col gap-2">
      {[
        { icon: <MapPin size={16} />,  label: 'My location',     fn: onMyLocation,       active: false },
        { icon: <Target size={16} />,  label: 'Hunt Mode',       fn: onToggleHunt,       active: huntMode },
        { icon: <Flame  size={16} />,  label: 'Toggle heatmap',  fn: onToggleHeatmap,    active: showHeatmap },
        { icon: <Plus   size={16} />,  label: 'Zoom in',         fn: () => map.zoomIn(), active: false },
        { icon: <Minus  size={16} />,  label: 'Zoom out',        fn: () => map.zoomOut(),active: false },
        { icon: <Layers size={16} />,  label: 'Toggle satellite', fn: onToggleSatellite, active: showSatellite },
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

// ── Mission zones (hunt mode circles) ──────────────────────
const HUNT_ZONE_CATEGORIES = ['🕳️','💡','🚰','🗑️','🌳'];
function stableOffset(seed: string, axis: 'lat' | 'lng') {
  const chars = `${seed}-${axis}`;
  const hash = chars.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ((hash % 300) / 100000) - 0.0015;
}

function MissionZones({ userPos }: { userPos: [number, number] | null }) {
  const { mapIssues } = useMapStore();

  // Derive zone centers from actual issue clusters
  const zones = mapIssues.slice(0, 5).map((issue, i) => ({
    id: issue.id,
    lat: issue.latitude + stableOffset(issue.id, 'lat'),
    lng: issue.longitude + stableOffset(issue.id, 'lng'),
    emoji: HUNT_ZONE_CATEGORIES[i % HUNT_ZONE_CATEGORIES.length],
    inRange: userPos
      ? Math.abs(issue.latitude - userPos[0]) < 0.005 &&
        Math.abs(issue.longitude - userPos[1]) < 0.005
      : false,
  }));

  return (
    <>
      {zones.map(zone => (
        <Circle
          key={zone.id}
          center={[zone.lat, zone.lng]}
          radius={300}
          pathOptions={{
            color: '#1A6B3C',
            fillColor: '#1A6B3C',
            fillOpacity: zone.inRange ? 0.22 : 0.08,
            weight: zone.inRange ? 2.5 : 1.5,
            dashArray: zone.inRange ? undefined : '6 4',
          }}
        />
      ))}
    </>
  );
}

// ── Main export ─────────────────────────────────────────────
export default function IssueMap({ onSelectIssue }: { onSelectIssue: (issue: Issue) => void }) {
  const {
    mapIssues, showSatellite, filter,
    toggleHeatmap, toggleSatellite,
  } = useMapStore();

  const { user } = useAuthStore();
  const [userPos, setUserPos]   = useState<[number, number] | null>(null);
  const [huntMode, setHuntMode] = useState(false);
  const watchId = useRef<number | null>(null);

  // Watch user position continuously
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => null,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function handleMyLocation() {
    if (userPos) return; // FlyToUser handles it
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => null,
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* CSS for avatar animations */}
      <style>{`
        @keyframes avatarPulse {
          0%,100% { box-shadow: 0 0 0 3px currentColor, 0 0 20px currentColor; }
          50%      { box-shadow: 0 0 0 6px currentColor, 0 0 30px currentColor; }
        }
      `}</style>

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
        <FlyToUser position={userPos} />

        <MapControls
          onToggleHeatmap={toggleHeatmap}
          onToggleSatellite={toggleSatellite}
          onMyLocation={handleMyLocation}
          onToggleHunt={() => setHuntMode(h => !h)}
          showHeatmap={filter.showHeatmap}
          showSatellite={showSatellite}
          huntMode={huntMode}
        />

        {/* Mission zones — hunt mode only */}
        {huntMode && <MissionZones userPos={userPos} />}

        {/* Heatmap */}
        {filter.showHeatmap && <HeatmapLayer issues={mapIssues} />}

        {/* Issue markers */}
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

        {/* Live user avatar */}
        {user && userPos && (
          <UserAvatarMarker
            position={userPos}
            user={user}
            activeCharacter={user.activeCharacter ?? null}
            huntMode={huntMode}
          />
        )}
      </MapContainer>

      <IssueCountBar count={mapIssues.length} huntMode={huntMode} />
      <HeatmapInsightCard issues={mapIssues} visible={filter.showHeatmap} />
    </div>
  );
}
