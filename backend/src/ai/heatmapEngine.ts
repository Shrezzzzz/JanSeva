import type { Issue } from '@prisma/client';
import { nowIso } from './utils/json';
import type { HeatmapInsight } from './types';

export function generateHeatmapInsight(issue: Issue, nearbyIssues: Pick<Issue, 'category' | 'zone' | 'address'>[]): HeatmapInsight {
  const zones = Array.from(new Set(nearbyIssues.map((item) => item.zone).filter(Boolean) as string[]));
  const addresses = Array.from(new Set(nearbyIssues.map((item) => item.address).filter(Boolean) as string[]));
  const currentZone = issue.zone || 'Current report area';

  return {
    hotspotNames: (zones.length ? zones : [currentZone]).slice(0, 4),
    emergingRiskZones: zones.length >= 2 ? zones.slice(0, 3) : [currentZone],
    repeatedIssueAreas: addresses.slice(0, 3),
    predictedHighRiskAreas: nearbyIssues.length >= 3 ? [currentZone] : [],
    confidence: 0.61,
    reason: 'Heatmap insight is based on nearby issue density, repeated addresses, and ward clustering.',
    timestamp: nowIso(),
    modelUsed: 'fallback-heatmap-engine',
  };
}
