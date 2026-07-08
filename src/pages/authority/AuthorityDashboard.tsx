import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, MapPin, Sparkles, RefreshCw } from 'lucide-react';
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

type DashboardStats = {
  openIssues: number;
  activeWork: number;
  needsVerification: number;
  slaBreached: number;
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

function getWardQuery(ward?: string | null) {
  return ward && !CITY_WIDE_WARDS.has(ward) ? `?ward=${encodeURIComponent(ward)}` : '';
}

function createIcon(category: string) {
  const icon  = CATEGORY_ICONS[category as Category] || '❓';
  const color = CATEGORY_COLORS[category as Category] || '#1A6B3C';
  const html  = `
    <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;">
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:white;border:3px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer;
      ">${icon}</div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 32] });
}

export default function AuthorityDashboard() {
  const { user }         = useAuth();
  const { effectiveWard } = useAuthStore();

  const [issues,         setIssues]         = useState<AuthorityIssue[]>([]);
  const [activities,     setActivities]     = useState<AuthorityActivity[]>([]);
  const [stats,          setStats]          = useState<DashboardStats | null>(null);
  const [issuesLoading,  setIssuesLoading]  = useState(true);
  const [activityLoading,setActivityLoading]= useState(true);
  const [statsLoading,   setStatsLoading]   = useState(true);
  const [brief,          setBrief]          = useState<AuthorityBrief | null>(null);
  const [briefLoading,   setBriefLoading]   = useState(false);
  const [briefError,     setBriefError]     = useState(false);

  // Use effectiveWard so City Admin / Dept Officers use their DB ward while
  // the shared Ward Officer account uses the session-selected ward.
  const ward = effectiveWard() ?? user?.ward ?? null;
  const queryParams = getWardQuery(ward);

  // ── Fetch brief (extracted so Retry button can call it) ───────────────────
  const fetchBrief = useCallback(async (qp: string) => {
    setBriefLoading(true);
    setBriefError(false);
    try {
      const res = await api.get(`/ai/authority-brief${qp}`);
      setBrief(res.data.success ? (res.data.data as AuthorityBrief) : null);
      if (!res.data.success) setBriefError(true);
    } catch {
      setBriefError(true);
      setBrief(null);
    } finally {
      setBriefLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    setBrief(null);
    setBriefError(false);
    setIssuesLoading(true);
    setActivityLoading(true);
    setStatsLoading(true);
    setBriefLoading(true);

    // Issues (for map + activity fallback)
    api.get(`/authority/issues${queryParams}`)
      .then((res) => { if (active && res.data.success) setIssues(res.data.data as AuthorityIssue[]); })
      .catch((e) => console.error('Dashboard issues error', e))
      .finally(() => { if (active) setIssuesLoading(false); });

    // Activity feed
    const sep = queryParams ? '&' : '?';
    api.get(`/authority/activity${queryParams}${sep}limit=10`)
      .then((res) => { if (active && res.data.success) setActivities(res.data.data as AuthorityActivity[]); })
      .catch((e) => console.error('Dashboard activity error', e))
      .finally(() => { if (active) setActivityLoading(false); });

    // Real stats from the dedicated count() endpoint — accurate across all pages
    api.get(`/authority/issues/stats${queryParams}`)
      .then((res) => { if (active && res.data.success) setStats(res.data.data as DashboardStats); })
      .catch((e) => console.error('Dashboard stats error', e))
      .finally(() => { if (active) setStatsLoading(false); });

    // AI brief
    fetchBrief(queryParams).finally(() => { if (!active) return; });

    return () => { active = false; };
  }, [ward]); // eslint-disable-line react-hooks/exhaustive-deps

  // Map: filter to ward if set
  const mapIssues = ward && ward !== 'All'
    ? issues.filter((i) => i.zone === ward)
    : issues;

  const mapCenter: [number, number] = mapIssues.length > 0
    ? [mapIssues[0].latitude, mapIssues[0].longitude]
    : [22.5726, 88.3639];

  // Activity feed — prefer dedicated endpoint, fall back to issue timelines
  const timelineActivities = issues
    .flatMap((i) => (i.timeline || []).map((t) => ({
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
          Real-time case monitoring for {ward && ward !== 'All' ? ward : 'Kolkata City'}
        </p>
      </div>

      {/* ── AI Brief card ── */}
      <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
            <Sparkles size={18} className="text-[#1A6B3C]" /> Today's AI Brief
          </h2>
          <span className="text-xs text-[#6F6F6F]">Gemini civic intelligence</span>
        </div>

        {briefLoading && (
          <>
            <p className="text-sm text-[#6F6F6F] leading-relaxed">Generating AI brief…</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {['Critical Issues', 'Priority Areas', 'Recommended Actions'].map((label) => (
                <div key={label} className="rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] p-3">
                  <span className="font-semibold text-[#6F6F6F]">{label}</span>
                  <div className="mt-2 h-2 w-2/3 rounded-full bg-[#E5E5E0] animate-pulse" />
                </div>
              ))}
            </div>
          </>
        )}

        {!briefLoading && briefError && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-[#6F6F6F]">
              The AI brief couldn't load right now. This may be a temporary issue.
            </p>
            <button
              onClick={() => fetchBrief(queryParams)}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1A6B3C] hover:underline"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {!briefLoading && !briefError && brief && (
          <>
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
          </>
        )}
      </div>

      {/* ── Stats Cards — sourced from /authority/issues/stats (full count()) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Open Issues',        count: stats?.openIssues ?? 0,         icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Active Work',        count: stats?.activeWork ?? 0,          icon: Clock,         color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Needs Verification', count: stats?.needsVerification ?? 0,   icon: CheckCircle2,  color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'SLA Breached',       count: stats?.slaBreached ?? 0,         icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E5E0] shadow-sm flex items-center justify-between">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 mr-2">
              <span className="text-[10px] sm:text-xs text-[#6F6F6F] font-medium uppercase tracking-wider leading-tight block">
                {card.label}
              </span>
              {statsLoading ? (
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

      {/* ── Ward Map ── */}
      <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E5E5E0] flex items-center justify-between">
          <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
            <MapPin size={18} className="text-[#1A6B3C]" /> Ward Issues Map
          </h2>
          <span className="text-xs text-[#6F6F6F]">
            {issuesLoading ? 'Loading markers…' : `${mapIssues.length} active markers`}
          </span>
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

      {/* ── Recent Activity ── */}
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
