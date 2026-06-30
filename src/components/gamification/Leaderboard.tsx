import { clsx } from 'clsx';
import type { LeaderboardEntry } from '../../types/user.types';
import Avatar from '../ui/Avatar';
import { useAuthStore } from '../../store/authStore';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const { user } = useAuthStore();

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const isMe = user?.id === e.userId;
        const displayName = e.name?.trim() || 'Anonymous Citizen';
        return (
          <div
            key={e.userId}
            className={clsx(
              'flex items-center gap-4 px-4 py-3 rounded-2xl border transition-colors',
              isMe ? 'border-[#1A6B3C] bg-[#E8F5EE]' : 'border-[#E5E5E0] bg-white hover:bg-[#F7F7F5]',
            )}
          >
            {/* Rank */}
            <div className="w-8 text-center flex-shrink-0">
              {e.rank <= 3
                ? <span className="text-xl">{MEDALS[e.rank - 1]}</span>
                : <span className="text-sm font-semibold text-[#6F6F6F]">{e.rank}</span>
              }
            </div>

            {/* Avatar + name */}
            <Avatar
              src={e.avatarUrl}
              name={displayName}
              size="md"
              ring={isMe}
              activeCharacter={e.activeCharacter}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[#0D0D0B] truncate">
                  {displayName}
                  {isMe && <span className="text-xs text-[#1A6B3C] ml-1">(You)</span>}
                </p>
                {e.citizenId && (
                  <span className="font-mono text-[10px] text-[#6F6F6F] bg-[#F7F7F5] border border-[#E5E5E0] px-1.5 py-0.5 rounded flex-shrink-0">
                    {e.citizenId}
                  </span>
                )}
              </div>
              {e.ward && <p className="text-xs text-[#6F6F6F]">{e.ward}</p>}
            </div>

            {/* Badge */}
            {e.topBadge && <span className="text-xl flex-shrink-0" title={e.topBadge.name}>{e.topBadge.icon}</span>}

            {/* XP + bar */}
            <div className="flex flex-col items-end gap-1 w-24 flex-shrink-0">
              <span className="text-sm font-semibold text-[#0D0D0B]">{e.xp.toLocaleString()} XP</span>
              <div className="w-full h-1.5 rounded-full bg-[#E5E5E0] overflow-hidden">
                <div
                  className="h-full bg-[#1A6B3C] rounded-full"
                  style={{ width: `${Math.min((e.xp / (entries[0]?.xp || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
