import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Share2, Bell, BellOff, ExternalLink } from 'lucide-react';
import type { Issue, Comment } from '../../types/issue.types';
import { CategoryBadge, StatusBadge, SeverityBadge } from '../ui/Badge';
import Avatar, { AvatarStack } from '../ui/Avatar';
import StatusPipeline from './StatusPipeline';
import VerifyButton from './VerifyButton';
import IssueTimeline from './IssueTimeline';
import CommentThread from './CommentThread';
import { timeAgo, issueIdDisplay } from '../../utils/formatters';
import { ROUTES } from '../../config/routes';
import { followIssue } from '../../services/issueService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface IssueDetailProps {
  issue: Issue;
  onClose: () => void;
  onCommentAdded?: (c: Comment) => void;
  onOptimisticVote?: (userId: string) => void;
  onVoteRevert?: (userId: string) => void;
}

export default function IssueDetail({ issue, onClose, onCommentAdded, onOptimisticVote, onVoteRevert }: IssueDetailProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, openLogin } = useUIStore();
  const [comments, setComments] = useState<Comment[]>(issue.comments ?? []);
  const [tab, setTab]           = useState<'timeline' | 'comments'>('timeline');

  // Follow state — initialise from the issue's followedBy list if available
  const [following, setFollowing] = useState<boolean>(
    !!user && (issue.followedBy ?? []).includes(user.id),
  );
  const [followPending, setFollowPending] = useState(false);

  const handleFollow = async () => {
    if (!user) { openLogin(); return; }
    if (followPending) return;
    // Optimistic toggle
    setFollowing((prev) => !prev);
    setFollowPending(true);
    try {
      const result = await followIssue(issue.id);
      setFollowing(result.following);
      addToast({
        type: 'success',
        title: result.following ? 'Following issue' : 'Unfollowed issue',
      });
    } catch (err) {
      // Revert on failure
      setFollowing((prev) => !prev);
      const message =
        err instanceof Error && err.message ? err.message : 'Failed to update follow status.';
      addToast({ type: 'error', title: message });
    } finally {
      setFollowPending(false);
    }
  };

  const addComment = (c: Comment) => {
    setComments((prev) => [...prev, c]);
    onCommentAdded?.(c);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-[#E5E5E0]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <CategoryBadge category={issue.category} />
            <StatusBadge   status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
          <h2 className="font-display text-xl text-[#0D0D0B] leading-snug">{issue.title}</h2>
          <p className="text-xs text-[#6F6F6F] mt-1 font-mono">{issueIdDisplay(issue.id)}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F7F7F5] flex-shrink-0" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Status pipeline */}
        <StatusPipeline status={issue.status} />

        {/* Reporter */}
        <div className="flex items-center gap-2 text-sm text-[#6F6F6F]">
          {!issue.isAnonymous ? (
            <>
              <Avatar src={issue.reporterAvatar} name={issue.reporterName} size="sm" />
              <span>{issue.reporterName ?? 'Citizen'}</span>
            </>
          ) : (
            <span>Anonymous citizen</span>
          )}
          <span>·</span>
          <span>{timeAgo(issue.createdAt)}</span>
        </div>

        {/* Location */}
        {issue.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-[#1A6B3C] flex-shrink-0" />
            <span className="text-[#6F6F6F] flex-1">{issue.address}</span>
            <button
              onClick={() => navigate(`${ROUTES.MAP}?lat=${issue.latitude}&lng=${issue.longitude}`)}
              className="text-xs text-[#1A6B3C] hover:underline flex items-center gap-1"
            >
              View on Map <ExternalLink size={11} />
            </button>
          </div>
        )}

        {/* Description */}
        {issue.description && (
          <p className="text-sm text-[#6F6F6F] leading-relaxed">{issue.description}</p>
        )}

        {/* Media gallery */}
        {issue.mediaUrls.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {issue.mediaUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Evidence ${i + 1}`}
                className="h-36 w-48 flex-shrink-0 rounded-2xl object-cover"
              />
            ))}
          </div>
        )}

        {/* Verify */}
        <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E0]">
          <p className="text-sm font-medium text-[#0D0D0B] mb-2">
            {issue.verifiedBy.length} citizen{issue.verifiedBy.length !== 1 ? 's' : ''} confirmed this issue
          </p>
          <AvatarStack users={issue.verifiedBy.map((id) => ({ name: id.slice(0, 4) }))} max={5} />
          <div className="mt-3">
            <VerifyButton
              issueId={issue.id}
              verifiedBy={issue.verifiedBy}
              upvotes={issue.upvotes}
              showProgress
              onOptimisticVote={onOptimisticVote}
              onVoteRevert={onVoteRevert}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E5E0]">
          {(['timeline', 'comments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-[#1A6B3C] text-[#0D0D0B]' : 'border-transparent text-[#6F6F6F] hover:text-[#0D0D0B]'
              }`}
            >
              {t}
              {t === 'comments' && ` (${comments.length})`}
            </button>
          ))}
        </div>

        {tab === 'timeline'  && <IssueTimeline events={issue.timeline ?? []} />}
        {tab === 'comments'  && <CommentThread issueId={issue.id} comments={comments} onNewComment={addComment} />}
      </div>

      {/* Footer actions */}
      <div className="border-t border-[#E5E5E0] p-4 flex gap-3">
        <button
          onClick={handleFollow}
          disabled={followPending}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-colors ${
            following
              ? 'border-[#1A6B3C] text-[#1A6B3C] bg-[#F0FAF4] hover:bg-[#E6F5EC]'
              : 'border-[#E5E5E0] text-[#6F6F6F] hover:bg-[#F7F7F5]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={following ? 'Unfollow issue' : 'Follow issue'}
        >
          {following ? <BellOff size={14} /> : <Bell size={14} />}
          {following ? 'Following' : 'Follow'}
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${issue.id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5E5E0] text-sm text-[#6F6F6F] hover:bg-[#F7F7F5] transition-colors"
        >
          <Share2 size={14} /> Share
        </button>
      </div>
    </div>
  );
}
