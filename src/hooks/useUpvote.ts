import { useCallback, useState } from 'react';
import { upvoteIssue } from '../services/issueService';
import { useIssueStore } from '../store/issueStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

export function useUpvote(issueId: string, verifiedBy: string[]) {
  const { optimisticUpvote } = useIssueStore();
  const { user } = useAuthStore();
  const { addToast, openLogin } = useUIStore();
  const [pending, setPending] = useState(false);

  const hasVoted = user ? verifiedBy.includes(user.id) : false;

  const vote = useCallback(async () => {
    if (!user) { openLogin(); return; }
    if (hasVoted || pending) return;
    setPending(true);
    optimisticUpvote(issueId, user.id);
    try {
      await upvoteIssue(issueId);
    } catch {
      // revert optimistic update
      addToast({ type: 'error', title: 'Failed to record verification.' });
    } finally {
      setPending(false);
    }
  }, [user, hasVoted, pending, issueId, optimisticUpvote, addToast, openLogin]);

  return { vote, hasVoted, pending };
}
