import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CitizenProfile from '../components/gamification/CitizenProfile';
import BadgeGrid from '../components/gamification/BadgeGrid';
import IssueCard from '../components/issue/IssueCard';
import { useAuthStore } from '../store/authStore';
import { AVAILABLE_BADGES } from '../types/user.types';
import { MOCK_ISSUES } from '../utils/mockData';
import type { User } from '../types/user.types';
import type { Issue } from '../types/issue.types';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { ROUTES } from '../config/routes';

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();
  const { id }             = useParams<{ id?: string }>();
  const navigate           = useNavigate();

  // Resolve which user ID to display
  const targetId = id ?? authUser?.id;

  const [profile,    setProfile]    = useState<User | null>(null);
  const [myIssues,   setMyIssues]   = useState<Issue[]>([]);
  const [loading,    setLoading]    = useState(() => Boolean(targetId));

  useEffect(() => {
    if (!targetId) {
      return;
    }

    async function loadProfile() {
      setLoading(true);
      try {
        // Fetch user profile
        const userRes = await api.get(`/users/${targetId}`);
        const u = userRes.data.data;

        // Fetch their issues
        const issueRes = await api.get(`/issues?page=1&pageSize=5`, {
          params: targetId === authUser?.id ? {} : { reporterId: targetId },
        }).catch(() => ({ data: { data: [] } }));

        const issues: Issue[] = Array.isArray(issueRes.data.data)
          ? issueRes.data.data
          : issueRes.data.data ?? [];

        const builtUser: User = {
          id:             u.id,
          citizenId:      u.citizenId,
          name:           u.name,
          email:          authUser?.email ?? '',
          role:           u.role ?? 'Citizen',
          ward:           u.ward ?? 'Unknown Ward',
          xp:             u.xp ?? 0,
          level:          u.level ?? 1,
          badges:         AVAILABLE_BADGES.map((b, i) => ({
            ...b,
            locked: i >= (u.badges?.length ?? 0),
            earnedAt: i < (u.badges?.length ?? 0) ? new Date().toISOString() : undefined,
          })),
          reportStreak:   u.reportStreak ?? 0,
          issuesReported: u._count?.issues ?? issues.length,
          issuesVerified: 0,
          commentsPosted: u._count?.comments ?? 0,
          createdAt:      u.createdAt,
          activeCharacter: u.activeCharacter ?? authUser?.activeCharacter,
        };

        setProfile(builtUser);
        setMyIssues(issues.slice(0, 5));
      } catch {
        // Fall back to auth user data with MOCK_ISSUES
        if (authUser) {
          setProfile({
            id:             authUser.id,
            name:           authUser.name,
            email:          authUser.email,
            role:           authUser.role ?? 'Citizen',
            ward:           authUser.ward ?? 'Ward 5, Kolkata',
            xp:             authUser.xp ?? 0,
            level:          authUser.level ?? 1,
            badges:         AVAILABLE_BADGES.map((b, i) => ({
              ...b,
              locked: i > 3,
              earnedAt: i <= 3 ? new Date().toISOString() : undefined,
            })),
            reportStreak:   0,
            issuesReported: 0,
            issuesVerified: 0,
            commentsPosted: 0,
            createdAt:      new Date(Date.now() - 120 * 86400000).toISOString(),
            activeCharacter: authUser.activeCharacter,
          });
          setMyIssues(MOCK_ISSUES.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [targetId, authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} className="text-[#1A6B3C]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-[#6F6F6F]">Sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        <CitizenProfile user={profile} />
        {authUser?.id === profile.id && (
          <Button variant="outline" onClick={() => navigate(ROUTES.AVATAR)}>
            Change Avatar
          </Button>
        )}
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-[#0D0D0B] mb-3 sm:mb-4">Badges</h2>
          <BadgeGrid badges={profile.badges} />
        </div>
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-[#0D0D0B] mb-3 sm:mb-4">Recent Reports</h2>
          {myIssues.length > 0 ? (
            <div className="space-y-3">
              {myIssues.map((issue) => (
                <div key={issue.id} className="relative group">
                  <IssueCard issue={issue} onClick={(i) => navigate(`/track/${i.id}`)} />
                  {authUser && (!issue.reporterId || issue.reporterId === authUser.id) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/report/${issue.id}/edit`); }}
                      className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white border border-[#E5E5E0] text-[#6F6F6F] hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-all shadow-sm sm:opacity-0 sm:group-hover:opacity-100 opacity-100 min-h-[36px]"
                      title="Edit this report"
                    >
                      <span className="sm:inline hidden">Edit</span> ✏️
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6F6F6F]">No issues reported yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
