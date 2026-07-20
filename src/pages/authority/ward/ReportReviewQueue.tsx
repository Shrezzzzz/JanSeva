import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  ClipboardList, Eye, ArrowUpDown, MapPin, Calendar, CheckCircle2, XCircle,
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../../types/issue.types';
import type { Category, Issue } from '../../../types/issue.types';
import { timeAgo, formatDateTime } from '../../../utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewIssue = Issue & {
  reporter?: { id: string; name: string; citizenId: string } | null;
};

type SortField = 'createdAt' | 'severity' | 'title';

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function severityDot(sev: string) {
  const map: Record<string, string> = {
    Critical: '#DC2626', High: '#EA580C', Medium: '#D97706', Low: '#16A34A',
  };
  return map[sev] ?? '#9CA3AF';
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function ReviewDetailPanel({
  issue,
  ward,
  onClose,
  onRefresh,
}: {
  issue: ReviewIssue;
  ward: string | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [flagNote, setFlagNote] = useState('');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [mode,     setMode]     = useState<'idle' | 'flagging'>('idle');

  const wardQ = ward && ward !== 'All' && ward !== 'City-Wide'
    ? `?ward=${encodeURIComponent(ward)}`
    : '';

  const handleVerifyTrue = async () => {
    setBusy(true); setError('');
    try {
      await api.post(`/issues/${issue.id}/ward-verify-true${wardQ}`);
      onRefresh(); onClose();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error
          ?? 'Failed to confirm report.'
      );
    } finally { setBusy(false); }
  };

  const handleVerifyFalse = async () => {
    if (!flagNote.trim()) { setError('Please enter a reason for flagging.'); return; }
    setBusy(true); setError('');
    try {
      await api.post(`/issues/${issue.id}/ward-verify-false${wardQ}`, { flagNote: flagNote.trim() });
      onRefresh(); onClose();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error
          ?? 'Failed to flag report.'
      );
    } finally { setBusy(false); }
  };

  const catIcon  = CATEGORY_ICONS[issue.category as Category] ?? '📍';
  const catColor = CATEGORY_COLORS[issue.category as Category] ?? '#6F6F6F';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E5E5E0]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{catIcon}</span>
            <div>
              <h2 className="font-display font-bold text-[#0D0D0B] text-base leading-snug line-clamp-2">
                {issue.title}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: catColor }}>
                {issue.category} · {issue.zone ?? '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6F6F6F] hover:text-[#0D0D0B] shrink-0 ml-2">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Reporter */}
          <div>
            <span className="text-xs font-semibold uppercase text-[#6F6F6F] tracking-wider">Reported by</span>
            <p className="mt-1 font-medium text-[#0D0D0B] text-sm">
              {issue.isAnonymous ? 'Anonymous' : (issue.reporter?.name ?? 'Unknown')}
            </p>
            {!issue.isAnonymous && issue.reporter?.citizenId && (
              <p className="text-xs text-[#9CA3AF]">{issue.reporter.citizenId}</p>
            )}
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Submitted {timeAgo(issue.createdAt)} · {formatDateTime(issue.createdAt)}
            </p>
          </div>

          {/* Location */}
          {(issue.address || issue.zone) && (
            <div>
              <span className="text-xs font-semibold uppercase text-[#6F6F6F] tracking-wider">Location</span>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-[#0D0D0B]">
                <MapPin size={13} className="text-[#6F6F6F] shrink-0" />
                <span>{issue.address ?? issue.zone}</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${issue.latitude},${issue.longitude}`}
                target="_blank" rel="noreferrer"
                className="text-xs text-[#1A6B3C] underline mt-0.5 inline-block"
              >
                Open in Google Maps
              </a>
            </div>
          )}

          {/* Description */}
          {issue.description && (
            <div>
              <span className="text-xs font-semibold uppercase text-[#6F6F6F] tracking-wider">Description</span>
              <p className="text-sm text-[#0D0D0B] mt-1 leading-relaxed">{issue.description}</p>
            </div>
          )}

          {/* Photos */}
          {issue.mediaUrls.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase text-[#6F6F6F] tracking-wider">
                Photos ({issue.mediaUrls.length})
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {issue.mediaUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-28 object-cover rounded-xl border border-[#E5E5E0]"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Severity + upvotes */}
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-[#6F6F6F] tracking-wider">Severity</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityDot(issue.severity) }} />
                <span className="font-medium text-[#0D0D0B]">{issue.severity}</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-[#6F6F6F] tracking-wider">Upvotes</span>
              <p className="mt-1 font-medium text-[#0D0D0B]">{issue.upvotes}</p>
            </div>
          </div>

          {/* Flag note input */}
          {mode === 'flagging' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-800">Reason for flagging as false</p>
              <textarea
                rows={3}
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="Describe why this report appears false or invalid…"
                className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleVerifyFalse}
                  disabled={busy || !flagNote.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} />
                  {busy ? 'Submitting…' : 'Confirm False Report'}
                </button>
                <button
                  onClick={() => { setMode('idle'); setFlagNote(''); setError(''); }}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E5E0] text-sm text-[#6F6F6F] hover:bg-[#F7F7F5]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Actions footer — only shown when not in flagging mode */}
        {mode === 'idle' && (
          <div className="px-5 py-4 border-t border-[#E5E5E0] flex gap-3">
            <button
              onClick={handleVerifyTrue}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A6B3C] text-white text-sm font-semibold hover:bg-[#155c32] transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              {busy ? 'Confirming…' : 'Confirm Legitimate'}
            </button>
            <button
              onClick={() => setMode('flagging')}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle size={15} />
              Flag as False
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportReviewQueue() {
  const { effectiveWard } = useAuthStore();
  const ward = effectiveWard() ?? null;

  const [issues,        setIssues]        = useState<ReviewIssue[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [sortField,     setSortField]     = useState<SortField>('createdAt');
  const [sortAsc,       setSortAsc]       = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const wardQ = ward && ward !== 'All' && ward !== 'City-Wide'
        ? `?ward=${encodeURIComponent(ward)}`
        : '';
      const res = await api.get(`/authority/report-review${wardQ}`);
      if (res.data.success) setIssues(res.data.data as ReviewIssue[]);
    } catch (err) {
      console.error('Failed to load report review queue', err);
    } finally {
      setLoading(false);
    }
  }, [ward]);

  useEffect(() => { void fetchIssues(); }, [fetchIssues]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...issues].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'severity')
      cmp = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    else if (sortField === 'title')
      cmp = a.title.localeCompare(b.title);
    else
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="space-y-6 relative min-h-[80vh]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0D0D0B] flex items-center gap-2">
            <ClipboardList size={22} className="text-[#1A6B3C]" />
            Report Verification
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-0.5">
            New citizen reports awaiting legitimacy review — {ward ?? 'your ward'}
          </p>
        </div>
        {!loading && issues.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
            {issues.length} pending
          </span>
        )}
      </div>

      {/* How-to banner */}
      {!loading && issues.length > 0 && (
        <div className="bg-[#E8F5EE] border border-[#1A6B3C]/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <ClipboardList size={18} className="text-[#1A6B3C] shrink-0" />
          <p className="text-sm text-[#0D3320] leading-snug">
            Review each citizen report and confirm whether it describes a real civic issue.{' '}
            <strong>Confirm Legitimate</strong> to forward it for City Admin assignment.{' '}
            <strong>Flag as False</strong> to mark it as invalid — City Admin can review and restore if needed.
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
                  <SortHeader label="Issue"     field="title"     current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">Reported By</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">Location</th>
                  <SortHeader label="Severity"  field="severity"  current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <SortHeader label="Submitted" field="createdAt" current={sortField} asc={sortAsc} onSort={toggleSort} />
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-[#F7F7F5] transition-colors border-b border-[#E5E5E0] cursor-pointer group"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <td className="p-4 text-xl text-center">
                      {CATEGORY_ICONS[issue.category as Category] ?? '📍'}
                    </td>
                    <td className="p-4 max-w-[220px]">
                      <p className="font-semibold text-[#0D0D0B] text-sm line-clamp-2">{issue.title}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">{issue.category}</p>
                    </td>
                    <td className="p-4 text-sm text-[#0D0D0B]">
                      {issue.isAnonymous
                        ? <span className="text-xs text-[#9CA3AF] italic">Anonymous</span>
                        : <span>{issue.reporter?.name ?? '—'}</span>
                      }
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-[#0D0D0B]">
                        <MapPin size={11} className="text-[#6F6F6F] shrink-0" />
                        <span className="font-medium">{issue.zone ?? '—'}</span>
                      </div>
                      {issue.address && (
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5 line-clamp-1">{issue.address}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: severityDot(issue.severity) }} />
                        <span className="text-xs font-medium text-[#0D0D0B]">{issue.severity}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-[#6F6F6F]">
                        <Calendar size={11} className="shrink-0" />
                        <span>{timeAgo(issue.createdAt)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1A6B3C] text-white text-xs font-semibold rounded-xl hover:bg-[#155c32] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={13} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedIssue && (
        <ReviewDetailPanel
          issue={selectedIssue}
          ward={ward}
          onClose={() => setSelectedIssue(null)}
          onRefresh={fetchIssues}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortHeader({
  label, field, current, asc, onSort,
}: {
  label: string; field: SortField; current: SortField; asc: boolean; onSort: (f: SortField) => void;
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
        {active && <span className="text-[9px] font-bold text-[#1A6B3C]">{asc ? '↑' : '↓'}</span>}
      </span>
    </th>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E0] py-20 text-center space-y-3">
      <CheckCircle2 size={40} className="text-green-400 mx-auto" />
      <h3 className="font-display font-bold text-[#0D0D0B]">All clear</h3>
      <p className="text-sm text-[#6F6F6F] max-w-xs mx-auto">
        No new reports are awaiting your review right now.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#E5E5E0] bg-[#F7F7F5]">
        <div className="flex gap-6">
          {[40, 200, 100, 120, 70, 80, 60].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-[#E5E5E0] animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 border-b border-[#E5E5E0] flex gap-6 items-center">
          <div className="w-8 h-8 rounded-full bg-[#E5E5E0] animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded-full bg-[#E5E5E0] animate-pulse" />
            <div className="h-2.5 w-1/3 rounded-full bg-[#E5E5E0] animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded-full bg-[#E5E5E0] animate-pulse" />
          <div className="h-3 w-24 rounded-full bg-[#E5E5E0] animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-[#E5E5E0] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
