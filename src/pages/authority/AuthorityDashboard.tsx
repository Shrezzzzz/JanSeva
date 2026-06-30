import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, MapPin, Sparkles } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../types/issue.types';
import type { Category, Issue } from '../../types/issue.types';
import { timeAgo } from '../../utils/formatters';

type AuthorityTimelineEvent = {
  id?: string;
  issueId?: string;
  createdAt: string;
  actor: string;
  actorRole: string;
  event: string;
  note?: string | null;
  mediaUrl?: string | null;
};

type AuthorityIssue = Issue & {
  assignedTo?: string | null;
  slaHours?: number;
  slaBreached?: boolean;
  timeline?: AuthorityTimelineEvent[];
};

type AuthorityBrief = {
  summary: string;
  criticalIssues: string[];
  duplicateClusters: string[];
  recommendedActions: string[];
  highestPriorityAreas: string[];
  departmentsUnderPressure: string[];
  urgentEscalations: string[];
  suggestedWorkOrder: string[];
};

type AuthorityActivity = AuthorityTimelineEvent & {
  id: string;
  issueId: string;
  issueTitle: string;
  category: Category;
  zone?: string | null;
  status?: string;
};

const CITY_WIDE_WARDS = new Set(['All', 'City-Wide']);
const requestCache = new Map<string, {
  issues?: Promise<AuthorityIssue[]>;
  activity?: Promise<AuthorityActivity[]>;
  brief?: Promise<AuthorityBrief | null>;
}>();

function getWardQuery(ward?: string | null) {
  return ward && !CITY_WIDE_WARDS.has(ward) ? `?ward=${encodeURIComponent(ward)}` : '';
}

function fetchDashboardIssues(queryParams: string) {
  const key = `issues:${queryParams}`;
  const cached = requestCache.get(key)?.issues;
  if (cached) return cached;

  const request = api.get(`/authority/issues${queryParams}`)
    .then((res) => (res.data.success ? res.data.data as AuthorityIssue[] : []))
    .finally(() => {
      setTimeout(() => requestCache.delete(key), 5_000);
    });

  requestCache.set(key, { ...requestCache.get(key), issues: request });
  return request;
}

function fetchDashboardActivity(queryParams: string) {
  const key = `activity:${queryParams}`;
  const cached = requestCache.get(key)?.activity;
  if (cached) return cached;

  const separator = queryParams ? '&' : '?';
  const request = api.get(`/authority/activity${queryParams}${separator}limit=10`)
    .then((res) => (res.data.success ? res.data.data as AuthorityActivity[] : []))
    .finally(() => {
      setTimeout(() => requestCache.delete(key), 5_000);
    });

  requestCache.set(key, { ...requestCache.get(key), activity: request });
  return request;
}

function fetchAuthorityBrief(queryParams: string) {
  const key = `brief:${queryParams}`;
  const cached = requestCache.get(key)?.brief;
  if (cached) return cached;

  const request = api.get(`/ai/authority-brief${queryParams}`)
    .then((res) => (res.data.success ? res.data.data as AuthorityBrief : null))
    .finally(() => {
      setTimeout(() => requestCache.delete(key), 5_000);
    });

  requestCache.set(key, { ...requestCache.get(key), brief: request });
  return request;
}

function createIcon(category: string) {
  const icon = CATEGORY_ICONS[category as Category] || '❓';
  const color = CATEGORY_COLORS[category as Category] || '#1A6B3C';
  const html = `
    <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;">
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:white;border:3px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.18);
        cursor:pointer;
      ">${icon}</div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 32] });
}

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<AuthorityIssue[]>([]);
  const [activities, setActivities] = useState<AuthorityActivity[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [brief, setBrief] = useState<AuthorityBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const queryParams = getWardQuery(user?.ward);

    setBrief(null);
    setIssuesLoading(true);
    setActivityLoading(true);
    setBriefLoading(true);

    const issuesRequest = fetchDashboardIssues(queryParams)
      .then((data) => {
        if (active) setIssues(data);
      })
      .catch((err) => {
        console.error('Error fetching dashboard issues', err);
      })
      .finally(() => {
        if (active) setIssuesLoading(false);
      });

    const activityRequest = fetchDashboardActivity(queryParams)
      .then((data) => {
        if (active) setActivities(data);
      })
      .catch((err) => {
        console.error('Error fetching dashboard activity', err);
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });

    const briefRequest = fetchAuthorityBrief(queryParams)
      .then((data) => {
        if (active) setBrief(data);
      })
      .catch((err) => {
        console.error('Error fetching authority AI brief', err);
      })
      .finally(() => {
        if (active) setBriefLoading(false);
      });

    void Promise.allSettled([issuesRequest, activityRequest, briefRequest]);

    return () => {
      active = false;
    };
  }, [user?.ward]);

  // Calculate Stat Cards — updated for full status lifecycle
  const openIssues = issues.filter((i) => !['Resolved', 'Closed'].includes(i.status)).length;
  const inProgress = issues.filter((i) => ['Accepted', 'InProgress'].includes(i.status)).length;
  const needsVerif = issues.filter((i) => i.status === 'NeedsVerification').length;
  const slaBreached = issues.filter((i) => i.slaBreached).length;

  // Ward Specific Issues for Map
  const mapIssues = user?.ward && user.ward !== 'All'
    ? issues.filter(i => i.zone === user.ward)
    : issues;

  // Center on first issue or default Kolkata center
  const mapCenter: [number, number] = mapIssues.length > 0
    ? [mapIssues[0].latitude, mapIssues[0].longitude]
    : [22.5726, 88.3639];

  // Activities feed
  const timelineActivities = issues
    .flatMap(i => (i.timeline || []).map((t) => ({
      ...t,
      id: t.id || `${i.id}-${t.createdAt}-${t.event}`,
      issueId: t.issueId || i.id,
      issueTitle: i.title,
      category: i.category,
    })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const recentActivities = activities.length > 0 ? activities : timelineActivities;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0D0D0B]">Dashboard Overview</h1>
        <p className="text-sm text-[#6F6F6F]">
          Real-time case monitoring for {user?.ward && user.ward !== 'All' ? user.ward : 'Kolkata City'}
        </p>
      </div>

      {briefLoading && !brief && (
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
              <Sparkles size={18} className="text-[#1A6B3C]" /> Today's AI Brief
            </h2>
            <span className="text-xs text-[#6F6F6F]">Gemini civic intelligence</span>
          </div>
          <p className="text-sm text-[#6F6F6F] leading-relaxed">Generating AI brief...</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {['Critical Issues', 'Priority Areas', 'Recommended Actions'].map((label) => (
              <div key={label} className="rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] p-3">
                <span className="font-semibold text-[#6F6F6F]">{label}</span>
                <div className="mt-2 h-2 w-2/3 rounded-full bg-[#E5E5E0]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {brief && (
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
              <Sparkles size={18} className="text-[#1A6B3C]" /> Today's AI Brief
            </h2>
            <span className="text-xs text-[#6F6F6F]">Gemini civic intelligence</span>
          </div>
          <p className="text-sm text-[#0D0D0B] leading-relaxed">{brief.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <span className="font-semibold text-red-800">Critical Issues</span>
              <p className="text-red-700 mt-1">{brief.criticalIssues.slice(0, 2).join(', ') || 'No critical spike'}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <span className="font-semibold text-amber-800">Priority Areas</span>
              <p className="text-amber-700 mt-1">{brief.highestPriorityAreas.slice(0, 2).join(', ') || 'Stable'}</p>
            </div>
            <div className="rounded-xl bg-[#E8F5EE] border border-[#1A6B3C]/10 p-3">
              <span className="font-semibold text-[#0D3320]">Recommended Actions</span>
              <p className="text-[#1A6B3C] mt-1">{brief.recommendedActions.slice(0, 2).join(' · ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Open Issues',        count: openIssues,  icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Active Work',        count: inProgress,  icon: Clock,         color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Needs Verification', count: needsVerif,  icon: CheckCircle2,  color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'SLA Breached',       count: slaBreached, icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E5E0] shadow-sm flex items-center justify-between">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 mr-2">
              <span className="text-[10px] sm:text-xs text-[#6F6F6F] font-medium uppercase tracking-wider leading-tight block">{card.label}</span>
              {issuesLoading ? (
                <div className="h-7 sm:h-8 w-10 sm:w-12 rounded-md bg-[#E5E5E0] animate-pulse" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-[#0D0D0B]">{card.count}</p>
              )}
            </div>
            <div className={`p-2 sm:p-3 rounded-xl ${card.bg} ${card.color} shrink-0`}>
              <card.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Ward Map */}
      <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E5E5E0] flex items-center justify-between">
          <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
            <MapPin size={18} className="text-[#1A6B3C]" /> Ward Issues Map
          </h2>
          <span className="text-xs text-[#6F6F6F]">{issuesLoading ? 'Loading markers...' : `${mapIssues.length} active markers`}</span>
        </div>
        <div className="h-[300px] w-full z-10 relative">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            />
            {mapIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={createIcon(issue.category)}
              >
                <Popup>
                  <div className="p-1 space-y-1">
                    <strong className="text-sm block">{issue.title}</strong>
                    <span className="text-xs text-[#6F6F6F] block">Status: {issue.status}</span>
                    <span className="text-xs text-[#6F6F6F] block">SLA: {issue.slaHours}h</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 shadow-sm">
        <h2 className="font-display font-bold text-[#0D0D0B] mb-4">Recent Activity</h2>
        {activityLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <div className="h-7 w-7 rounded-full bg-[#E5E5E0] animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/3 rounded-full bg-[#E5E5E0] animate-pulse" />
                    <div className="h-3 w-2/3 rounded-full bg-[#E5E5E0] animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-12 rounded-full bg-[#E5E5E0] animate-pulse" />
              </div>
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <p className="text-sm text-[#6F6F6F] py-4 text-center">No recent activity detected.</p>
        ) : (
          <div className="divide-y divide-[#E5E5E0]">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="text-2xl mt-0.5">{CATEGORY_ICONS[act.category as Category] || '❓'}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#0D0D0B]">{act.issueTitle}</h4>
                    <p className="text-xs text-[#6F6F6F] mt-0.5">
                      <span className="font-medium text-[#1A6B3C]">{act.actor}</span> ({act.actorRole}): {act.event}
                      {act.note && <span className="italic block mt-0.5">"{act.note}"</span>}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#9E9E9C] shrink-0">{timeAgo(act.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
