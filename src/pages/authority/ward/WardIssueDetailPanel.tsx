import { useCallback, useEffect, useState } from 'react';
import api from '../../../services/api';
import {
  X, Shield, Eye, ThumbsUp, ThumbsDown, ClipboardCheck,
  MapPin, User, Calendar, Building2, FileText, Camera,
  CheckSquare, Square, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { CATEGORY_ICONS, STATUS_COLORS } from '../../../types/issue.types';
import type { Category, Issue, IssueStatus } from '../../../types/issue.types';
import { timeAgo, formatDateTime, formatDate } from '../../../utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  issueId: string | null;
  onClose: () => void;
}

type TimelineEvent = {
  id: string;
  event: string;
  actor: string;
  actorRole: string;
  note?: string | null;
  mediaUrl?: string | null;
  createdAt: string;
};

type WardIssue = Issue & {
  reporter?: { name?: string | null; email?: string | null } | null;
  internalNotes?: { id: string; authorName: string; content: string; createdAt: string }[];
  assignedTo?: string | null;
};

type ChecklistKey =
  | 'workCompleted'
  | 'locationMatches'
  | 'hazardRemoved'
  | 'photosAccurate'
  | 'siteInspectionPassed';

const CHECKLIST_ITEMS: { key: ChecklistKey; label: string; description: string }[] = [
  { key: 'workCompleted',       label: 'Work completed as described',      description: 'The reported work matches the actual work done on-site'        },
  { key: 'locationMatches',     label: 'Location matches original report', description: 'Work was done at the address/location the citizen reported'    },
  { key: 'hazardRemoved',       label: 'Public hazard removed',            description: 'Any safety risk from the original issue has been eliminated'   },
  { key: 'photosAccurate',      label: 'Completion photos are accurate',   description: 'Photos submitted by the department reflect the actual site'    },
  { key: 'siteInspectionPassed',label: 'Site inspection passed',           description: 'Physical visit confirms the issue is resolved to standard'     },
];

// ── Timeline step colours ─────────────────────────────────────────────────────

function timelineDot(event: string): string {
  if (event.includes('Reported'))         return '#6B7280';
  if (event.includes('AI'))               return '#7C3AED';
  if (event.includes('Assigned'))         return '#2563EB';
  if (event.includes('Accepted'))         return '#7C3AED';
  if (event.includes('Work Started'))     return '#D97706';
  if (event.includes('Progress'))         return '#0891B2';
  if (event.includes('Completed'))        return '#EA580C';
  if (event.includes('Verification'))     return '#EA580C';
  if (event.includes('Approved'))         return '#16A34A';
  if (event.includes('Rejected'))         return '#DC2626';
  return '#9CA3AF';
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, accent = false, children, collapsible = false,
}: {
  title: string;
  icon: React.ElementType;
  accent?: boolean;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`border-b border-[#E5E5E0] ${accent ? 'bg-orange-50/60' : 'bg-white'}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        onClick={() => collapsible && setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">
          <Icon size={13} className={accent ? 'text-orange-600' : 'text-[#1A6B3C]'} />
          {title}
        </span>
        {collapsible && (open ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />)}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

// ── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGrid({ urls, label }: { urls: string[]; label: string }) {
  if (!urls.length) return (
    <p className="text-xs text-[#9CA3AF] italic">{label} — no photos submitted.</p>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
          className="relative group rounded-xl overflow-hidden border border-[#E5E5E0] block">
          <img src={url} alt={`${label} ${i + 1}`} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye size={18} className="text-white" />
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Original citizen report section ──────────────────────────────────────────

function OriginalReport({ issue }: { issue: WardIssue }) {
  return (
    <Section title="Original Citizen Report" icon={User} collapsible>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#F7F7F5] rounded-xl border border-[#E5E5E0] p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Reporter</span>
            <span className="font-semibold text-[#0D0D0B]">
              {issue.isAnonymous ? 'Anonymous' : (issue.reporter?.name ?? 'Citizen')}
            </span>
          </div>
          <div className="bg-[#F7F7F5] rounded-xl border border-[#E5E5E0] p-2.5">
            <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Reported</span>
            <span className="font-semibold text-[#0D0D0B]">{formatDate(issue.createdAt)}</span>
          </div>
        </div>
        {issue.address && (
          <div className="flex items-start gap-1.5 text-xs">
            <MapPin size={12} className="text-[#6F6F6F] mt-0.5 shrink-0" />
            <span className="text-[#0D0D0B]">{issue.address}</span>
          </div>
        )}
        {issue.description && (
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-1">Description</span>
            <p className="text-xs text-[#0D0D0B] leading-relaxed bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl p-3">
              {issue.description}
            </p>
          </div>
        )}
        <div>
          <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-2">Original Photos</span>
          <PhotoGrid urls={issue.mediaUrls ?? []} label="Original photo" />
        </div>
      </div>
    </Section>
  );
}

// ── Department completion report section ──────────────────────────────────────

function CompletionReport({ issue }: { issue: WardIssue }) {
  const hasCompletion = Boolean(issue.completionNotes || (issue.completionPhotos?.length ?? 0) > 0);
  return (
    <Section title="Department Completion Report" icon={Building2} accent collapsible>
      {!hasCompletion ? (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">Department has not submitted a completion report yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded-xl border border-orange-100 p-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Department</span>
              <span className="font-semibold text-[#0D0D0B]">{issue.department ?? '—'}</span>
            </div>
            <div className="bg-white rounded-xl border border-orange-100 p-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Officer</span>
              <span className="font-semibold text-[#0D0D0B] text-[10px]">{issue.assignedTo ?? '—'}</span>
            </div>
            <div className="bg-white rounded-xl border border-orange-100 p-2.5 col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Submitted</span>
              <span className="font-semibold text-[#0D0D0B]">{formatDateTime(issue.updatedAt)}</span>
            </div>
          </div>
          {issue.completionNotes && (
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-1">Work Summary</span>
              <p className="text-xs text-[#0D0D0B] leading-relaxed bg-white border border-orange-100 rounded-xl p-3">
                {issue.completionNotes}
              </p>
            </div>
          )}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-2">Completion Photos</span>
            <PhotoGrid urls={issue.completionPhotos ?? []} label="Completion photo" />
          </div>
        </div>
      )}
    </Section>
  );
}

// ── Timeline section ──────────────────────────────────────────────────────────

function IssueTimeline({ events }: { events: TimelineEvent[] }) {
  // Map well-known status milestones for the lifecycle diagram
  const milestones = [
    'Reported', 'AI', 'Assigned', 'Accepted', 'Started', 'Progress', 'Completed', 'Verification', 'Approved',
  ];
  return (
    <Section title="Issue Lifecycle" icon={Calendar} collapsible>
      {!events.length ? (
        <p className="text-xs text-[#9CA3AF] italic">No timeline events recorded.</p>
      ) : (
        <div className="relative border-l-2 border-[#E5E5E0] pl-4 ml-1.5 space-y-4">
          {events.map((evt, i) => (
            <div key={evt.id ?? i} className="relative">
              <div
                className="absolute -left-[23px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shrink-0"
                style={{ backgroundColor: timelineDot(evt.event) }}
              />
              <h4 className="text-xs font-bold text-[#0D0D0B] leading-snug">{evt.event}</h4>
              <p className="text-[10px] text-[#6F6F6F] mt-0.5">
                <span className="font-semibold">{evt.actor}</span>
                {' '}({evt.actorRole}) · {timeAgo(evt.createdAt)}
              </p>
              {evt.note && (
                <p className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg border border-[#E5E5E0] mt-1 italic leading-snug">
                  "{evt.note}"
                </p>
              )}
              {evt.mediaUrl && (
                <a href={evt.mediaUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[#1A6B3C] underline mt-1">
                  <Camera size={10} /> View photo
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Verification checklist ────────────────────────────────────────────────────

function VerificationChecklist({
  checked,
  onChange,
}: {
  checked: Record<ChecklistKey, boolean>;
  onChange: (key: ChecklistKey, value: boolean) => void;
}) {
  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.key]);
  return (
    <Section title="Verification Checklist" icon={ClipboardCheck} accent>
      <div className="space-y-2.5">
        {CHECKLIST_ITEMS.map(({ key, label, description }) => (
          <label key={key}
            className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors
              ${checked[key]
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-[#E5E5E0] hover:border-orange-200 hover:bg-orange-50/30'}`}
          >
            <div className="mt-0.5 shrink-0">
              {checked[key]
                ? <CheckSquare size={16} className="text-green-600" />
                : <Square size={16} className="text-[#9CA3AF]" />}
            </div>
            <div className="flex-1">
              <input
                type="checkbox"
                className="sr-only"
                checked={checked[key]}
                onChange={(e) => onChange(key, e.target.checked)}
              />
              <p className={`text-xs font-semibold leading-snug ${checked[key] ? 'text-green-800' : 'text-[#0D0D0B]'}`}>
                {label}
              </p>
              <p className="text-[10px] text-[#6F6F6F] mt-0.5 leading-snug">{description}</p>
            </div>
          </label>
        ))}
        {allChecked && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mt-1">
            <CheckSquare size={14} className="text-green-600 shrink-0" />
            <p className="text-xs font-semibold text-green-800">All checks passed — ready to approve</p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ── Decision panel (approve / reject) ────────────────────────────────────────

function DecisionPanel({
  issue,
  onRefresh,
}: {
  issue: WardIssue;
  onRefresh: () => void;
}) {
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    workCompleted: false, locationMatches: false, hazardRemoved: false,
    photosAccurate: false, siteInspectionPassed: false,
  });
  const [verificationNote, setVerificationNote] = useState('');
  const [showReject,        setShowReject]        = useState(false);
  const [rejectionNote,     setRejectionNote]     = useState('');
  const [busy,              setBusy]              = useState(false);
  const [error,             setError]             = useState('');

  const handleChecklistChange = (key: ChecklistKey, value: boolean) =>
    setChecklist((prev) => ({ ...prev, [key]: value }));

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const allChecked   = checkedCount === CHECKLIST_ITEMS.length;

  const handleApprove = async () => {
    setBusy(true); setError('');
    try {
      await api.post(`/issues/${issue.id}/verify-approve`, {
        verificationNote: verificationNote.trim() || 'Ward Officer completed field inspection and approved resolution.',
      });
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to approve. Please try again.');
    } finally { setBusy(false); }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) return;
    setBusy(true); setError('');
    try {
      await api.post(`/issues/${issue.id}/verify-reject`, { rejectionNote: rejectionNote.trim() });
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to reject. Please try again.');
    } finally { setBusy(false); }
  };

  const canVerify = issue.status === 'NeedsVerification';

  return (
    <>
      <VerificationChecklist checked={checklist} onChange={handleChecklistChange} />

      <Section title="Inspection Notes" icon={FileText} collapsible={false}>
        <textarea
          value={verificationNote}
          onChange={(e) => setVerificationNote(e.target.value)}
          placeholder="Record your on-site observations, measurements, or any notes from the field inspection…"
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-[#E5E5E0] text-xs outline-none resize-none focus:border-[#1A6B3C] focus:ring-1 focus:ring-[#1A6B3C] bg-white"
        />
        {checkedCount > 0 && (
          <p className="text-[10px] text-[#6F6F6F] mt-1.5">
            {checkedCount} / {CHECKLIST_ITEMS.length} checks completed
          </p>
        )}
      </Section>

      {/* Decision buttons */}
      <div className="px-5 py-4 space-y-3 bg-white border-b border-[#E5E5E0]">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800">
            <AlertTriangle size={13} className="shrink-0" /> {error}
          </div>
        )}

        {canVerify && !showReject && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1A6B3C] text-white rounded-xl text-sm font-bold hover:bg-[#0D3320] disabled:opacity-50 transition-colors"
            >
              <ThumbsUp size={15} />
              Approve Completion
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <ThumbsDown size={15} />
              Reject &amp; Return
            </button>
          </div>
        )}

        {canVerify && showReject && (
          <div className="space-y-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
              <ThumbsDown size={14} /> Reject &amp; Return for Rework
            </h4>
            <p className="text-xs text-red-700">
              The department officer will be notified and must redo the work before resubmitting.
            </p>
            <div>
              <label className="text-[10px] uppercase font-bold text-red-700 block mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Describe exactly what was unsatisfactory and what the department must fix before resubmitting…"
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs outline-none resize-none bg-white focus:border-red-400 focus:ring-1 focus:ring-red-300"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowReject(false); setRejectionNote(''); }}
                className="px-4 py-2 text-xs text-gray-600 font-semibold hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionNote.trim() || busy}
                onClick={handleReject}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-50 transition-colors"
              >
                <ThumbsDown size={13} /> Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {!canVerify && (
          <div className="flex items-center gap-2 bg-gray-50 border border-[#E5E5E0] rounded-xl px-3 py-2.5">
            <Shield size={14} className="text-[#6F6F6F] shrink-0" />
            <p className="text-xs text-[#6F6F6F]">
              {issue.status === 'Resolved'
                ? '✅ This issue has been approved and resolved.'
                : issue.status === 'InProgress'
                ? '🔧 Returned for rework. Awaiting resubmission from the department.'
                : `This issue is currently in status: ${issue.status}`}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function WardIssueDetailPanel({ issueId, onClose }: Props) {
  const [issue,   setIssue]   = useState<WardIssue | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const res = await api.get(`/issues/${issueId}`);
      if (res.data.success) setIssue(res.data.data as WardIssue);
    } catch { /* handled by empty state */ }
    finally { setLoading(false); }
  }, [issueId]);

  useEffect(() => {
    if (!issueId) { setIssue(null); return; }
    void fetchIssue();
  }, [fetchIssue, issueId]);

  const handleRefresh = useCallback(() => {
    void fetchIssue();
  }, [fetchIssue]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!issueId) return null;

  const statusColor = issue ? (STATUS_COLORS[issue.status as IssueStatus] ?? '#9CA3AF') : '#9CA3AF';
  const catIcon     = issue ? (CATEGORY_ICONS[issue.category as Category] ?? '📍') : '📍';

  // All timeline events, oldest first for chronological display
  const timelineEvents: TimelineEvent[] = issue?.timeline
    ? [...issue.timeline].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    : [];

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-white shadow-2xl z-[1000] border-l border-[#E5E5E0] flex flex-col">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#E5E5E0] bg-[#0D3320] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck size={17} className="text-[#4ADE80]" />
          <span className="font-display font-bold text-sm text-white">Field Verification</span>
          {issue && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
              style={{
                color: statusColor,
                borderColor: statusColor + '60',
                backgroundColor: statusColor + '20',
              }}
            >
              {issue.status === 'NeedsVerification' ? 'Awaiting Verification'
                : issue.status === 'Resolved' ? 'Resolved'
                : issue.status}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
        >
          <X size={16} />
        </button>
      </div>

      {loading && !issue ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1A6B3C]" />
        </div>
      ) : !issue ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-[#6F6F6F]">
          <p className="text-sm">Failed to load issue details.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* Issue identity bar */}
          <div className="px-5 py-4 border-b border-[#E5E5E0] bg-[#F7F7F5] flex items-start gap-3">
            <span className="text-3xl mt-0.5 shrink-0">{catIcon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold font-display text-[#0D0D0B] leading-snug">
                {issue.title}
              </h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {issue.zone && (
                  <span className="flex items-center gap-1 text-[11px] text-[#6F6F6F]">
                    <MapPin size={10} /> {issue.zone}
                  </span>
                )}
                <span className="text-[11px] text-[#6F6F6F]">
                  Reported {timeAgo(issue.createdAt)}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: statusColor }}>
                  👍 {issue.upvotes} upvotes
                </span>
              </div>
            </div>
          </div>

          {/* Sections */}
          <OriginalReport     issue={issue} />
          <CompletionReport   issue={issue} />
          <IssueTimeline      events={timelineEvents} />
          <DecisionPanel      issue={issue} onRefresh={handleRefresh} />

        </div>
      )}
    </div>
  );
}
