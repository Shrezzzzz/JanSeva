import { useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Issue } from '../../types/issue.types';
import { CATEGORY_COLORS, CATEGORY_ICONS, STATUS_COLORS } from '../../types/issue.types';
import { timeAgo } from '../../utils/formatters';
import { CATEGORY_LABELS } from '../../utils/constants';

function createIssueIcon(issue: Issue) {
  const catColor  = CATEGORY_COLORS[issue.category] ?? '#6F6F6F';
  const statColor = STATUS_COLORS[issue.status]     ?? '#9CA3AF';
  const icon      = CATEGORY_ICONS[issue.category]  ?? '❓';

  const html = `
    <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:white;border:3px solid ${catColor};
        display:flex;align-items:center;justify-content:center;
        font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.18);
        cursor:pointer;
      ">${icon}</div>
      <div style="
        position:absolute;bottom:0;right:0;
        width:10px;height:10px;border-radius:50%;
        background:${statColor};border:2px solid white;
      "></div>
    </div>
  `;

  return L.divIcon({ html, className: '', iconSize: [36, 44], iconAnchor: [18, 44] });
}

interface IssueMarkerProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
}

export default function IssueMarker({ issue, onClick }: IssueMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  const tooltipContent = `
    <div class="marker-tooltip">
      <strong>${issue.title}</strong>
      <span>${CATEGORY_LABELS[issue.category] ?? issue.category} · ${issue.status}</span>
      <span>👍 ${issue.upvotes} confirmation${issue.upvotes !== 1 ? 's' : ''}</span>
      <span class="marker-tooltip-time">${timeAgo(issue.createdAt)}</span>
    </div>
  `;

  return (
    <Marker
      ref={markerRef}
      position={[issue.latitude, issue.longitude]}
      icon={createIssueIcon(issue)}
      eventHandlers={{
        click: () => onClick(issue),
        add: () => {
          markerRef.current?.bindTooltip(tooltipContent, {
            permanent:  false,
            direction:  'top',
            offset:     [0, -12],
            className:  'leaflet-tooltip-custom',
          });
        },
      }}
    />
  );
}
