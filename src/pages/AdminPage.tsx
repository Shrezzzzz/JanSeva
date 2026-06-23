import { useState, useEffect } from 'react';
import { Inbox, BarChart2, Users, Settings, ChevronRight, RefreshCw } from 'lucide-react';
import AuthGuard from '../components/auth/AuthGuard';
import IssueDetail from '../components/issue/IssueDetail';
import { MOCK_ISSUES } from '../utils/mockData';
import type { Issue } from '../types/issue.types';
import { StatusBadge, CategoryBadge, SeverityBadge } from '../components/ui/Badge';
import { timeAgo, daysSince } from '../utils/formatters';
import { clsx } from 'clsx';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import type { AnalyticsSummary } from '../types/api.types';
import { MOCK_ANALYTICS } from '../utils/mockData';

type Tab = 'inbox' | 'analytics' | 'users' | 'settings';

function SLADot({ createdAt }: { createdAt: string }) {
  const days  = daysSince(createdAt);
  const color = days <= 2 ? 'bg-green-500' : days <= 5 ? 'bg-amber-500' : 'bg-red-500';
  return <span title={`${days}d since report`} className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

interface AdminUser {
  id: string;
  name: string;
  ward?: string;
  xp: number;
  level: number;
  reportStreak: number;
  createdAt: string;
  _count: { issues: number };
}

export default function AdminPage() {
  const [tab,      setTab]      = useState<Tab>('inbox');
  const [selected, setSelected] = useState<Issue | null>(null);

  // Analytics state
  const [analytics,     setAnalytics]     = useState<AnalyticsSummary | null>(null);
  const [analyticsLoad, setAnalyticsLoad] = useState(false);

  // Users state
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [usersLoad,  setUsersLoad]  = useState(false);

  useEffect(() => {
    if (tab === 'analytics' && !analytics) {
      setAnalyticsLoad(true);
      api.get('/analytics/summary?range=30d')
        .then((r) => setAnalytics(r.data.data))
        .catch(() => setAnalytics(MOCK_ANALYTICS))
        .finally(() => setAnalyticsLoad(false));
    }
    if (tab === 'users' && users.length === 0) {
      setUsersLoad(true);
      api.get('/users?role=Citizen&limit=20')
        .then((r) => setUsers(r.data.data ?? []))
        .catch(() => setUsers([]))
        .finally(() => setUsersLoad(false));
    }
  }, [tab]);

  const NAV = [
    { id: 'inbox',     icon: Inbox,    label: 'Issue Inbox' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics'  },
    { id: 'users',     icon: Users,    label: 'Users'       },
    { id: 'settings',  icon: Settings, label: 'Settings'    },
  ];

  return (
    <AuthGuard role={['Authority', 'Admin']}>
      <div className="min-h-screen pt-16 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-[#E5E5E0] bg-[#F7F7F5] pt-6 px-3 gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id as Tab)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                tab === n.id
                  ? 'bg-[#1A6B3C] text-white'
                  : 'text-[#6F6F6F] hover:bg-white hover:text-[#0D0D0B]',
              )}
            >
              <n.icon size={16} />
              {n.label}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex">
          <div className="flex-1 min-w-0 overflow-auto">

            {/* ── Inbox ── */}
            {tab === 'inbox' && (
              <div className="p-6">
                <h1 className="font-display text-3xl text-[#0D0D0B] mb-6">Issue Inbox</h1>
                <div className="overflow-x-auto rounded-2xl border border-[#E5E5E0]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F7F7F5] sticky top-0">
                      <tr>
                        {['', 'Issue', 'Category', 'Location', 'Severity', 'Reported', 'Upvotes', 'Status', ''].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#6F6F6F] uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_ISSUES.map((issue) => (
                        <tr
                          key={issue.id}
                          className="border-t border-[#E5E5E0] hover:bg-[#F7F7F5] cursor-pointer transition-colors"
                          onClick={() => setSelected(issue)}
                        >
                          <td className="px-4 py-3"><SLADot createdAt={issue.createdAt} /></td>
                          <td className="px-4 py-3 font-medium text-[#0D0D0B] max-w-[180px] truncate">{issue.title}</td>
                          <td className="px-4 py-3"><CategoryBadge category={issue.category} /></td>
                          <td className="px-4 py-3 text-[#6F6F6F] max-w-[140px] truncate">{issue.zone ?? issue.address ?? '—'}</td>
                          <td className="px-4 py-3"><SeverityBadge severity={issue.severity} /></td>
                          <td className="px-4 py-3 text-[#6F6F6F] whitespace-nowrap">{timeAgo(issue.createdAt)}</td>
                          <td className="px-4 py-3 text-[#6F6F6F]">{issue.upvotes}</td>
                          <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                          <td className="px-4 py-3"><ChevronRight size={14} className="text-[#6F6F6F]" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Analytics ── */}
            {tab === 'analytics' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="font-display text-3xl text-[#0D0D0B]">Analytics</h1>
                  <button
                    onClick={() => {
                      setAnalyticsLoad(true);
                      api.get('/analytics/summary?range=30d')
                        .then((r) => setAnalytics(r.data.data))
                        .catch(() => setAnalytics(MOCK_ANALYTICS))
                        .finally(() => setAnalyticsLoad(false));
                    }}
                    className="p-2 rounded-full hover:bg-[#F7F7F5] text-[#6F6F6F] hover:text-[#1A6B3C] transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={analyticsLoad ? 'animate-spin' : ''} />
                  </button>
                </div>

                {analyticsLoad ? (
                  <div className="flex justify-center py-16"><Spinner size={28} className="text-[#1A6B3C]" /></div>
                ) : analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        {
                          label: 'Total Issues',
                          value: analytics.totalIssues.toLocaleString(),
                          sub:   'last 30 days',
                        },
                        {
                          label: 'Resolved',
                          value: analytics.resolvedIssues.toLocaleString(),
                          sub:   `${(analytics.resolutionRate * 100).toFixed(0)}% resolution rate`,
                        },
                        {
                          label: 'Avg Resolution Time',
                          value: `${analytics.avgResolutionDays.toFixed(1)}d`,
                          sub:   'days per issue',
                        },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-2xl border border-[#E5E5E0] p-5">
                          <p className="text-xs text-[#6F6F6F] uppercase tracking-wide">{s.label}</p>
                          <p className="font-display text-3xl text-[#0D0D0B] mt-2">{s.value}</p>
                          <p className="text-xs text-[#6F6F6F] mt-1">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Zone performance */}
                    {analytics.byZone.length > 0 && (
                      <div>
                        <h2 className="font-medium text-[#0D0D0B] mb-3">Zone Performance</h2>
                        <div className="overflow-x-auto rounded-2xl border border-[#E5E5E0]">
                          <table className="w-full text-sm">
                            <thead className="bg-[#F7F7F5]">
                              <tr>
                                {['Zone', 'Reported', 'Resolved', 'Avg Days', 'Rate', 'Grade'].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6F6F6F] uppercase tracking-wide">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.byZone.map((z) => (
                                <tr key={z.zone} className="border-t border-[#E5E5E0]">
                                  <td className="px-4 py-3 font-medium text-[#0D0D0B]">{z.zone}</td>
                                  <td className="px-4 py-3 text-[#6F6F6F]">{z.reported}</td>
                                  <td className="px-4 py-3 text-[#6F6F6F]">{z.resolved}</td>
                                  <td className="px-4 py-3 text-[#6F6F6F]">{z.avgDays}d</td>
                                  <td className="px-4 py-3 text-[#6F6F6F]">{(z.responseRate * 100).toFixed(0)}%</td>
                                  <td className="px-4 py-3">
                                    <span className={clsx(
                                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                                      z.grade === 'A' ? 'bg-green-100 text-green-700' :
                                      z.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                      z.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700',
                                    )}>
                                      {z.grade}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#6F6F6F]">No analytics data available.</p>
                )}
              </div>
            )}

            {/* ── Users ── */}
            {tab === 'users' && (
              <div className="p-6">
                <h1 className="font-display text-3xl text-[#0D0D0B] mb-6">Registered Citizens</h1>
                {usersLoad ? (
                  <div className="flex justify-center py-16"><Spinner size={28} className="text-[#1A6B3C]" /></div>
                ) : users.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-[#E5E5E0]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7F7F5]">
                        <tr>
                          {['Name', 'Ward', 'XP', 'Level', 'Issues', 'Streak', 'Joined'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6F6F6F] uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-t border-[#E5E5E0] hover:bg-[#F7F7F5] transition-colors">
                            <td className="px-4 py-3 font-medium text-[#0D0D0B]">{u.name}</td>
                            <td className="px-4 py-3 text-[#6F6F6F]">{u.ward ?? '—'}</td>
                            <td className="px-4 py-3 text-[#6F6F6F]">{u.xp.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#1A6B3C] text-xs font-medium">
                                Lv {u.level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#6F6F6F]">{u._count.issues}</td>
                            <td className="px-4 py-3 text-[#6F6F6F]">
                              {u.reportStreak > 0 ? `🔥 ${u.reportStreak}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-[#6F6F6F] whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[#6F6F6F]">No users found. Make sure the backend is running and seeded.</p>
                )}
              </div>
            )}

            {/* ── Settings ── */}
            {tab === 'settings' && (
              <div className="p-6">
                <h1 className="font-display text-3xl text-[#0D0D0B] mb-2">Settings</h1>
                <p className="text-[#6F6F6F]">Platform configuration coming soon.</p>
              </div>
            )}
          </div>

          {/* Issue detail side panel */}
          {selected && (
            <div className="w-full sm:w-[420px] border-l border-[#E5E5E0] flex-shrink-0 overflow-hidden flex flex-col">
              <IssueDetail issue={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
