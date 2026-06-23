import { ThumbsUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useUpvote } from '../../hooks/useUpvote';

interface VerifyButtonProps {
  issueId: string;
  verifiedBy: string[];
  upvotes: number;
  targetCount?: number;
  showProgress?: boolean;
}

export default function VerifyButton({
  issueId, verifiedBy, upvotes, targetCount = 10, showProgress = false,
}: VerifyButtonProps) {
  const { vote, hasVoted, pending } = useUpvote(issueId, verifiedBy);
  const pct = Math.min((upvotes / targetCount) * 100, 100);

  return (
    <div className="space-y-2">
      <button
        onClick={vote}
        disabled={hasVoted || pending}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200',
          hasVoted
            ? 'bg-[#E8F5EE] border-[#1A6B3C] text-[#1A6B3C] cursor-default'
            : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#1A6B3C] hover:text-[#1A6B3C] hover:bg-[#E8F5EE] active:scale-95',
        )}
        aria-label={hasVoted ? "You've confirmed this issue" : "I've seen this issue too"}
      >
        <ThumbsUp size={15} className={pending ? 'animate-bounce' : ''} />
        {hasVoted ? "You confirmed this" : "I've seen this too"}
        <span className="font-semibold">{upvotes}</span>
      </button>

      {showProgress && (
        <div className="space-y-1">
          <div className="w-full h-1.5 rounded-full bg-[#E5E5E0] overflow-hidden">
            <div className="h-full bg-[#1A6B3C] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-[#6F6F6F]">{upvotes} of {targetCount} needed for auto-escalation</p>
        </div>
      )}
    </div>
  );
}
