import type { Issue } from '@prisma/client';
import { nowIso } from './utils/json';
import type { CitizenGuidance, ResolutionEstimate } from './types';

export function fallbackAuthoritySummary(issue: Issue, department: string, resolution: ResolutionEstimate) {
  const location = issue.address || issue.zone || 'reported location';
  return {
    summary: `${issue.title} at ${location}. ${issue.severity} severity ${issue.category} case requiring ${department}. Estimated resolution ${resolution.estimatedDays} days with ${Math.round(resolution.confidence * 100)}% confidence.`,
    confidence: 0.68,
    reason: 'Generated from report category, severity, department, location, and resolution estimate.',
    timestamp: nowIso(),
    modelUsed: 'fallback-summary-engine',
  };
}

export function fallbackCitizenGuidance(issue: Issue, priorityLabel: string): CitizenGuidance {
  return {
    issueSummary: `${issue.category} report logged for ${issue.address || issue.zone || 'your selected location'}.`,
    personalizedAdvice: priorityLabel === 'Immediate Attention'
      ? 'Avoid the affected spot if possible and encourage nearby residents to verify the report.'
      : 'Your report is in the civic workflow. Add updates if conditions change.',
    safetyRecommendations: [
      'Avoid risky close-up photos after submission.',
      'Share the tracking link with nearby residents for verification.',
    ],
    verificationSuggestions: [
      'Ask neighbors affected by the issue to verify it.',
      'Add a clear follow-up comment if the situation worsens.',
    ],
    progressExpectations: `The responsible department should review this ${issue.severity.toLowerCase()} severity report based on priority and workload.`,
    confidence: 0.7,
    reason: 'Guidance is based on issue severity, location, and operational priority.',
    timestamp: nowIso(),
    modelUsed: 'fallback-citizen-guidance-engine',
  };
}
