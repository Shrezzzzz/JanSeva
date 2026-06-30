import type { Issue } from '@prisma/client';
import { nowIso } from './utils/json';
import type { WorkflowRecommendation } from './types';

export function recommendWorkflow(issue: Issue, priorityScore: number, department: string, isDuplicate: boolean): WorkflowRecommendation {
  const escalationRequired = priorityScore >= 85 || issue.severity === 'Critical';
  const nextBestAction = isDuplicate
    ? 'Merge duplicate reports and consolidate verification count'
    : escalationRequired
      ? 'Inspect within 24 hours and prepare emergency response'
      : priorityScore >= 70
        ? 'Schedule field inspection and assign department owner'
        : 'Queue for ward-level verification and routine assignment';

  return {
    nextBestAction,
    recommendedOwner: department,
    escalationRequired,
    suggestedWorkOrder: [
      isDuplicate ? 'Link duplicate report to original case' : 'Verify exact site conditions',
      `Assign to ${department}`,
      escalationRequired ? 'Notify ward officer and operations lead' : 'Update citizen with expected timeline',
    ],
    confidence: 0.74,
    reason: 'Workflow is selected from priority, duplicate status, severity, and department ownership.',
    timestamp: nowIso(),
    modelUsed: 'fallback-workflow-engine',
  };
}
