import type { AnalyticsSummary } from '../types/api.types';
import type { Issue } from '../types/issue.types';
import { subDays } from 'date-fns';

function days(n: number): string { return subDays(new Date(), n).toISOString(); }
function datePt(n: number, count: number) { return { date: subDays(new Date(), n).toISOString().split('T')[0], count }; }

export const MOCK_ANALYTICS: AnalyticsSummary = {
  totalIssues:        12_430,
  activeIssues:        4_220,
  resolvedIssues:     8_210,
  resolutionRate:     0.66,
  avgResolutionDays:  4.2,
  activeContributors: 3_102,
  trends: {
    issues:   Array.from({ length: 30 }, (_, i) => datePt(29 - i, 80 + Math.round(Math.random() * 60))),
    resolved: Array.from({ length: 30 }, (_, i) => datePt(29 - i, 50 + Math.round(Math.random() * 50))),
  },
  byCategory: [
    { category: 'Pothole',     count: 3200, resolved: 2100, color: '#DC2626' },
    { category: 'Streetlight', count: 2100, resolved: 1500, color: '#F59E0B' },
    { category: 'Water Leak',  count: 1800, resolved: 1200, color: '#0284C7' },
    { category: 'Waste Dump',  count: 1500, resolved: 900,  color: '#65A30D' },
    { category: 'Sewage',      count: 900,  resolved: 600,  color: '#7C3AED' },
    { category: 'Road Damage', count: 1200, resolved: 700,  color: '#EA580C' },
    { category: 'Park Issue',  count: 800,  resolved: 500,  color: '#16A34A' },
    { category: 'Other',       count: 930,  resolved: 610,  color: '#6F6F6F' },
  ],
  severityDistribution: [
    { severity: 'Low', count: 3200 },
    { severity: 'Medium', count: 5100 },
    { severity: 'High', count: 3100 },
    { severity: 'Critical', count: 1030 },
  ],
  byZone: [
    { zone: 'Ward 1',  reported: 420, resolved: 380, avgDays: 3.2, responseRate: 0.90, grade: 'A' },
    { zone: 'Ward 2',  reported: 310, resolved: 260, avgDays: 4.1, responseRate: 0.84, grade: 'B' },
    { zone: 'Ward 3',  reported: 290, resolved: 230, avgDays: 5.0, responseRate: 0.79, grade: 'B' },
    { zone: 'Ward 4',  reported: 380, resolved: 280, avgDays: 6.2, responseRate: 0.74, grade: 'C' },
    { zone: 'Ward 5',  reported: 200, resolved: 120, avgDays: 9.0, responseRate: 0.60, grade: 'D' },
    { zone: 'Ward 6',  reported: 340, resolved: 310, avgDays: 2.8, responseRate: 0.91, grade: 'A' },
    { zone: 'Ward 7',  reported: 260, resolved: 240, avgDays: 3.5, responseRate: 0.92, grade: 'A' },
    { zone: 'Ward 8',  reported: 410, resolved: 290, avgDays: 5.5, responseRate: 0.71, grade: 'C' },
  ],
  wardDistribution: [
    { zone: 'Ward 1',  reported: 420, resolved: 380, avgDays: 3.2, responseRate: 0.90, grade: 'A' },
    { zone: 'Ward 2',  reported: 310, resolved: 260, avgDays: 4.1, responseRate: 0.84, grade: 'B' },
    { zone: 'Ward 3',  reported: 290, resolved: 230, avgDays: 5.0, responseRate: 0.79, grade: 'B' },
    { zone: 'Ward 4',  reported: 380, resolved: 280, avgDays: 6.2, responseRate: 0.74, grade: 'C' },
    { zone: 'Ward 5',  reported: 200, resolved: 120, avgDays: 9.0, responseRate: 0.60, grade: 'D' },
    { zone: 'Ward 6',  reported: 340, resolved: 310, avgDays: 2.8, responseRate: 0.91, grade: 'A' },
    { zone: 'Ward 7',  reported: 260, resolved: 240, avgDays: 3.5, responseRate: 0.92, grade: 'A' },
    { zone: 'Ward 8',  reported: 410, resolved: 290, avgDays: 5.5, responseRate: 0.71, grade: 'C' },
  ],
};

export const MOCK_ISSUES: Issue[] = Array.from({ length: 20 }, (_, i) => ({
  id:          `mock-issue-${i + 1}`,
  title:       ['Pothole on MG Road', 'Broken streetlight near park', 'Water leakage at junction', 'Garbage pile near school', 'Sewage overflow'][i % 5],
  description: 'This issue has been affecting residents for several weeks. Immediate attention required.',
  category:    (['Pothole','Streetlight','WaterLeak','WasteDump','Sewage'] as const)[i % 5],
  severity:    (['Low','Medium','High','Critical'] as const)[i % 4],
  status:      (['Reported','Verified','Assigned','InProgress','Resolved'] as const)[i % 5],
  latitude:    22.5726 + (Math.random() - 0.5) * 0.1,
  longitude:   88.3639 + (Math.random() - 0.5) * 0.1,
  address:     `${Math.floor(Math.random() * 100) + 1}, Park Street, Kolkata`,
  zone:        `Ward ${(i % 8) + 1}`,
  mediaUrls:   [],
  isAnonymous: i % 4 === 0,
  reporterId:  `user-${i + 1}`,
  reporterName:`Citizen ${i + 1}`,
  upvotes:     Math.floor(Math.random() * 20),
  verifiedBy:  [],
  createdAt:   days(i * 2),
  updatedAt:   days(i),
  comments:    [],
  timeline:    [
    {
      id: `ev-${i}-1`, issueId: `mock-issue-${i + 1}`,
      event: 'Issue Reported', actor: `Citizen ${i + 1}`, actorRole: 'Citizen',
      note: 'Reported via JanSeva app', createdAt: days(i * 2),
    },
  ],
}));
