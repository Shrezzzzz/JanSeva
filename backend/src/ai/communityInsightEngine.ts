import type { Issue } from '@prisma/client';
import { nowIso } from './utils/json';
import type { CommunityInsight } from './types';

export function generateCommunityInsight(issue: Issue, historicalIssues: Pick<Issue, 'category' | 'status' | 'zone' | 'department'>[]): CommunityInsight {
  const sameCategory = historicalIssues.filter((item) => item.category === issue.category).length;
  const resolvedByDept = historicalIssues.filter((item) => item.department && item.status === 'Resolved');
  const topWard = historicalIssues.reduce<Record<string, number>>((acc, item) => {
    const key = item.zone || 'Unassigned ward';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topAffectedWard = Object.entries(topWard).sort((a, b) => b[1] - a[1])[0]?.[0] || issue.zone || 'Current ward';

  return {
    weeklyTrend: `${issue.category} reports show ${sameCategory >= 3 ? 'elevated' : 'stable'} activity this week.`,
    monthlyTrend: `Current area density suggests ${sameCategory >= 5 ? 'recurring civic stress' : 'normal municipal load'}.`,
    topAffectedWard,
    fastestRespondingDepartment: resolvedByDept[0]?.department || issue.department || 'Road Maintenance Department',
    departmentsUnderPressure: Array.from(new Set(historicalIssues.map((item) => item.department).filter(Boolean) as string[])).slice(0, 3),
    confidence: 0.62,
    reason: 'Insight summarizes local historical density, category recurrence, ward concentration, and resolved department patterns.',
    timestamp: nowIso(),
    modelUsed: 'fallback-community-insight-engine',
  };
}
