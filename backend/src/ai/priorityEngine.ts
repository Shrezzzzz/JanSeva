import type { Issue, Severity } from '@prisma/client';
import { clamp, nowIso } from './utils/json';
import type { PriorityDecision } from './types';

const severityWeights: Record<Severity, number> = {
  Low: 12,
  Medium: 30,
  High: 52,
  Critical: 70,
};

export function calculatePriority(params: {
  issue: Issue;
  nearbyDuplicateCount: number;
  historicalDensity: number;
  imageConfidence?: number | null;
}) : PriorityDecision {
  const { issue, nearbyDuplicateCount, historicalDensity, imageConfidence } = params;
  const text = `${issue.title} ${issue.description ?? ''} ${issue.address ?? ''}`.toLowerCase();
  const trafficImpact = /(traffic|junction|main road|highway|bus|accident|blocked|commute)/.test(text) ? 10 : 0;
  const schoolOrHospital = /(school|hospital|clinic|college|ambulance)/.test(text) ? 12 : 0;
  const community = clamp(issue.upvotes * 2, 0, 12);
  const duplicates = clamp(nearbyDuplicateCount * 4, 0, 14);
  const history = clamp(historicalDensity * 2, 0, 10);
  const confidence = imageConfidence == null ? 4 : Math.round(clamp(imageConfidence, 0, 1) * 8);

  const score = Math.round(clamp(
    severityWeights[issue.severity] + trafficImpact + schoolOrHospital + community + duplicates + history + confidence,
    0,
    100,
  ));

  const label: PriorityDecision['label'] =
    score >= 85 ? 'Immediate Attention' :
    score >= 70 ? 'High Priority' :
    score >= 45 ? 'Elevated' :
    'Routine';

  return {
    score,
    label,
    confidence: imageConfidence ?? 0.72,
    reason: `Priority combines ${issue.severity} severity, ${issue.upvotes} community verifications, ${nearbyDuplicateCount} nearby similar reports, and ${historicalDensity} historical reports in this area.`,
    timestamp: nowIso(),
    modelUsed: 'deterministic-priority-engine',
  };
}
