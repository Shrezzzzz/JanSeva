import { useState } from 'react';
import { Send, Flag } from 'lucide-react';
import type { Comment } from '../../types/issue.types';
import { timeAgo } from '../../utils/formatters';
import Avatar from '../ui/Avatar';
import { addComment } from '../../services/issueService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import Button from '../ui/Button';

const SENTIMENT_ICON: Record<string, string> = {
  Positive:   '😊',
  Neutral:    '😐',
  Frustrated: '😤',
  Urgent:     '🚨',
};

interface CommentThreadProps {
  issueId: string;
  comments: Comment[];
  onNewComment: (c: Comment) => void;
}

export default function CommentThread({ issueId, comments, onNewComment }: CommentThreadProps) {
  const { user } = useAuthStore();
  const { addToast, openLogin } = useUIStore();
  const [text,     setText]    = useState('');
  const [posting,  setPosting] = useState(false);

  async function submit() {
    if (!user) { openLogin(); return; }
    if (!text.trim()) return;
    setPosting(true);
    try {
      const c = await addComment(issueId, text.trim());
      onNewComment(c);
      setText('');
    } catch {
      addToast({ type: 'error', title: 'Could not post comment.' });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-[#0D0D0B]">Comments ({comments.length})</h4>

      {comments.map((c) => (
        <div key={c.id} className="flex gap-3 group">
          <Avatar src={c.authorAvatar} name={c.authorName} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-[#0D0D0B]">{c.authorName}</span>
              {c.sentiment && (
                <span title={c.sentiment} aria-label={c.sentiment} className="text-xs">{SENTIMENT_ICON[c.sentiment]}</span>
              )}
              <span className="text-xs text-[#6F6F6F]">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-sm text-[#6F6F6F]">{c.content}</p>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#F7F7F5]" aria-label="Report comment">
            <Flag size={13} className="text-[#6F6F6F]" />
          </button>
        </div>
      ))}

      {!comments.length && (
        <p className="text-sm text-[#6F6F6F]">No comments yet. Be the first!</p>
      )}

      {/* Add comment */}
      <div className="flex gap-2 mt-4">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-xl border border-[#E5E5E0] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        />
        <Button size="sm" onClick={submit} loading={posting} icon={<Send size={14} />} aria-label="Post comment" />
      </div>
    </div>
  );
}
