import { useState, useEffect } from 'react';
import CitizenProfile from '../components/gamification/CitizenProfile';
import BadgeGrid from '../components/gamification/BadgeGrid';
import Leaderboard from '../components/gamification/Leaderboard';
import { useAuthStore } from '../store/authStore';
import { fetchLeaderboard } from '../services/analyticsService';
import type { LeaderboardEntry } from '../types/user.types';
import { AVAILABLE_BADGES } from '../types/user.types';
import type { User } from '../types/user.types';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';

type Period = 'all' | 'month' | 'ward';

export default function GamificationPage() {
  const { user: authUser } = useAuthStore();
  const { openLogin }      = useUIStore();

  const [period,      setPeriod]      = useState<Period>('all');
  const [entries,     setEntries]     = useState<LeaderboardEntry[]>([]);
  const [lbLoading,   setLbLoading]   = useState(false);
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  // Fetch leaderboard — pass ward when "My Ward" is selected
  useEffect(() => {
    async function loadLeaderboard() {
      setLbLoading(true);
      const ward = period === 'ward' ? (authUser?.ward ?? undefined) : undefined;
      try {
        const data = await fetchLeaderboard(period, ward);
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        setEntries([]);
      } finally {
        setLbLoading(false);
      }
    }

    void loadLeaderboard();
  }, [period, authUser?.ward]);

  // Fetch the logged-in user's real stats from API
  useEffect(() => {
    async function loadUserStats() {
      if (!authUser?.id) {
        setDisplayUser(null);
        return;
      }

      setUserLoading(true);
      try {
        const [userRes, issueRes] = await Promise.all([
          api.get(`/users/${authUser.id}`),
          api.get(`/issues?page=1&pageSize=100`),
        ]);
        const u      = userRes.data.data;
        const issues = Array.isArray(issueRes.data.data) ? issueRes.data.data : [];

        setDisplayUser({
          id:             u.id,
          citizenId:      u.citizenId,
          name:           u.name?.trim() || 'Anonymous Citizen',
          email:          authUser.email,
          role:           u.role ?? authUser.role ?? 'Citizen',
          ward:           u.ward ?? authUser.ward ?? '',
          avatarUrl:      u.avatarUrl ?? authUser.avatarUrl,
          xp:             u.xp ?? 0,
          level:          u.level ?? 1,
          badges:         AVAILABLE_BADGES.map((b, i) => ({
            ...b,
            locked:   i >= (u.badges?.length ?? 0),
            earnedAt: i < (u.badges?.length ?? 0) ? new Date().toISOString() : undefined,
          })),
          reportStreak:   u.reportStreak ?? 0,
          issuesReported: u._count?.issues ?? issues.length,
          issuesVerified: 0,
          commentsPosted: 0,
          createdAt:      u.createdAt,
          activeCharacter: u.activeCharacter ?? authUser.activeCharacter,
        });
      } catch {
        // Fall back to auth store data with zeroed activity stats
        setDisplayUser({
          id:             authUser.id,
          name:           authUser.name,
          email:          authUser.email,
          role:           authUser.role ?? 'Citizen',
          ward:           authUser.ward ?? '',
          xp:             authUser.xp ?? 0,
          level:          authUser.level ?? 1,
          badges:         AVAILABLE_BADGES.map((b, i) => ({
            ...b,
            locked: i > 0,
            earnedAt: i === 0 ? new Date().toISOString() : undefined,
          })),
          reportStreak:   0,
          issuesReported: 0,
          issuesVerified: 0,
          commentsPosted: 0,
          createdAt:      new Date(Date.now() - 30 * 86400000).toISOString(),
          activeCharacter: authUser.activeCharacter,
        });
      } finally {
        setUserLoading(false);
      }
    }

    void loadUserStats();
  }, [
    authUser?.activeCharacter,
    authUser?.email,
    authUser?.id,
    authUser?.level,
    authUser?.name,
    authUser?.role,
    authUser?.ward,
    authUser?.xp,
  ]);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
        <div>
          <h1 className="font-display text-3xl sm:text-5xl text-[#0D0D0B]">Leaderboard</h1>
          <p className="text-[#6F6F6F] mt-1 sm:mt-2 text-sm sm:text-base">Top civic contributors this period.</p>
        </div>

        {/* My profile card */}
        {authUser ? (
          userLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={24} className="text-[#1A6B3C]" />
            </div>
          ) : displayUser ? (
            <>
              <CitizenProfile user={displayUser} />
              <div>
                <h2 className="font-display text-xl sm:text-2xl text-[#0D0D0B] mb-3 sm:mb-4">My Badges</h2>
                <BadgeGrid badges={displayUser.badges} />
              </div>
            </>
          ) : null
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E5E0] p-6 text-center">
            <p className="text-[#6F6F6F] mb-3 text-sm">Sign in to see your profile and earn badges.</p>
            <Button onClick={openLogin}>Sign In</Button>
          </div>
        )}

        {/* City leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-3">
            <h2 className="font-display text-xl sm:text-2xl text-[#0D0D0B]">City Leaderboard</h2>
            <div className="flex gap-1.5 sm:gap-2">
              {(['all', 'month', 'ward'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors min-h-[36px] ${
                    period === p
                      ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]'
                      : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                  }`}
                >
                  {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'My Ward'}
                </button>
              ))}
            </div>
          </div>
          {lbLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size={24} className="text-[#1A6B3C]" />
            </div>
          ) : (
            <Leaderboard entries={entries} />
          )}
        </div>

        {/* XP activity feed */}
        <div className="pb-4">
          <h2 className="font-display text-xl sm:text-2xl text-[#0D0D0B] mb-3 sm:mb-4">Recent XP</h2>
          <div className="space-y-2">
            {[
              { icon: '✅', text: 'Issue resolved — community thanks you!', xp: 50 },
              { icon: '👥', text: '5 citizens verified your report',        xp: 10 },
              { icon: '✓',  text: 'You verified an issue',                  xp: 5  },
              { icon: '💬', text: 'You posted a helpful comment',           xp: 5  },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-3 sm:p-3 rounded-xl bg-[#F7F7F5]">
                <span className="text-lg">{ev.icon}</span>
                <span className="flex-1 text-sm text-[#0D0D0B]">{ev.text}</span>
                <span className="text-sm font-semibold text-[#1A6B3C] shrink-0">+{ev.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
