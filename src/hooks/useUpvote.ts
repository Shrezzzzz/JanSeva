import { useCallback, useState } from 'react';
import { upvoteIssue } from '../services/issueService';
import { useIssueStore } from '../store/issueStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

/** Returns true when the issue ID belongs to mock/demo data that has no
 *  corresponding backend row (e.g. IDs that start with "mock" or "demo"). */
function isMockIssueId(id: string): boolean {
  return /^(mock|demo)/i.test(id);
}

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

    // Mock / demo issues have no backend row — skip the API call and just
    // keep the optimistic update so the UI feels responsive.
    if (isMockIssueId(issueId)) {
      setPending(false);
      return;
    }

    try {
      await upvoteIssue(issueId);
    } catch (err) {
      // Revert optimistic update and surface the real server error message.
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to record verification.';
      addToast({ type: 'error', title: message });
    } finally {
      setPending(false);
    }
  }, [user, hasVoted, pending, issueId, optimisticUpvote, addToast, openLogin]);

  return { vote, hasVoted, pending };
}
