import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { Flag, RotateCcw, MinusCircle, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORY_ICONS } from '../../types/issue.types';
import type { Category } from '../../types/issue.types';
import { timeAgo, formatDateTime } from '../../utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

type Reporter = {
  id: string;
  name: string;
  email: string;
  citizenId: string;
  xp: number;
  suspendedUntil: string | null;
};

type FlaggedIssue = {
  id: string;
  title: string;
  category: string;
  severity: string;
  zone: string | null;
  address: string | null;
  wardFlagNote: string | null;
  isAnonymous: boolean;
  reporterId: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: Reporter | null;
};

// ── Action panel ──────────────────────────────────────────────────────────────

function ActionPanel({
  issue,
  onDone,
}: {
  issue: FlaggedIssue;
  onDone: () => void;
}) {
  const [open,        setOpen]        = useState(false);
  const [xpAmount,    setXpAmount]    = useState('');
  const [suspendDate, setSuspendDate] = useState('');
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const handle = async (action: 'deduct-xp' | 'suspend' | 'restore') => {
    setBusy(true); setError(''); setSuccess('');
    try {
      if (action === 'restore') {
        await api.post(`/issues/${issue.id}/restore-flagged`);
        setSuccess('Issue restored to AwaitingAssignment.');
        setTimeout(onDone, 1000);
        return;
      }
      if (action === 'deduct-xp') {
        const amount = parseInt(xpAmount);
        if (!amount || amount <= 0) { setError('Enter a valid XP amount.'); setBusy(false); return; }
        if (!window.confirm(`Deduct ${amount} XP from ${issue.reporter!.name}? This cannot be undone.`)) { setBusy(false); return; }
        await api.post(`/auth/admin/citizens/${issue.reporter!.id}/deduct-xp`, { amount });
        setSuccess(`Deducted ${amount} XP from ${issue.reporter!.name}.`);
        setXpAmount('');
        return;
      }
      if (action === 'suspend') {
        if (!suspendDate) { setError('Pick a suspension end date.'); setBusy(false); return; }
        if (!window.confirm(`Suspend ${issue.reporter!.name} until ${suspendDate}? They will be unable to submit new reports until this date.`)) { setBusy(false); return; }
        await api.post(`/auth/admin/citizens/${issue.reporter!.id}/suspend`, { until: suspendDate });
        setSuccess(`${issue.reporter!.name} suspended until ${suspendDate}.`);
        setSuspendDate('');
        return;
      }
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Action failed.');
    } finally { setBusy(false); }
  };

  // Anonymous — only Restore is available
  if (issue.isAnonymous || !issue.reporter) {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-[#9CA3AF] italic">Anonymous — no account action possible.</p>
        <button
          onClick={() => handle('restore')}
          disabled={busy}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5E0] text-sm text-[#0D0D0B] hover:bg-[#F7F7F5] transition-colors disabled:opacity-50"
        >
          <RotateCcw size={13} className="text-[#1A6B3C]" />
          {busy ? 'Restoring…' : 'Restore Issue'}
        </button>
        {(error || success) && (
          <p className={`text-xs ${error ? 'text-red-600' : 'text-green-700'}`}>{error || success}</p>
        )}
      </div>
    );
  }

  const isSuspended = issue.reporter.suspendedUntil
    && new Date(issue.reporter.suspendedUntil) > new Date();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="mt-3 space-y-3">
      {/* Reporter info */}
      <div className="text-xs text-[#6F6F6F] space-y-0.5">
        <p><span className="font-semibold text-[#0D0D0B]">{issue.reporter.name}</span> · {issue.reporter.citizenId}</p>
        <p>{issue.reporter.email}</p>
        <p>XP: <span className="font-medium text-[#0D0D0B]">{issue.reporter.xp.toLocaleString()}</span>
          {isSuspended && (
            <span className="ml-2 text-red-600 font-semibold">
              Suspended until {new Date(issue.reporter.suspendedUntil!).toLocaleDateString()}
            </span>
          )}
        </p>
      </div>

      {/* Actions toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold text-[#6F6F6F] hover:text-[#0D0D0B]"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? 'Hide actions' : 'Show actions'}
      </button>

      {open && (
        <div className="space-y-3 border border-[#E5E5E0] rounded-2xl p-3 bg-[#F7F7F5]">

          {/* Deduct XP */}
          <div className="flex items-center gap-2">
            <MinusCircle size={14} className="text-amber-600 shrink-0" />
            <input
              type="number"
              min={1}
              placeholder="XP to deduct"
              value={xpAmount}
              onChange={(e) => setXpAmount(e.target.value)}
              className="w-28 px-2.5 py-1.5 rounded-lg border border-[#E5E5E0] text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              onClick={() => handle('deduct-xp')}
              disabled={busy || !xpAmount}
              className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50"
            >
              Deduct XP
            </button>
          </div>

          {/* Suspend */}
          <div className="flex items-center gap-2">
            <Ban size={14} className="text-red-600 shrink-0" />
            <input
              type="date"
              min={minDate}
              value={suspendDate}
              onChange={(e) => setSuspendDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E0] text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <button
              onClick={() => handle('suspend')}
              disabled={busy || !suspendDate}
              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              Suspend
            </button>
          </div>

          {/* Restore */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#E5E5E0]">
            <RotateCcw size={14} className="text-[#1A6B3C] shrink-0" />
            <button
              onClick={() => handle('restore')}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-[#E8F5EE] text-[#1A6B3C] text-xs font-semibold hover:bg-[#d1ede0] transition-colors disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Restore Issue (no penalty)'}
            </button>
          </div>
        </div>
      )}

      {(error || success) && (
        <p className={`text-xs ${error ? 'text-red-600' : 'text-green-700'}`}>{error || success}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FlaggedReportsPage() {
  const [issues,  setIssues]  = useState<FlaggedIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/flagged-issues');
      if (res.data.success) setIssues(res.data.data as FlaggedIssue[]);
    } catch (err) {
      console.error('Failed to load flagged issues', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchIssues(); }, [fetchIssues]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0D0D0B] flex items-center gap-2">
          <Flag size={22} className="text-red-600" />
          Flagged Reports
        </h1>
        <p className="text-sm text-[#6F6F6F] mt-0.5">
          Reports flagged as false by ward officers. Review and take action or restore.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E5E0] py-20 text-center space-y-3">
          <Flag size={36} className="text-[#E5E5E0] mx-auto" />
          <h3 className="font-display font-bold text-[#0D0D0B]">No flagged reports</h3>
          <p className="text-sm text-[#6F6F6F]">
            Ward officers haven't flagged any reports as false yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id}
              className="bg-white rounded-2xl border border-[#E5E5E0] shadow-sm p-5 space-y-3">
              {/* Issue header */}
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">
                  {CATEGORY_ICONS[issue.category as Category] ?? '📍'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0D0D0B] leading-snug">{issue.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 uppercase tracking-wide">
                    {issue.category} · {issue.severity} · {issue.zone ?? issue.address ?? '—'}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    Reported {timeAgo(issue.createdAt)} · Flagged {timeAgo(issue.updatedAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                  Flagged False
                </span>
              </div>

              {/* Ward officer's flag note */}
              {issue.wardFlagNote && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                    Ward Officer Note
                  </p>
                  <p className="text-sm text-red-900 leading-relaxed">{issue.wardFlagNote}</p>
                  <p className="text-[10px] text-red-400 mt-1">{formatDateTime(issue.updatedAt)}</p>
                </div>
              )}

              {/* Actions */}
              <ActionPanel issue={issue} onDone={fetchIssues} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#E5E5E0] p-5 space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E5E5E0] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded-full bg-[#E5E5E0] animate-pulse" />
              <div className="h-2.5 w-1/2 rounded-full bg-[#E5E5E0] animate-pulse" />
            </div>
          </div>
          <div className="h-16 rounded-xl bg-[#E5E5E0] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
