import type { Issue, Severity } from '@prisma/client';

export type AIConfidence = {
  confidence: number;
  reason: string;
  timestamp: string;
  modelUsed: string;
};

export type DepartmentDecision = AIConfidence & {
  department: string;
};

export type ResolutionEstimate = AIConfidence & {
  estimatedDays: number;
};

export type PriorityDecision = AIConfidence & {
  score: number;
  label: 'Routine' | 'Elevated' | 'High Priority' | 'Immediate Attention';
};

export type CitizenGuidance = AIConfidence & {
  issueSummary: string;
  personalizedAdvice: string;
  safetyRecommendations: string[];
  verificationSuggestions: string[];
  progressExpectations: string;
};

export type NotificationPlan = AIConfidence & {
  citizen: {
    title: string;
    message: string;
  };
  authority: {
    title: string;
    message: string;
  };
};

export type WorkflowRecommendation = AIConfidence & {
  nextBestAction: string;
  recommendedOwner: string;
  escalationRequired: boolean;
  suggestedWorkOrder: string[];
};

export type CommunityInsight = AIConfidence & {
  weeklyTrend: string;
  monthlyTrend: string;
  topAffectedWard: string;
  fastestRespondingDepartment: string;
  departmentsUnderPressure: string[];
};

export type HeatmapInsight = AIConfidence & {
  hotspotNames: string[];
  emergingRiskZones: string[];
  repeatedIssueAreas: string[];
  predictedHighRiskAreas: string[];
};

export type DuplicateDecision = AIConfidence & {
  isDuplicate: boolean;
  duplicateId: string | null;
};

export type IssueAnalysisInput = {
  issue: Issue;
  nearbyIssues: Pick<Issue, 'id' | 'title' | 'category' | 'severity' | 'upvotes' | 'zone' | 'address' | 'createdAt'>[];
  historicalIssues: Pick<Issue, 'id' | 'category' | 'severity' | 'status' | 'upvotes' | 'zone' | 'department' | 'createdAt'>[];
  groqCategory?: {
    category?: string;
    severity?: Severity | string;
    confidence?: number;
    title?: string;
    estimatedResolutionDays?: number;
    department?: string;
  } | null;
};

export type AutonomousIssueAnalysis = {
  issueId: string;
  imageAnalysis: AIConfidence & { confidenceLabel: string };
  category: AIConfidence & { value: string };
  severity: AIConfidence & { value: Severity };
  department: DepartmentDecision;
  duplicate: DuplicateDecision;
  resolution: ResolutionEstimate;
  priority: PriorityDecision;
  citizenGuidance: CitizenGuidance;
  authoritySummary: AIConfidence & { summary: string };
  notifications: NotificationPlan;
  workflow: WorkflowRecommendation;
  communityInsight: CommunityInsight;
  heatmapInsight: HeatmapInsight;
  modelUsed: string;
  analyzedAt: string;
};

export type AuthorityBrief = AIConfidence & {
  summary: string;
  criticalIssues: string[];
  duplicateClusters: string[];
  recommendedActions: string[];
  highestPriorityAreas: string[];
  departmentsUnderPressure: string[];
  urgentEscalations: string[];
  suggestedWorkOrder: string[];
};
