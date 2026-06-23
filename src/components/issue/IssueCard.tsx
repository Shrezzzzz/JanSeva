import { MapPin, ThumbsUp, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { Issue } from '../../types/issue.types';
import { CATEGORY_COLORS } from '../../types/issue.types';
import { CategoryBadge, StatusBadge, SeverityBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { timeAgo, truncate, issueIdDisplay } from '../../utils/formatters';
import Card from '../ui/Card';

interface IssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
  compact?: boolean;
  className?: string;
}

export default function IssueCard({ issue, onClick, compact, className }: IssueCardProps) {
  return (
    <Card
      hover={!!onClick}
      accentLeft={CATEGORY_COLORS[issue.category]}
      onClick={() => onClick?.(issue)}
      className={clsx('p-4', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <CategoryBadge category={issue.category} />
            <StatusBadge status={issue.status} />
            {!compact && <SeverityBadge severity={issue.severity} />}
          </div>
          <h3 className="font-medium text-sm text-[#0D0D0B] leading-snug">{issue.title}</h3>
          {!compact && issue.description && (
            <p className="text-xs text-[#6F6F6F] mt-1">{truncate(issue.description, 80)}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {issue.address && (
              <span className="flex items-center gap-1 text-xs text-[#6F6F6F]">
                <MapPin size={11} /> {truncate(issue.address, 40)}
              </span>
            )}
            <span className="text-xs text-[#6F6F6F]">{timeAgo(issue.createdAt)}</span>
          </div>
          {/* Track link — only shown when onClick is provided */}
          {onClick && (
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1A6B3C] hover:underline">
                Track <ArrowRight size={11} />
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {!issue.isAnonymous && (
            <Avatar src={issue.reporterAvatar} name={issue.reporterName} size="sm" />
          )}
          <span className="flex items-center gap-1 text-xs text-[#6F6F6F]">
            <ThumbsUp size={11} /> {issue.upvotes}
          </span>
          {!compact && (
            <span className="text-xs text-[#6F6F6F] font-mono">{issueIdDisplay(issue.id)}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
