import type { TimelineEvent } from '../../types/issue.types';
import { formatDateTime } from '../../utils/formatters';
import Avatar from '../ui/Avatar';

const EVENT_STYLE: Record<string, { dot: string; icon: string }> = {
  reported:  { dot: 'bg-[#9CA3AF]', icon: '🟢' },
  verified:  { dot: 'bg-[#0284C7]', icon: '🔵' },
  assigned:  { dot: 'bg-[#D97706]', icon: '🟡' },
  started:   { dot: 'bg-[#F59E0B]', icon: '🔧' },
  resolved:  { dot: 'bg-[#1A6B3C]', icon: '✅' },
  comment:   { dot: 'bg-[#6F6F6F]', icon: '💬' },
};

function getEventStyle(event: string) {
  const key = event.toLowerCase().split(' ')[0];
  return EVENT_STYLE[key] ?? { dot: 'bg-[#E5E5E0]', icon: '•' };
}

export default function IssueTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return <p className="text-sm text-[#6F6F6F]">No timeline events yet.</p>;

  return (
    <div className="relative">
      {/* Left border line */}
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[#E5E5E0]" aria-hidden />
      <ul className="space-y-6">
        {events.map((ev) => {
          const style = getEventStyle(ev.event);
          return (
            <li key={ev.id} className="flex items-start gap-4 pl-0">
              <div className={`w-7 h-7 rounded-full ${style.dot} flex items-center justify-center text-xs flex-shrink-0 z-10 ring-2 ring-white`} aria-hidden>
                {style.icon.length <= 2 ? style.icon : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-sm text-[#0D0D0B]">{ev.event}</span>
                    {' '}
                    <span className="text-sm text-[#6F6F6F]">by {ev.actor}</span>
                    <span className="ml-1 text-xs text-[#6F6F6F] bg-[#F7F7F5] px-1.5 py-0.5 rounded">{ev.actorRole}</span>
                  </div>
                  <time className="text-xs text-[#6F6F6F] flex-shrink-0">{formatDateTime(ev.createdAt)}</time>
                </div>
                {ev.note && <p className="text-sm text-[#6F6F6F] mt-1">{ev.note}</p>}
                {ev.mediaUrl && (
                  <img src={ev.mediaUrl} alt="Evidence" className="mt-2 rounded-xl max-h-40 object-cover" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
