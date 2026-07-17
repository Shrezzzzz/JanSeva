import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ArrowRight, Share2, CheckCircle } from 'lucide-react';
import IssueDetail from '../components/issue/IssueDetail';
import { fetchIssueById } from '../services/issueService';
import { MOCK_ISSUES } from '../utils/mockData';
import type { Issue } from '../types/issue.types';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useUIStore } from '../store/uiStore';

const POLL_INTERVAL_MS = 30_000;

export default function TrackPage() {
  const { id }     = useParams<{ id?: string }>();
  const { addToast } = useUIStore();

  const [query,    setQuery]   = useState(id ?? '');
  const [issue,    setIssue]   = useState<Issue | null>(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [copied,   setCopied]  = useState(false);

  // Track the last known status so we can detect changes during polling
  const lastStatusRef = useRef<string | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch by ID ───────────────────────────────────────────────────────────
  const fetchIssue = useCallback(async (searchId: string, silent = false) => {
    if (!searchId.trim()) return;
    if (!silent) { setLoading(true); setError(''); }

    try {
      const found = await fetchIssueById(searchId.trim());

      // Detect status change during polling
      if (silent && lastStatusRef.current && lastStatusRef.current !== found.status) {
        addToast({
          type:    'success',
          title:   `Status updated: ${found.status}`,
          message: `Issue ${searchId.slice(0, 8)}… is now ${found.status}`,
        });
      }

      lastStatusRef.current = found.status;
      setIssue(found);
    } catch {
      if (!silent) {
        const mock = MOCK_ISSUES.find(
          (i) => i.id === searchId.trim() || i.id.includes(searchId.trim()),
        );
        if (mock) {
          lastStatusRef.current = mock.status;
          setIssue(mock);
        } else {
          setError('Issue not found. Try a different ID.');
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [addToast]);

  // ── Auto-search on mount if URL has an ID ─────────────────────────────────
  useEffect(() => {
    if (id) fetchIssue(id);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 30s polling — only while an issue is loaded ───────────────────────────
  useEffect(() => {
    if (!issue) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    pollRef.current = setInterval(() => fetchIssue(issue.id, true), POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Share button ──────────────────────────────────────────────────────────
  function handleShare() {
    const url = `${window.location.origin}/track/${issue?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Manual search ─────────────────────────────────────────────────────────
  function handleSearch() {
    lastStatusRef.current = null; // reset so next load doesn't fire a change toast
    fetchIssue(query);
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#F7F7F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl text-[#0D0D0B]">Track an Issue</h1>
            <p className="text-[#6F6F6F] mt-2">
              Enter an Issue ID to follow its progress from report to resolution.
            </p>
          </div>
          {issue && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E5E0] text-sm font-medium text-[#0D0D0B] hover:bg-white transition-colors"
            >
              {copied ? <CheckCircle size={15} className="text-[#1A6B3C]" /> : <Share2 size={15} />}
              {copied ? 'Copied!' : 'Share this issue'}
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6F6F]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Issue ID or paste link…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E5E0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C]"
            />
          </div>
          <Button onClick={handleSearch} loading={loading} icon={<ArrowRight size={15} />}>
            Track
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size={28} className="text-[#1A6B3C]" />
          </div>
        )}

        {issue && (
          <div className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm overflow-hidden">
            <IssueDetail
              issue={issue}
              onClose={() => { setIssue(null); lastStatusRef.current = null; }}
              onOptimisticVote={(userId) => {
                setIssue((prev) =>
                  prev ? { ...prev, upvotes: prev.upvotes + 1, verifiedBy: [...prev.verifiedBy, userId] } : prev,
                );
              }}
              onVoteRevert={(userId) => {
                setIssue((prev) =>
                  prev
                    ? {
                        ...prev,
                        upvotes: Math.max(0, prev.upvotes - 1),
                        verifiedBy: prev.verifiedBy.filter((id) => id !== userId),
                      }
                    : prev,
                );
              }}
            />
          </div>
        )}

        {/* Demo links */}
        {!issue && !loading && (
          <div className="mt-8">
            <p className="text-xs font-medium text-[#6F6F6F] uppercase tracking-wide mb-3">
              Try a demo issue
            </p>
            <div className="flex flex-wrap gap-2">
              {MOCK_ISSUES.slice(0, 5).map((i) => (
                <button
                  key={i.id}
                  onClick={() => { setQuery(i.id); fetchIssue(i.id); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#E5E5E0] text-[#6F6F6F] hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-colors"
                >
                  {i.title.slice(0, 28)}…
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
