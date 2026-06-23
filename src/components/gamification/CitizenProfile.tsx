import type { User } from '../../types/user.types';
import Avatar from '../ui/Avatar';
import XPBar from './XPBar';
import CivicPet from './CivicPet';
import { getLevelTitle } from '../../utils/xpCalculator';
import { formatDate } from '../../utils/formatters';

interface CitizenProfileProps {
  user: User;
  compact?: boolean;
}

export default function CitizenProfile({ user, compact }: CitizenProfileProps) {
  const levelTitle = getLevelTitle(user.level);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E0] p-6">
      {/* ── Header: avatar (left) + pet (right) ── */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: avatar + info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar src={user.avatarUrl} name={user.name} size="xl" ring />

          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-[#0D0D0B] leading-tight">{user.name}</h2>
            <p className="text-sm italic text-[#1A6B3C] font-display">{levelTitle} Lv.{user.level}</p>

            {user.citizenId && (
              <span className="inline-block mt-1 font-mono text-xs text-[#6F6F6F] bg-[#F7F7F5] border border-[#E5E5E0] px-2 py-0.5 rounded-md">
                {user.citizenId}
              </span>
            )}

            <div className="mt-1 space-y-0.5">
              {user.ward && (
                <p className="text-xs text-[#6F6F6F]">{user.ward}</p>
              )}
              {!compact && (
                <p className="text-xs text-[#6F6F6F]">Member since {formatDate(user.createdAt)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: pet */}
        {!compact && (
          <div className="flex-shrink-0">
            {user.pet ? (
              <CivicPet pet={user.pet} size={60} />
            ) : (
              /* No pet yet — show egg placeholder with hint */
              <div className="flex flex-col items-center gap-1 w-16">
                <span className="text-4xl leading-none">🥚</span>
                <p className="text-[10px] text-[#6F6F6F] text-center leading-tight">
                  Nagar<br />hatching…
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── XP bar ── */}
      <div className="mt-5">
        <XPBar xp={user.xp} level={user.level} />
      </div>

      {/* ── Stat row ── */}
      {!compact && (
        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Reported',  value: user.issuesReported },
            { label: 'Verified',  value: user.issuesVerified },
            { label: 'Comments',  value: user.commentsPosted },
            { label: 'Streak',    value: `${user.reportStreak}d` },
          ].map((s) => (
            <div key={s.label} className="bg-[#F7F7F5] rounded-xl p-3">
              <p className="font-display text-xl text-[#0D0D0B]">{s.value}</p>
              <p className="text-xs text-[#6F6F6F] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
