import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ClipboardCheck, CheckCircle2, RotateCcw, CalendarCheck,
  MapPin, Sparkles, ArrowRight, Clock,
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../../types/issue.types';
import type { Category, Issue } from '../../../types/issue.types';
import { timeAgo } from '../../../utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

type WardStats = {
  pendingVerif: number;
  verifiedToday: number;
  returnedForRework: number;
  completedThisWeek: number;
  recentActivity: ActivityItem[];
};

type ActivityItem = {
  id: string;
  event: string;
  actor: string;
  actorRole: string;
  note?: string | null;
  createdAt: string;
  issueId: string;
  issueTitle: string;
  category: Category;
  zone?: string | null;
  status: string;
  department?: string | null;
};

type WardIssue = Issue & { slaHours?: number; slaBreached?: boolean };

// ── Map helpers ───────────────────────────────────────────────────────────────

function createMapIcon(category: string, status: string) {
  const icon  = CATEGORY_ICONS[category as Category] || '📍';
  const color = status === 'NeedsVerification'
    ? '#EA580C'
    : status === 'Resolved'
    ? '#16A34A'
    : CATEGORY_COLORS[category as Category] || '#1A6B3C';
  return L.divIcon({
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:white;border:3px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer;
      ">${icon}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

// ── Activity event label ──────────────────────────────────────────────────────

function eventLabel(event: string) {
  if (event.includes('Approved'))   return { label: 'Approved',    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', dot: '#16A34A' };
  if (event.includes('Rejected'))   return { label: 'Rejected',    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   dot: '#DC2626' };
  if (event.includes('Submitted'))  return { label: 'Awaiting',    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',dot: '#EA580C' };
  return                                    { label: 'Activity',   color: 'text-gray-700',   bg: 'bg-gray-50',   border: 'border-gray-200',  dot: '#9CA3AF' };
}

// ── AI brief ─────────────────────────────────────────────────────────────────

type WardBrief = {
  summary: string;
  criticalIssues: string[];
  highestPriorityAreas: string[];
  recommendedActions: string[];
  departmentsUnderPressure: string[];
  urgentEscalations: string[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function WardOfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats,        setStats]        = useState<WardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mapIssues,    setMapIssues]    = useState<WardIssue[]>([]);
  const [mapLoading,   setMapLoading]   = useState(true);
  const [brief,        setBrief]        = useState<WardBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);

  const ward = user?.ward ?? null;

  useEffect(() => {
    let active = true;

    const wardQ = ward && ward !== 'All' && ward !== 'City-Wide'
      ? `?ward=${encodeURIComponent(ward)}`
      : '';

    // Ward stats
    setStatsLoading(true);
    api.get('/authority/ward-stats')
      .then((r) => { if (active && r.data.success) setStats(r.data.data); })
      .catch(() => {})
      .finally(() => { if (active) setStatsLoading(false); });

    // Map issues — only NeedsVerification + Resolved in the ward
    setMapLoading(true);
    api.get(`/authority/issues${wardQ}`)
      .then((r) => {
        if (active && r.data.success) {
          const all = r.data.data as WardIssue[];
          setMapIssues(all.filter((i) =>
            ['NeedsVerification', 'Resolved', 'InProgress'].includes(i.status),
          ));
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setMapLoading(false); });

    // AI brief
    setBriefLoading(true);
    api.get(`/ai/authority-brief${wardQ}`)
      .then((r) => { if (active && r.data.success) setBrief(r.data.data); })
      .catch(() => {})
      .finally(() => { if (active) setBriefLoading(false); });

    return () => { active = false; };
  }, [ward]);

  const mapCenter: [number, number] = mapIssues.length > 0
    ? [mapIssues[0].latitude, mapIssues[0].longitude]
    : [22.5726, 88.3639];

  const pendingCount = stats?.pendingVerif ?? 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0D0D0B]">
            Verification Overview
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-0.5">
            Field verification command centre — {ward && ward !== 'All' ? ward : 'All Wards'}
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => navigate('/authority/ward/queue')}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors shrink-0"
          >
            <ClipboardCheck size={15} />
            {pendingCount} Awaiting Review
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-[#E5E5E0] shadow-sm">
              <div className="h-3 w-24 rounded-full bg-[#E5E5E0] animate-pulse mb-3" />
              <div className="h-8 w-12 rounded-md bg-[#E5E5E0] animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Pending Verification"
              value={stats?.pendingVerif ?? 0}
              icon={ClipboardCheck}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              urgent={Boolean(stats?.pendingVerif && stats.pendingVerif > 0)}
              onClick={() => navigate('/authority/ward/queue')}
            />
            <StatCard
              label="Verified Today"
              value={stats?.verifiedToday ?? 0}
              icon={CheckCircle2}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Returned for Rework"
              value={stats?.returnedForRework ?? 0}
              icon={RotateCcw}
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />
            <StatCard
              label="Completed This Week"
              value={stats?.completedThisWeek ?? 0}
              icon={CalendarCheck}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
          </>
        )}
      </div>

      {/* AI Brief */}
      <div className="bg-white rounded-2xl border border-[#E5E5E0] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
            <Sparkles size={18} className="text-[#1A6B3C]" /> Verification Intelligence
          </h2>
          <span className="text-xs text-[#6F6F6F]">Gemini civic intelligence</span>
        </div>

        {briefLoading ? (
          <div className="space-y-2">
            <div className="h-3 rounded-full bg-[#E5E5E0] animate-pulse w-full" />
            <div className="h-3 rounded-full bg-[#E5E5E0] animate-pulse w-4/5" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {['Pending Completions', 'SLA Deadlines', 'Rejected Issues'].map((l) => (
                <div key={l} className="rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] p-3">
                  <div className="h-2.5 w-3/4 rounded-full bg-[#E5E5E0] animate-pulse mb-2" />
                  <div className="h-2 w-1/2 rounded-full bg-[#E5E5E0] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : brief ? (
          <>
            <p className="text-sm text-[#0D0D0B] leading-relaxed">{brief.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 space-y-1">
                <span className="font-semibold text-orange-800 flex items-center gap-1.5">
                  <Clock size={12} /> Pending Completions
                </span>
                <p className="text-orange-700 leading-snug">
                  {brief.urgentEscalations?.slice(0, 2).join(', ') ||
                    (pendingCount > 0 ? `${pendingCount} issue${pendingCount > 1 ? 's' : ''} awaiting field verification` : 'No urgent escalations')}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 space-y-1">
                <span className="font-semibold text-red-800 flex items-center gap-1.5">
                  <RotateCcw size={12} /> Returned for Rework
                </span>
                <p className="text-red-700 leading-snug">
                  {brief.departmentsUnderPressure?.slice(0, 2).join(', ') ||
                    (stats?.returnedForRework ? `${stats.returnedForRework} rejection${stats.returnedForRework > 1 ? 's' : ''} this month` : 'No recent rejections')}
                </p>
              </div>
              <div className="rounded-xl bg-[#E8F5EE] border border-[#1A6B3C]/10 p-3 space-y-1">
                <span className="font-semibold text-[#0D3320] flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Recommended Actions
                </span>
                <p className="text-[#1A6B3C] leading-snug">
                  {brief.recommendedActions?.slice(0, 2).join(' · ') || 'Review pending verification queue'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#6F6F6F]">AI brief unavailable right now.</p>
        )}
      </div>

      {/* Ward Map */}
      <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E5E5E0] flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-[#0D0D0B] flex items-center gap-2">
              <MapPin size={18} className="text-[#1A6B3C]" /> Ward Verification Map
            </h2>
            <p className="text-xs text-[#6F6F6F] mt-0.5">
              🟠 Pending Verification &nbsp;·&nbsp; 🟢 Resolved &nbsp;·&nbsp; 🔵 In Progress
            </p>
          </div>
          <span className="text-xs text-[#6F6F6F]">
            {mapLoading ? 'Loading…' : `${mapIssues.length} issues`}
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
                icon={createMapIcon(issue.category, issue.status)}
              >
                <Popup>
                  <div className="p-1 space-y-1 min-w-[160px]">
                    <strong className="text-sm block leading-tight">{issue.title}</strong>
                    <span className="text-xs text-[#6F6F6F] block">
                      {issue.status === 'NeedsVerification'
                        ? '⏳ Awaiting Verification'
                        : issue.status === 'Resolved'
                        ? '✅ Resolved'
                        : '🔧 In Progress'}
                    </span>
                    {issue.zone && (
                      <span className="text-xs text-[#6F6F6F] block">{issue.zone}</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Recent Verification Activity */}
      <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 shadow-sm">
        <h2 className="font-display font-bold text-[#0D0D0B] mb-4">Recent Verification Activity</h2>
        {statsLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-[#E5E5E0] animate-pulse mt-2 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded-full bg-[#E5E5E0] animate-pulse" />
                  <div className="h-2.5 w-1/3 rounded-full bg-[#E5E5E0] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !stats?.recentActivity?.length ? (
          <p className="text-sm text-[#6F6F6F] text-center py-6">
            No verification activity yet. Check back after departments submit completions.
          </p>
        ) : (
          <div className="relative border-l-2 border-[#E5E5E0] pl-5 ml-2 space-y-5">
            {stats.recentActivity.map((act) => {
              const ev = eventLabel(act.event);
              return (
                <div key={act.id} className="relative">
                  <div
                    className="absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: ev.dot }}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ev.bg} ${ev.color} ${ev.border}`}>
                          {ev.label}
                        </span>
                        <span className="text-xs font-semibold text-[#0D0D0B] leading-tight">
                          {act.issueTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6F6F6F] mt-0.5">
                        {act.actor} · {act.department ?? act.zone ?? ''}
                      </p>
                      {act.note && (
                        <p className="text-xs text-[#6F6F6F] italic mt-0.5 line-clamp-1">
                          "{act.note}"
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0 mt-0.5">
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Stat Card sub-component ───────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconBg, iconColor, urgent = false, onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  urgent?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors
        ${urgent ? 'border-orange-300 bg-orange-50/40 cursor-pointer hover:bg-orange-50' : 'border-[#E5E5E0]'}
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="space-y-1">
        <span className="text-xs text-[#6F6F6F] font-medium uppercase tracking-wider leading-tight block">
          {label}
        </span>
        <p className={`text-2xl font-bold ${urgent && value > 0 ? 'text-orange-700' : 'text-[#0D0D0B]'}`}>
          {value}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}
