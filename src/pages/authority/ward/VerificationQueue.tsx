import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  ClipboardCheck, Eye, ArrowUpDown, Clock, CheckCircle2, RotateCcw,
  Building2, MapPin, Calendar,
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../../types/issue.types';
import type { Category, Issue } from '../../../types/issue.types';
import { timeAgo, formatDateTime } from '../../../utils/formatters';
import WardIssueDetailPanel from './WardIssueDetailPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

type VerificationIssue = Issue & {
  assignedTo?: string | null;
  slaHours?: number;
  slaBreached?: boolean;
};

type SortField = 'createdAt' | 'updatedAt' | 'severity' | 'title';

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function urgencyBadge(issue: VerificationIssue) {
  const hours = issue.slaHours ?? 0;
  if (issue.severity === 'Critical' || hours > 96)
    return { label: 'Urgent',  cls: 'bg-red-100 text-red-800 border-red-200' };
  if (issue.severity === 'High' || hours > 48)
    return { label: 'High',    cls: 'bg-orange-100 text-orange-800 border-orange-200' };
  return   { label: 'Normal',  cls: 'bg-gray-100 text-gray-700 border-gray-200' };
}

function severityDot(sev: string) {
  const map: Record<string, string> = {
    Critical: '#DC2626', High: '#EA580C', Medium: '#D97706', Low: '#16A34A',
  };
  return map[sev] ?? '#9CA3AF';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VerificationQueue() {
  const { effectiveWard } = useAuthStore();
  // Use session-selected ward for shared officer account, or DB ward for legacy accounts
  const ward = effectiveWard() ?? null;

  const [issues,          setIssues]          = useState<VerificationIssue[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [sortField,       setSortField]       = useState<SortField>('createdAt');
  const [sortAsc,         setSortAsc]         = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      // Pass ward as a query param so the shared officer account
      // (no DB ward) gets correctly scoped to their session-selected ward.
      const wardQ = ward && ward !== 'All' && ward !== 'City-Wide'
        ? `?ward=${encodeURIComponent(ward)}`
        : '';
      const res = await api.get(`/authority/issues${wardQ}`);
      if (res.data.success) setIssues(res.data.data as VerificationIssue[]);
    } catch (err) {
      console.error('Failed to load verification queue', err);
    } finally {
      setLoading(false);
    }
  }, [ward]);

  useEffect(() => { void fetchIssues(); }, [fetchIssues, ward]);

  // ── Sort ──────────────────────────────────────────────────────────────────

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...issues].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'severity') {
      cmp = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    } else if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else {
      cmp = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
    }
    return sortAsc ? cmp : -cmp;
  });

  const urgentCount  = sorted.filter((i) => urgencyBadge(i).label === 'Urgent').length;
  const highCount    = sorted.filter((i) => urgencyBadge(i).label === 'High').length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative min-h-[80vh]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0D0D0B] flex items-center gap-2">
            <ClipboardCheck size={22} className="text-orange-600" />
            Verification Queue
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-0.5">
            Completed work awaiting your field inspection — {ward ?? 'your ward'}
          </p>
        </div>
        {!loading && issues.length > 0 && (
          <div className="flex items-center gap-2 text-xs shrink-0">
            {urgentCount > 0 && (
              <span className="px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-800 border border-red-200">
                {urgentCount} Urgent
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2.5 py-1 rounded-full font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                {highCount} High
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              {issues.length} total
            </span>
          </div>
        )}
      </div>

      {/* How-to banner — shown when queue has items */}
      {!loading && issues.length > 0 && (
        <div className="bg-[#E8F5EE] border border-[#1A6B3C]/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <ClipboardCheck size={18} className="text-[#1A6B3C] shrink-0" />
          <p className="text-sm text-[#0D3320] leading-snug">
            Each issue below has been marked complete by a department officer. Open it, review the completion
            report against the original citizen complaint, and either <strong>Approve</strong> to resolve
            or <strong>Reject &amp; Return</strong> for rework.
          </p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : issues.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E5E5E0]">
                  <th className="p-4 w-10" />
                  <SortHeader label="Issue" field="title"     current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Department
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Location
                  </th>
                  <SortHeader label="Severity" field="severity"  current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <SortHeader label="Submitted" field="updatedAt" current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <SortHeader label="Waiting"  field="createdAt" current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Priority
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onOpen={() => setSelectedIssueId(issue.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail panel */}
      <WardIssueDetailPanel
        issueId={selectedIssueId}
        onClose={() => {
          setSelectedIssueId(null);
          void fetchIssues();
        }}
      />
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function IssueRow({
  issue,
  onOpen,
}: {
  issue: VerificationIssue;
  onOpen: () => void;
}) {
  const badge = urgencyBadge(issue);
  const catIcon = CATEGORY_ICONS[issue.category as Category] ?? '📍';

  return (
    <tr
      className="hover:bg-[#F7F7F5] transition-colors border-b border-[#E5E5E0] cursor-pointer group"
      onClick={onOpen}
    >
      {/* Category icon */}
      <td className="p-4 text-xl text-center">{catIcon}</td>

      {/* Issue title */}
      <td className="p-4 max-w-[220px]">
        <p className="font-semibold text-[#0D0D0B] text-sm leading-snug line-clamp-2">{issue.title}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">{issue.category}</p>
      </td>

      {/* Department */}
      <td className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-[#0D0D0B] font-medium">
          <Building2 size={12} className="text-[#6F6F6F] shrink-0" />
          <span className="line-clamp-1">{issue.department ?? '—'}</span>
        </div>
        {issue.assignedTo && (
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">{issue.assignedTo}</p>
        )}
      </td>

      {/* Location */}
      <td className="p-4">
        <div className="flex items-center gap-1 text-xs text-[#0D0D0B]">
          <MapPin size={11} className="text-[#6F6F6F] shrink-0" />
          <span className="font-medium">{issue.zone ?? '—'}</span>
        </div>
        {issue.address && (
          <p className="text-[10px] text-[#9CA3AF] mt-0.5 line-clamp-1">{issue.address}</p>
        )}
      </td>

      {/* Severity */}
      <td className="p-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: severityDot(issue.severity) }}
          />
          <span className="text-xs font-medium text-[#0D0D0B]">{issue.severity}</span>
        </div>
      </td>

      {/* Completion submitted time */}
      <td className="p-4">
        <div className="flex items-center gap-1 text-xs text-[#6F6F6F]">
          <Calendar size={11} className="shrink-0" />
          <span>{timeAgo(issue.updatedAt)}</span>
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{formatDateTime(issue.updatedAt)}</p>
      </td>

      {/* Waiting since */}
      <td className="p-4">
        <div className="flex items-center gap-1 text-xs text-[#6F6F6F]">
          <Clock size={11} className="shrink-0" />
          <span>{timeAgo(issue.createdAt)}</span>
        </div>
      </td>

      {/* Urgency badge */}
      <td className="p-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </td>

      {/* Review button */}
      <td className="p-4 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Eye size={13} /> Review
        </button>
      </td>
    </tr>
  );
}

// ── SortHeader ────────────────────────────────────────────────────────────────

function SortHeader({
  label, field, current, asc, onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  asc: boolean;
  onSort: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <th
      className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F] cursor-pointer hover:text-[#0D0D0B] select-none"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} className={active ? 'text-[#1A6B3C]' : ''} />
        {active && (
          <span className="text-[9px] font-bold text-[#1A6B3C]">
            {asc ? '↑' : '↓'}
          </span>
        )}
      </span>
    </th>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E0] py-20 text-center space-y-3">
      <CheckCircle2 size={40} className="text-green-400 mx-auto" />
      <h3 className="font-display font-bold text-[#0D0D0B]">All clear</h3>
      <p className="text-sm text-[#6F6F6F] max-w-xs mx-auto">
        No completed work is awaiting your verification right now. You'll be notified
        when a department officer submits a completion.
      </p>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#E5E5E0] bg-[#F7F7F5]">
        <div className="flex gap-6">
          {[40, 200, 120, 120, 70, 80, 80, 70, 60].map((w, i) => (
            <div key={i} className={`h-3 rounded-full bg-[#E5E5E0] animate-pulse`} style={{ width: w }} />
          ))}
        </div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-4 border-b border-[#E5E5E0] flex gap-6 items-center">
          <div className="w-8 h-8 rounded-full bg-[#E5E5E0] animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded-full bg-[#E5E5E0] animate-pulse" />
            <div className="h-2.5 w-1/3 rounded-full bg-[#E5E5E0] animate-pulse" />
          </div>
          <div className="h-3 w-28 rounded-full bg-[#E5E5E0] animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-[#E5E5E0] animate-pulse" />
          <div className="h-3 w-16 rounded-full bg-[#E5E5E0] animate-pulse" />
          <div className="h-3 w-16 rounded-full bg-[#E5E5E0] animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-[#E5E5E0] animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-[#E5E5E0] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
