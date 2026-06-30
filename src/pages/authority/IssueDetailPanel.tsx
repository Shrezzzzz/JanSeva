import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { uploadFiles } from '../../services/uploadService';
import {
  X, Send, Shield, Image as ImageIcon, CheckCircle, UserCheck,
  HardHat, Eye, ClipboardCheck, ThumbsUp, ThumbsDown, RotateCcw,
  PlayCircle, ChevronRight,
} from 'lucide-react';
import { CATEGORY_ICONS, STATUS_COLORS } from '../../types/issue.types';
import type { Category, Issue, IssueStatus } from '../../types/issue.types';
import { timeAgo } from '../../utils/formatters';
import { DEPARTMENTS, getDepartmentForCategory } from '../../config/departments';
import { useAuth } from '../../hooks/useAuth';

// ── Role helpers (mirror backend authorityAssignmentService) ──────────────────

const DEPT_EMAILS = new Set(DEPARTMENTS.map((d) => d.defaultAssignee));

function userIsCityAdmin(role: string, ward?: string | null) {
  return role === 'Admin' || ward === 'City-Wide';
}

function userIsDeptOfficer(role: string, email: string) {
  return role === 'Authority' && DEPT_EMAILS.has(email);
}

function userIsWardOfficer(role: string, email: string, ward?: string | null) {
  return (
    role === 'Authority' &&
    !DEPT_EMAILS.has(email) &&
    Boolean(ward && ward !== 'All' && ward !== 'City-Wide')
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface IssueDetailPanelProps {
  issueId: string | null;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  ward: string | null;
  activeCases: number;
}

type InternalNote = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

type AuthorityIssue = Issue & {
  reporter?: { name?: string | null } | null;
  internalNotes?: InternalNote[];
};

// ── Shared sub-components ─────────────────────────────────────────────────────

function InfoGrid({ issue }: { issue: AuthorityIssue }) {
  return (
    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-[#E5E5E0]">
      <div>
        <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Zone / Ward</span>
        <p className="text-xs font-bold text-[#0D0D0B] mt-0.5">{issue.zone || '—'}</p>
      </div>
      <div>
        <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Upvotes</span>
        <p className="text-xs font-bold text-[#0D0D0B] mt-0.5">👍 {issue.upvotes}</p>
      </div>
      {issue.department && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Department</span>
          <p className="text-xs font-bold text-[#1A6B3C] mt-0.5">{issue.department}</p>
        </div>
      )}
      {issue.assignedTo && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Assigned To</span>
          <p className="text-xs font-bold text-[#0D0D0B] mt-0.5">{issue.assignedTo}</p>
        </div>
      )}
      {issue.estimatedResolutionDays != null && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Est. Resolution</span>
          <p className="text-xs font-bold text-[#0D0D0B] mt-0.5">
            {issue.estimatedResolutionDays}d
            {issue.resolutionConfidence
              ? ` (${Math.round(issue.resolutionConfidence * 100)}%)`
              : ''}
          </p>
        </div>
      )}
    </div>
  );
}

function IssueBody({ issue }: { issue: AuthorityIssue }) {
  return (
    <div className="p-6 space-y-5 flex-1 border-b border-[#E5E5E0]">
      {/* Title block */}
      <div>
        <span className="text-3xl">{CATEGORY_ICONS[issue.category as Category]}</span>
        <h2 className="text-xl font-bold font-display text-[#0D0D0B] mt-2">{issue.title}</h2>
        <p className="text-xs text-[#6F6F6F] mt-1">
          Reported {timeAgo(issue.createdAt)} by{' '}
          {issue.isAnonymous ? 'Anonymous' : issue.reporter?.name || 'Citizen'}
        </p>
      </div>

      <InfoGrid issue={issue} />

      {/* AI summary */}
      {issue.authoritySummary && (
        <div className="rounded-xl bg-[#E8F5EE] border border-[#1A6B3C]/20 p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#1A6B3C]">AI Summary</span>
          <p className="text-xs text-[#0D0D0B] leading-relaxed">{issue.authoritySummary}</p>
          {issue.workflowRecommendation?.nextBestAction && (
            <p className="text-[11px] text-[#1A6B3C] font-semibold mt-1">
              → {issue.workflowRecommendation.nextBestAction}
            </p>
          )}
          {issue.duplicateOf && (
            <p className="text-[11px] text-amber-700 mt-1">
              ⚠ Possible duplicate of <span className="font-mono">{issue.duplicateOf}</span>
            </p>
          )}
          {issue.departmentReason && (
            <p className="text-[11px] text-[#6F6F6F] mt-1">
              Dept recommendation: {issue.departmentReason}
            </p>
          )}
        </div>
      )}

      <div>
        <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Address</span>
        <p className="text-xs text-[#0D0D0B] mt-1">{issue.address || 'Kolkata'}</p>
      </div>

      {issue.description && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Description</span>
          <p className="text-xs text-[#0D0D0B] mt-1 leading-relaxed">{issue.description}</p>
        </div>
      )}

      {(issue.mediaUrls?.length ?? 0) > 0 && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F] block mb-2">Report Photos</span>
          <div className="grid grid-cols-2 gap-2">
            {issue.mediaUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="relative group rounded-xl overflow-hidden border border-[#E5E5E0] block">
                <img src={url} alt="Evidence" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye size={20} className="text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Completion photos (visible once dept officer submits) */}
      {(issue.completionPhotos?.length ?? 0) > 0 && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F] block mb-2">Completion Photos</span>
          <div className="grid grid-cols-2 gap-2">
            {issue.completionPhotos!.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="relative group rounded-xl overflow-hidden border border-[#E5E5E0] block">
                <img src={url} alt="Completion proof" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye size={20} className="text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Completion notes */}
      {issue.completionNotes && (
        <div>
          <span className="text-[10px] uppercase font-semibold text-[#6F6F6F]">Completion Notes</span>
          <p className="text-xs text-[#0D0D0B] mt-1 leading-relaxed bg-[#F7F7F5] border border-[#E5E5E0] rounded-xl p-3">
            {issue.completionNotes}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div>
        <span className="text-[10px] uppercase font-semibold text-[#6F6F6F] block mb-3">Timeline</span>
        <div className="relative border-l-2 border-[#E5E5E0] pl-4 ml-2 space-y-4">
          {(issue.timeline ?? []).map((evt, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[23px] top-0 w-2.5 h-2.5 rounded-full bg-[#1A6B3C] border-2 border-white" />
              <h4 className="text-xs font-bold text-[#0D0D0B]">{evt.event}</h4>
              <p className="text-[10px] text-[#6F6F6F] mt-0.5">
                By <span className="font-semibold">{evt.actor}</span> ({evt.actorRole}) · {timeAgo(evt.createdAt)}
              </p>
              {evt.note && (
                <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-[#E5E5E0] mt-1 font-mono">
                  "{evt.note}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InternalNotesSection({
  issue,
  onRefresh,
}: {
  issue: AuthorityIssue;
  onRefresh: () => void;
}) {
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAdding(true);
    try {
      await api.post(`/issues/${issue.id}/notes`, { content: newNote });
      setNewNote('');
      onRefresh();
    } catch { /* ignored */ }
    finally { setAdding(false); }
  };

  return (
    <div className="p-6 bg-gray-50 border-t border-[#E5E5E0] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-[#0d3320] flex items-center gap-1.5">
          <Shield size={16} className="text-[#1A6B3C]" /> Internal Notes
        </h3>
        <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
          Authority Only
        </span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {!issue.internalNotes?.length ? (
          <p className="text-xs text-[#6F6F6F] italic">No internal notes added yet.</p>
        ) : (
          issue.internalNotes.map((note) => (
            <div key={note.id} className="bg-white p-3 rounded-xl border border-[#E5E5E0] space-y-1">
              <p className="text-xs text-[#0D0D0B]">{note.content}</p>
              <div className="flex items-center justify-between text-[9px] text-[#6F6F6F]">
                <span className="font-semibold">{note.authorName}</span>
                <span>{timeAgo(note.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type internal notes..."
          disabled={adding}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E5E5E0] focus:border-[#1A6B3C] outline-none"
        />
        <button
          type="submit"
          disabled={adding || !newNote.trim()}
          className="p-2.5 rounded-xl bg-[#1A6B3C] hover:bg-[#0D3320] text-white disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

// ── City Admin action panel ───────────────────────────────────────────────────

function CityAdminPanel({
  issue,
  teamMembers,
  onRefresh,
}: {
  issue: AuthorityIssue;
  teamMembers: TeamMember[];
  onRefresh: () => void;
}) {
  const suggestedDept = getDepartmentForCategory(issue.category);
  const [showAssign, setShowAssign] = useState(false);
  const [step, setStep] = useState<'review' | 'assign'>('review');
  const [dept, setDept] = useState(issue.department || suggestedDept.name);
  const [assignee, setAssignee] = useState('');
  const [note, setNote] = useState('');
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupTarget, setDupTarget] = useState('');
  const [busy, setBusy] = useState(false);

  // Sync assignee default when dept changes
  useEffect(() => {
    const d = DEPARTMENTS.find((x) => x.name === dept);
    if (d) {
      const match = teamMembers.find((m) => m.email === d.defaultAssignee);
      setAssignee(match?.email ?? d.defaultAssignee);
    }
  }, [dept, teamMembers]);

  const handleAssign = async () => {
    if (!note.trim() || !assignee) return;
    setBusy(true);
    try {
      await api.patch(`/issues/${issue.id}/assign`, { department: dept, assignedTo: assignee, note });
      setShowAssign(false);
      setNote('');
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const handleVerify = async () => {
    setBusy(true);
    try {
      await api.patch(`/issues/${issue.id}/status`, { status: 'Verified' });
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const handleMarkDuplicate = async () => {
    if (!dupTarget.trim()) return;
    setBusy(true);
    try {
      await api.patch(`/issues/${issue.id}/status`, { status: 'Closed', note: `Duplicate of ${dupTarget}` });
      setShowDuplicate(false);
      setDupTarget('');
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const canAssign = issue.status === 'Verified' || issue.status === 'Reported';
  const canReassign = ['Assigned', 'Accepted', 'InProgress'].includes(issue.status);

  return (
    <>
      {/* Status bar */}
      <div className="p-4 bg-[#E8F5EE] border-b border-[#1A6B3C]/10 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-[#0D3320]">City Admin</span>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{
            borderColor: STATUS_COLORS[issue.status as IssueStatus] + '40',
            color: STATUS_COLORS[issue.status as IssueStatus],
            backgroundColor: STATUS_COLORS[issue.status as IssueStatus] + '10',
          }}>
          {issue.status}
        </span>
      </div>

      {/* Quick actions */}
      {!showAssign && !showDuplicate && (
        <div className="p-4 border-b border-[#E5E5E0] flex flex-wrap gap-2">
          {issue.status === 'Reported' && (
            <button onClick={handleVerify} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 min-h-[44px]">
              <CheckCircle size={15} /> Verify Issue
            </button>
          )}
          {canAssign && (
            <button onClick={() => { setShowAssign(true); setStep('review'); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A6B3C] text-white rounded-xl text-xs font-semibold hover:bg-[#0D3320] min-h-[44px]">
              <UserCheck size={15} /> Assign Department
            </button>
          )}
          {canReassign && (
            <button onClick={() => { setShowAssign(true); setStep('assign'); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 min-h-[44px]">
              <RotateCcw size={15} /> Reassign
            </button>
          )}
          {!['Resolved', 'Closed'].includes(issue.status) && (
            <button onClick={() => setShowDuplicate(true)}
              className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 min-h-[44px]">
              🔁 Duplicate
            </button>
          )}
        </div>
      )}

      {/* Assign / Reassign form */}
      {showAssign && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 space-y-4">
          {/* Step pills */}
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'review' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'}`}>1</div>
            <span className={step === 'review' ? 'text-blue-800' : 'text-blue-400'}>Review AI Suggestion</span>
            <ChevronRight size={12} className="text-blue-400" />
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'assign' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'}`}>2</div>
            <span className={step === 'assign' ? 'text-blue-800' : 'text-blue-400'}>Confirm Assignment</span>
          </div>

          {step === 'review' && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-blue-200 p-3 text-xs space-y-1">
                <p className="font-semibold text-blue-900">AI Recommendation</p>
                <p className="text-blue-700">
                  <span className="font-medium">{suggestedDept.icon} {suggestedDept.name}</span>
                  <span className="text-[#6F6F6F]"> — based on category: {issue.category}</span>
                </p>
                {issue.departmentReason && (
                  <p className="text-[#6F6F6F] text-[11px]">{issue.departmentReason}</p>
                )}
                {issue.workflowRecommendation?.nextBestAction && (
                  <p className="text-[#1A6B3C] font-semibold text-[11px]">
                    → {issue.workflowRecommendation.nextBestAction}
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAssign(false)} className="px-3 py-1.5 text-xs text-gray-500 font-semibold">Cancel</button>
                <button onClick={() => setStep('assign')}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">
                  Continue <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}

          {step === 'assign' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-blue-700 block mb-1">Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-blue-200 text-xs outline-none bg-white">
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.name}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-blue-700 block mb-1">Assign To</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-blue-200 text-xs outline-none bg-white">
                  {teamMembers
                    .filter((m) => DEPT_EMAILS.has(m.email))
                    .map((m) => (
                      <option key={m.id} value={m.email}>
                        {m.name} — {m.email} ({m.activeCases} active)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-blue-700 block mb-1">
                  Assignment Note <span className="text-red-500">*</span>
                </label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Instructions for the assigned department..."
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-xl border border-blue-200 text-xs outline-none resize-none bg-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAssign(false)} className="px-3 py-1.5 text-xs text-gray-500 font-semibold">Cancel</button>
                <button disabled={!note.trim() || !assignee || busy} onClick={handleAssign}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 disabled:opacity-50">
                  <UserCheck size={13} /> Confirm Assignment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Duplicate form */}
      {showDuplicate && (
        <div className="p-4 bg-red-50 border-b border-red-100 space-y-3">
          <h4 className="font-bold text-xs text-red-900">Mark as Duplicate</h4>
          <div>
            <label className="text-[10px] uppercase font-bold text-red-700 block mb-1">Original Issue ID</label>
            <input type="text" value={dupTarget} onChange={(e) => setDupTarget(e.target.value)}
              placeholder="cuid of original issue"
              className="w-full px-3 py-1.5 rounded-xl border border-red-200 text-xs outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowDuplicate(false)} className="px-3 py-1.5 text-xs text-gray-500 font-semibold">Cancel</button>
            <button disabled={!dupTarget.trim() || busy} onClick={handleMarkDuplicate}
              className="px-4 py-1.5 bg-red-700 text-white rounded-xl text-xs font-semibold hover:bg-red-800 disabled:opacity-50">
              Mark Duplicate
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Department Officer action panel ──────────────────────────────────────────

function DeptOfficerPanel({
  issue,
  onRefresh,
}: {
  issue: AuthorityIssue;
  onRefresh: () => void;
}) {
  const [showComplete, setShowComplete] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [showProgressNote, setShowProgressNote] = useState(false);

  const handleAccept = async () => {
    setBusy(true);
    try {
      await api.post(`/issues/${issue.id}/accept`);
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const handleStartWork = async () => {
    setBusy(true);
    try {
      await api.post(`/issues/${issue.id}/start-work`, { note: 'Work started by department officer' });
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const handleAddProgressNote = async () => {
    if (!progressNote.trim()) return;
    setBusy(true);
    try {
      await api.post(`/issues/${issue.id}/notes`, { content: progressNote });
      setProgressNote('');
      setShowProgressNote(false);
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setProofFiles(files);
    setUploading(true);
    try {
      const results = await uploadFiles(files);
      setProofUrls(results.map((r) => r.url));
    } catch { /* ignored */ }
    finally { setUploading(false); }
  };

  const handleComplete = async () => {
    if (!completionNotes.trim()) return;
    setBusy(true);
    try {
      await api.post(`/issues/${issue.id}/complete`, {
        completionNotes,
        completionPhotos: proofUrls,
      });
      setShowComplete(false);
      setCompletionNotes('');
      setProofFiles([]);
      setProofUrls([]);
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const statusColor = STATUS_COLORS[issue.status as IssueStatus];

  return (
    <>
      {/* Status bar */}
      <div className="p-4 bg-[#E8F5EE] border-b border-[#1A6B3C]/10 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-[#0D3320]">Department Officer</span>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{
            borderColor: statusColor + '40',
            color: statusColor,
            backgroundColor: statusColor + '10',
          }}>
          {issue.status}
        </span>
      </div>

      {/* Actions for Assigned — accept */}
      {issue.status === 'Assigned' && !showComplete && (
        <div className="p-4 border-b border-[#E5E5E0] flex gap-2">
          <button onClick={handleAccept} disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7C3AED] text-white rounded-xl text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 min-h-[44px]">
            <CheckCircle size={15} /> Accept Assignment
          </button>
        </div>
      )}

      {/* Actions for Accepted — start work */}
      {issue.status === 'Accepted' && !showComplete && (
        <div className="p-4 border-b border-[#E5E5E0] flex gap-2">
          <button onClick={handleStartWork} disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 min-h-[44px]">
            <HardHat size={15} /> Start Work
          </button>
        </div>
      )}

      {/* Actions for InProgress — add progress note + submit completion */}
      {issue.status === 'InProgress' && !showComplete && (
        <div className="p-4 border-b border-[#E5E5E0] space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowProgressNote((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-[#1A6B3C]/30 text-[#1A6B3C] rounded-xl text-xs font-semibold hover:bg-[#E8F5EE] min-h-[44px]">
              <Send size={15} /> Add Progress Note
            </button>
            <button onClick={() => setShowComplete(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0891B2] text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 min-h-[44px]">
              <ClipboardCheck size={15} /> Submit Completion
            </button>
          </div>
          {showProgressNote && (
            <div className="space-y-2">
              <textarea value={progressNote} onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Progress update for this case..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E0] text-xs outline-none resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowProgressNote(false)} className="text-xs text-gray-500 font-semibold px-2">Cancel</button>
                <button disabled={!progressNote.trim() || busy} onClick={handleAddProgressNote}
                  className="px-3 py-1.5 bg-[#1A6B3C] text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion form */}
      {showComplete && (
        <div className="p-4 bg-cyan-50 border-b border-cyan-100 space-y-3">
          <h4 className="font-bold text-xs text-cyan-900 flex items-center gap-1.5">
            <ClipboardCheck size={14} /> Submit Work Completion
          </h4>
          <div>
            <label className="text-[10px] uppercase font-bold text-cyan-700 block mb-1">
              Completion Notes <span className="text-red-500">*</span>
            </label>
            <textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Describe what was done, materials used, outcome..."
              rows={3}
              className="w-full px-3 py-1.5 rounded-xl border border-cyan-200 text-xs outline-none resize-none bg-white" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-cyan-700 block mb-1">Completion Photos</label>
            <label className="flex items-center justify-center gap-2 border border-dashed border-cyan-300 rounded-xl p-3 bg-white cursor-pointer hover:bg-cyan-50">
              <ImageIcon size={16} className="text-cyan-600" />
              <span className="text-xs text-gray-600">
                {proofFiles.length > 0
                  ? `${proofFiles.length} photo${proofFiles.length > 1 ? 's' : ''} selected`
                  : 'Choose Photos (optional)'}
              </span>
              <input type="file" accept="image/*" multiple onChange={handleUploadProof} className="hidden" />
            </label>
            {uploading && <span className="text-[10px] text-gray-500 mt-1 block">Uploading…</span>}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowComplete(false)} className="px-3 py-1.5 text-xs text-gray-500 font-semibold">Cancel</button>
            <button
              disabled={!completionNotes.trim() || uploading || busy}
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0891B2] text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50">
              <PlayCircle size={13} /> Submit for Verification
            </button>
          </div>
        </div>
      )}

      {/* NeedsVerification — read-only waiting state */}
      {issue.status === 'NeedsVerification' && (
        <div className="p-4 border-b border-[#E5E5E0]">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <ClipboardCheck size={15} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Work submitted. Awaiting Ward Officer verification.
            </p>
          </div>
        </div>
      )}

      {/* Rejected — returned for rework by Ward Officer */}
      {issue.status === 'InProgress' && (() => {
        // Only show if the timeline contains an actual rejection event from the Ward Officer.
        // A fresh assignment or an issue that's just been started will never have this event.
        const rejectionEvent = (issue.timeline ?? [])
          .slice()
          .reverse()
          .find((evt) => evt.event.includes('Rejected') && evt.event.includes('Rework'));
        return rejectionEvent ? (
          <div className="p-4 border-b border-[#E5E5E0]">
            <div className="space-y-2 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
              <div className="flex items-center gap-2">
                <ThumbsDown size={15} className="text-red-600 shrink-0" />
                <p className="text-xs font-semibold text-red-800">
                  Ward Officer rejected the previous completion.
                </p>
              </div>
              {rejectionEvent.note && (
                <div className="bg-white border border-red-100 rounded-lg px-2.5 py-2">
                  <span className="text-[10px] uppercase font-bold text-red-600 block mb-0.5">Rejection Reason</span>
                  <p className="text-xs text-red-800 leading-relaxed">{rejectionEvent.note}</p>
                </div>
              )}
              <p className="text-[11px] text-red-700">
                Review the feedback, continue the work if necessary, and submit completion again.
              </p>
            </div>
          </div>
        ) : null;
      })()}
    </>
  );
}

// ── Ward Officer action panel ─────────────────────────────────────────────────

function WardOfficerPanel({
  issue,
  onRefresh,
}: {
  issue: AuthorityIssue;
  onRefresh: () => void;
}) {
  const [verificationNote, setVerificationNote] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusColor = STATUS_COLORS[issue.status as IssueStatus];
  const canVerify = issue.status === 'NeedsVerification';

  const handleApprove = async () => {
    setBusy(true);
    try {
      await api.post(`/issues/${issue.id}/verify-approve`, {
        verificationNote: verificationNote.trim() || 'Ward officer verified and approved the resolution',
      });
      setVerificationNote('');
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) return;
    setBusy(true);
    try {
      await api.post(`/issues/${issue.id}/verify-reject`, { rejectionNote });
      setRejectionNote('');
      setShowReject(false);
      onRefresh();
    } catch { /* ignored */ }
    finally { setBusy(false); }
  };

  return (
    <>
      {/* Status bar */}
      <div className="p-4 bg-[#E8F5EE] border-b border-[#1A6B3C]/10 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-[#0D3320]">Ward Officer</span>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{
            borderColor: statusColor + '40',
            color: statusColor,
            backgroundColor: statusColor + '10',
          }}>
          {issue.status}
        </span>
      </div>

      {canVerify ? (
        <div className="p-4 bg-orange-50 border-b border-orange-100 space-y-4">
          <h4 className="font-bold text-xs text-orange-900 flex items-center gap-1.5">
            <ClipboardCheck size={14} /> Verify Completed Work
          </h4>

          {/* Read-only assignment context */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded-xl border border-orange-100 p-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Department</span>
              <span className="font-semibold text-[#0D0D0B]">{issue.department || '—'}</span>
            </div>
            <div className="bg-white rounded-xl border border-orange-100 p-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-0.5">Officer</span>
              <span className="font-semibold text-[#0D0D0B]">{issue.assignedTo || '—'}</span>
            </div>
          </div>

          {/* Completion notes from dept officer */}
          {issue.completionNotes && (
            <div className="bg-white rounded-xl border border-orange-100 p-3">
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-1">Completion Notes</span>
              <p className="text-xs text-[#0D0D0B] leading-relaxed">{issue.completionNotes}</p>
            </div>
          )}

          {/* Completion photos */}
          {(issue.completionPhotos?.length ?? 0) > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6F6F6F] block mb-2">Completion Photos</span>
              <div className="grid grid-cols-2 gap-2">
                {issue.completionPhotos!.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="relative group rounded-xl overflow-hidden border border-orange-200 block">
                    <img src={url} alt={`Completion ${i + 1}`} className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye size={18} className="text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Verification note */}
          <div>
            <label className="text-[10px] uppercase font-bold text-orange-700 block mb-1">Your Verification Note (optional)</label>
            <textarea value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)}
              placeholder="Add a note about your site visit or observations..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-xl border border-orange-200 text-xs outline-none resize-none bg-white" />
          </div>

          {/* Approve / Reject buttons */}
          {!showReject ? (
            <div className="flex gap-2">
              <button onClick={handleApprove} disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1A6B3C] text-white rounded-xl text-xs font-semibold hover:bg-[#0D3320] disabled:opacity-50 min-h-[44px]">
                <ThumbsUp size={15} /> Approve Resolution
              </button>
              <button onClick={() => setShowReject(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 min-h-[44px]">
                <ThumbsDown size={15} /> Reject & Reopen
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-red-700 block mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Describe what was unsatisfactory and what needs to be redone..."
                  rows={3}
                  className="w-full px-3 py-1.5 rounded-xl border border-red-200 text-xs outline-none resize-none bg-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowReject(false)} className="px-3 py-1.5 text-xs text-gray-500 font-semibold">Back</button>
                <button disabled={!rejectionNote.trim() || busy} onClick={handleReject}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-700 text-white rounded-xl text-xs font-semibold hover:bg-red-800 disabled:opacity-50">
                  <ThumbsDown size={13} /> Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-b border-[#E5E5E0]">
          <div className="flex items-center gap-2 bg-gray-50 border border-[#E5E5E0] rounded-xl px-3 py-2.5">
            <Shield size={15} className="text-[#6F6F6F] shrink-0" />
            <p className="text-xs text-[#6F6F6F]">
              This issue is not yet ready for verification. It will appear here when the department officer submits completion.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function IssueDetailPanel({ issueId, onClose }: IssueDetailPanelProps) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<AuthorityIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchIssueDetails = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const res = await api.get(`/issues/${issueId}`);
      if (res.data.success) setIssue(res.data.data);
    } catch { /* handled by error state */ }
    finally { setLoading(false); }
  }, [issueId]);

  useEffect(() => {
    async function load() {
      if (!issueId) { setIssue(null); return; }
      await fetchIssueDetails();
      try {
        const r = await api.get('/users/authority-team');
        if (r.data.success) setTeamMembers(r.data.data);
      } catch { /* non-critical */ }
    }
    void load();
  }, [fetchIssueDetails, issueId]);

  if (!issueId) return null;

  // Determine role
  const role      = user?.role ?? '';
  const email     = user?.email ?? '';
  const ward      = user?.ward ?? null;
  const isCityAdmin   = userIsCityAdmin(role, ward);
  const isDeptOfficer = !isCityAdmin && userIsDeptOfficer(role, email);
  const isWardOfficer = !isCityAdmin && !isDeptOfficer && userIsWardOfficer(role, email, ward);

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 md:inset-y-0 md:left-auto md:right-0 w-full md:w-[480px] bg-white shadow-2xl z-[1000] md:border-l border-[#E5E5E0] rounded-t-3xl md:rounded-none flex flex-col overflow-hidden transition-transform">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between bg-[#F7F7F5] shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="text-[#1A6B3C]" size={18} />
          <span className="font-display font-bold text-sm text-[#0D0D0B]">Issue Details</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
          <X size={18} />
        </button>
      </div>

      {loading && !issue ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1A6B3C]" />
        </div>
      ) : !issue ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-[#6F6F6F]">
          Failed to load issue.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* Role-specific action panel at top */}
          {isCityAdmin && (
            <CityAdminPanel
              issue={issue}
              teamMembers={teamMembers}
              onRefresh={fetchIssueDetails}
            />
          )}
          {isDeptOfficer && (
            <DeptOfficerPanel
              issue={issue}
              onRefresh={fetchIssueDetails}
            />
          )}
          {isWardOfficer && (
            <WardOfficerPanel
              issue={issue}
              onRefresh={fetchIssueDetails}
            />
          )}

          {/* Issue body — shared across all roles */}
          <IssueBody issue={issue} />

          {/* Internal notes — shared across all roles */}
          <InternalNotesSection issue={issue} onRefresh={fetchIssueDetails} />

        </div>
      )}
    </div>
  );
}
