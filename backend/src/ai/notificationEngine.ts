import type { Issue } from '@prisma/client';
import { nowIso } from './utils/json';
import type { NotificationPlan } from './types';

export function buildNotifications(issue: Issue, priorityLabel: string, department: string, estimatedDays: number): NotificationPlan {
  return {
    citizen: {
      title: priorityLabel === 'Immediate Attention' ? 'High priority report received' : 'Report received by JanSeva',
      message: `${department} has been identified for your ${issue.category} report. Estimated resolution is about ${estimatedDays} day${estimatedDays === 1 ? '' : 's'}.`,
    },
    authority: {
      title: `${priorityLabel}: ${issue.category}`,
      message: `${issue.title} needs ${department} review at ${issue.address || issue.zone || 'the reported location'}.`,
    },
    confidence: 0.72,
    reason: 'Notifications are generated from priority, department, category, and resolution estimate.',
    timestamp: nowIso(),
    modelUsed: 'fallback-notification-engine',
  };
}
