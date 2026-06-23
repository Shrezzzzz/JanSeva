import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Trash2, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { fetchIssueById, updateIssue, deleteIssue } from '../services/issueService';
import { useUIStore } from '../store/uiStore';
import type { Issue, Severity } from '../types/issue.types';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { ROUTES } from '../config/routes';

const LOCKED_STATUSES: Issue['status'][] = ['Verified', 'Assigned', 'InProgress', 'Resolved', 'Closed'];
const SEVERITY_OPTIONS: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export default function EditReportPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const { addToast } = useUIStore();

  const [issue,       setIssue]       = useState<Issue | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [fetchError,  setFetchError]  = useState('');

  // Editable fields
  const [description, setDescription] = useState('');
  const [severity,    setSeverity]    = useState<Severity>('Medium');

  // ── Load issue on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchIssueById(id)
      .then((found) => {
        // Auth check — must be the reporter
        if (!user) { navigate('/login', { replace: true }); return; }
        if (found.reporterId && found.reporterId !== user.id) {
          navigate(ROUTES.PROFILE, { replace: true }); return;
        }
        setIssue(found);
        setDescription(found.description ?? '');
        setSeverity(found.severity);
      })
      .catch(() => setFetchError('Issue not found or you do not have permission to edit it.'))
      .finally(() => setLoading(false));
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!issue) return;
    setSaving(true);
    try {
      const updated = await updateIssue(issue.id, { description, severity });
      setIssue(updated);
      addToast({ type: 'success', title: 'Report updated', message: 'Your changes have been saved.' });
      navigate(`${ROUTES.TRACK}/${issue.id}`);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e as Error).message ??
        'Failed to save';
      addToast({ type: 'error', title: 'Save failed', message: msg });
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!issue) return;
    setDeleting(true);
    try {
      await deleteIssue(issue.id);
      addToast({ type: 'info', title: 'Report deleted', message: 'Your issue report has been removed.' });
      navigate(ROUTES.PROFILE, { replace: true });
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e as Error).message ??
        'Failed to delete';
      addToast({ type: 'error', title: 'Delete failed', message: msg });
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} className="text-[#1A6B3C]" />
      </div>
    );
  }

  if (fetchError || !issue) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <p className="text-[#6F6F6F]">{fetchError || 'Issue not found.'}</p>
        <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft size={15} />}>
          Go back
        </Button>
      </div>
    );
  }

  const isLocked = LOCKED_STATUSES.includes(issue.status);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#F7F7F5]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(`${ROUTES.TRACK}/${issue.id}`)}
          className="flex items-center gap-2 text-sm text-[#6F6F6F] hover:text-[#0D0D0B] mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Back to issue
        </button>

        <h1 className="font-display text-4xl text-[#0D0D0B] mb-2">Edit Report</h1>
        <p className="text-sm text-[#6F6F6F] mb-8 font-mono">{issue.id.slice(0, 16)}…</p>

        {/* Locked banner */}
        {isLocked && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-200">
            <Lock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                This report has been picked up and can no longer be edited
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Status: <strong>{issue.status}</strong> — changes are disabled once authorities start processing.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm p-6 sm:p-8 space-y-6">
          {/* Title (read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Title</label>
            <div className="px-4 py-3 rounded-xl bg-[#F7F7F5] text-sm text-[#6F6F6F]">
              {issue.title}
            </div>
          </div>

          {/* Category (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Category</label>
              <div className="px-4 py-3 rounded-xl bg-[#F7F7F5] text-sm text-[#6F6F6F]">
                {issue.category}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Status</label>
              <div className="px-4 py-3 rounded-xl bg-[#F7F7F5] text-sm text-[#6F6F6F]">
                {issue.status}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Description</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLocked}
              placeholder="Describe the issue in detail…"
              className="w-full rounded-xl border border-[#E5E5E0] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent disabled:bg-[#F7F7F5] disabled:text-[#6F6F6F] disabled:cursor-not-allowed"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-[#0D0D0B] mb-2">Severity</label>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setSeverity(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    severity === s
                      ? 'border-[#1A6B3C] bg-[#E8F5EE] text-[#1A6B3C]'
                      : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Media gallery (view-only) */}
          {issue.mediaUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#0D0D0B] mb-2">Photos</label>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {issue.mediaUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="h-28 w-36 flex-shrink-0 rounded-xl object-cover border border-[#E5E5E0]"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isLocked && (
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E0]">
              {/* Delete */}
              <div>
                {!confirmDel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-2 text-sm text-[#DC2626] hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={15} /> Delete report
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-[#DC2626]" />
                    <span className="text-sm text-[#DC2626]">Are you sure?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-sm font-semibold text-[#DC2626] hover:underline disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDel(false)}
                      className="text-sm text-[#6F6F6F] hover:text-[#0D0D0B]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Save */}
              <Button onClick={handleSave} loading={saving} icon={<Save size={15} />}>
                Save changes
              </Button>
            </div>
          )}

          {isLocked && (
            <div className="pt-2 border-t border-[#E5E5E0] text-right">
              <Button
                variant="outline"
                onClick={() => navigate(`${ROUTES.TRACK}/${issue.id}`)}
                icon={<ArrowLeft size={15} />}
              >
                Back to tracking
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
