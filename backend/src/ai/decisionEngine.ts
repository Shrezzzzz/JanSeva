import { PrismaClient, type Category, type Issue, type Severity } from '@prisma/client';
import { checkDuplicate, categorizeIssue } from '../services/groqService';
import { logger } from '../utils/logger';
import { getGeminiModel, generateGeminiJSON } from './gemini/client';
import { buildIssueAnalysisPrompt } from './prompts/issueAnalysis';
import { calculatePriority } from './priorityEngine';
import { fallbackAuthoritySummary, fallbackCitizenGuidance } from './summaryEngine';
import { buildNotifications } from './notificationEngine';
import { recommendWorkflow } from './workflowEngine';
import { generateCommunityInsight } from './communityInsightEngine';
import { generateHeatmapInsight } from './heatmapEngine';
import { nowIso } from './utils/json';
import type { AutonomousIssueAnalysis, IssueAnalysisInput, ResolutionEstimate } from './types';
import { resolveAuthorityAssignment } from '../services/authorityAssignmentService';

const prisma = new PrismaClient();

const departmentByCategory: Record<Category, string> = {
  Pothole: 'Road Maintenance Department',
  Streetlight: 'Electrical Department',
  WaterLeak: 'Water Supply Department',
  WasteDump: 'Sanitation Department',
  Sewage: 'Drainage & Sewerage Department',
  RoadDamage: 'Road Maintenance Department',
  ParkIssue: 'Parks & Recreation Department',
  Other: 'Municipal Operations Cell',
};

const resolutionBySeverity: Record<Severity, number> = {
  Low: 7,
  Medium: 5,
  High: 3,
  Critical: 1,
};

const severityValues: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

function normalizeSeverity(value: string | undefined, fallback: Severity): Severity {
  return severityValues.includes(value as Severity) ? value as Severity : fallback;
}

function limitWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? text.trim() : `${words.slice(0, maxWords).join(' ')}.`;
}

type GroqCategoryResult = NonNullable<IssueAnalysisInput['groqCategory']>;

type GroqDuplicateResult = {
  isDuplicate?: boolean;
  duplicateId?: string | null;
  confidence?: number;
};

function buildFallback(input: IssueAnalysisInput): AutonomousIssueAnalysis {
  const { issue, nearbyIssues, historicalIssues, groqCategory } = input;
  const department = groqCategory?.department || issue.department || departmentByCategory[issue.category];
  const resolution: ResolutionEstimate = {
    estimatedDays: groqCategory?.estimatedResolutionDays || issue.estimatedResolutionDays || resolutionBySeverity[issue.severity],
    confidence: 0.69,
    reason: 'Estimate uses severity, category, and existing Groq resolution signal when present.',
    timestamp: nowIso(),
    modelUsed: 'fallback-resolution-engine',
  };
  const priority = calculatePriority({
    issue,
    nearbyDuplicateCount: nearbyIssues.filter((item) => item.category === issue.category).length,
    historicalDensity: historicalIssues.filter((item) => item.zone === issue.zone || item.category === issue.category).length,
    imageConfidence: issue.aiConfidence,
  });
  const duplicateCandidate = nearbyIssues.find((item) => item.category === issue.category);
  const duplicateConfidence = duplicateCandidate ? 0.64 : 0.1;
  const duplicate = {
    isDuplicate: false,
    duplicateId: null,
    confidence: duplicateConfidence,
    reason: duplicateCandidate ? 'A similar nearby issue exists but confidence is below merge threshold.' : 'No strong nearby duplicate candidate found.',
    timestamp: nowIso(),
    modelUsed: 'fallback-duplicate-engine',
  };

  return {
    issueId: issue.id,
    imageAnalysis: {
      confidenceLabel: issue.mediaUrls.length ? 'Image evidence attached' : 'No image evidence',
      confidence: issue.aiConfidence ?? (issue.mediaUrls.length ? 0.65 : 0.35),
      reason: issue.mediaUrls.length ? 'Report includes media evidence for civic review.' : 'No uploaded media was available for visual confidence.',
      timestamp: nowIso(),
      modelUsed: 'fallback-image-analysis',
    },
    category: {
      value: groqCategory?.category || issue.aiCategory || issue.category,
      confidence: groqCategory?.confidence ?? issue.aiConfidence ?? 0.7,
      reason: 'Category combines submitted category and fast Groq categorization when available.',
      timestamp: nowIso(),
      modelUsed: groqCategory ? 'groq+fallback' : 'fallback-category-engine',
    },
    severity: {
      value: (groqCategory?.severity as Severity | undefined) || issue.aiSeverity as Severity || issue.severity,
      confidence: groqCategory?.confidence ?? 0.68,
      reason: 'Severity is derived from citizen input and fast AI signal.',
      timestamp: nowIso(),
      modelUsed: groqCategory ? 'groq+fallback' : 'fallback-severity-engine',
    },
    department: {
      department,
      confidence: 0.74,
      reason: `Department selected from ${issue.category} civic ownership.`,
      timestamp: nowIso(),
      modelUsed: 'fallback-department-engine',
    },
    duplicate,
    resolution,
    priority,
    citizenGuidance: fallbackCitizenGuidance(issue, priority.label),
    authoritySummary: fallbackAuthoritySummary(issue, department, resolution),
    notifications: buildNotifications(issue, priority.label, department, resolution.estimatedDays),
    workflow: recommendWorkflow(issue, priority.score, department, false),
    communityInsight: generateCommunityInsight(issue, historicalIssues),
    heatmapInsight: generateHeatmapInsight(issue, nearbyIssues),
    modelUsed: 'fallback-autonomous-civic-engine',
    analyzedAt: nowIso(),
  };
}

export async function analyzeIssue(issueId: string): Promise<AutonomousIssueAnalysis | null> {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return null;

  const [nearbyIssues, historicalIssues, groqCategory] = await Promise.all([
    prisma.issue.findMany({
      where: {
        id: { not: issue.id },
        latitude: { gte: issue.latitude - 0.01, lte: issue.latitude + 0.01 },
        longitude: { gte: issue.longitude - 0.01, lte: issue.longitude + 0.01 },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.issue.findMany({
      where: {
        id: { not: issue.id },
        OR: [{ zone: issue.zone || undefined }, { category: issue.category }],
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    }),
    process.env.GROQ_API_KEY
      ? categorizeIssue(`${issue.title}\n${issue.description ?? ''}\n${issue.address ?? ''}`).then((result) => result as GroqCategoryResult | null).catch(() => null)
      : Promise.resolve(null),
  ]);

  const input: IssueAnalysisInput = { issue, nearbyIssues, historicalIssues, groqCategory };
  const fallback = buildFallback(input);

  const groqDuplicate = process.env.GROQ_API_KEY
    ? await checkDuplicate(
        { title: issue.title, description: issue.description ?? undefined, category: issue.category },
        nearbyIssues.map((item) => ({ id: item.id, title: item.title, category: item.category })),
      ).then((result) => result as GroqDuplicateResult | null).catch(() => null)
    : null;

  if (groqDuplicate?.isDuplicate) {
    fallback.duplicate = {
      isDuplicate: true,
      duplicateId: groqDuplicate.duplicateId ?? null,
      confidence: groqDuplicate.confidence ?? 0,
      reason: 'Groq duplicate detection found a likely existing nearby report.',
      timestamp: nowIso(),
      modelUsed: 'groq-duplicate-detector',
    };
  }

  let analysis = fallback;
  try {
    const geminiAnalysis = await generateGeminiJSON<AutonomousIssueAnalysis>(
      buildIssueAnalysisPrompt(input, fallback),
      fallback,
    );
    analysis = {
      ...fallback,
      ...geminiAnalysis,
      severity: {
        ...fallback.severity,
        ...geminiAnalysis.severity,
        value: normalizeSeverity(geminiAnalysis.severity?.value, fallback.severity.value),
      },
      authoritySummary: {
        ...fallback.authoritySummary,
        ...geminiAnalysis.authoritySummary,
        summary: limitWords(geminiAnalysis.authoritySummary?.summary || fallback.authoritySummary.summary, 120),
      },
      priority: {
        ...fallback.priority,
        ...geminiAnalysis.priority,
        score: Math.min(Math.max(Number(geminiAnalysis.priority?.score ?? fallback.priority.score), 0), 100),
      },
    };
  } catch (error) {
    logger.error('Gemini issue analysis failed, using fallback', error);
  }

  const duplicateOf = analysis.duplicate.isDuplicate && analysis.duplicate.confidence >= 0.8
    ? analysis.duplicate.duplicateId
    : null;

  const authorityUsers = await prisma.user.findMany({
    where: { role: { in: ['Authority', 'Admin'] } },
    select: { id: true, name: true, email: true, role: true, ward: true },
  });
  const assignment = resolveAuthorityAssignment({
    category: analysis.category.value as Category,
    department: analysis.department.department,
    zone: issue.zone,
  }, authorityUsers);

  await prisma.issue.update({
    where: { id: issue.id },
    data: {
      aiCategory: analysis.category.value,
      aiConfidence: analysis.category.confidence,
      aiSeverity: analysis.severity.value,
      severity: analysis.severity.value,
      estimatedResolutionDays: analysis.resolution.estimatedDays,
      resolutionConfidence: analysis.resolution.confidence,
      resolutionReason: analysis.resolution.reason,
      department: assignment.department,
      departmentConfidence: analysis.department.confidence,
      departmentReason: analysis.department.reason,
      assignedTo: assignment.assignedTo,
      duplicateOf,
      duplicateConfidence: analysis.duplicate.confidence,
      priorityScore: analysis.priority.score,
      priorityLabel: analysis.priority.label,
      priorityReason: analysis.priority.reason,
      citizenGuidance: analysis.citizenGuidance,
      authoritySummary: analysis.authoritySummary.summary,
      aiNotifications: analysis.notifications,
      workflowRecommendation: analysis.workflow,
      communityInsight: analysis.communityInsight,
      heatmapInsight: analysis.heatmapInsight,
      aiModelUsed: analysis.modelUsed || getGeminiModel(),
      aiAnalyzedAt: new Date(analysis.analyzedAt || Date.now()),
      aiFailureReason: null,
    },
  });

  if (issue.reporterId) {
    await prisma.notification.create({
      data: {
        userId: issue.reporterId,
        title: analysis.notifications.citizen.title,
        message: analysis.notifications.citizen.message,
        issueId: issue.id,
        type: 'ai_issue_update',
      },
    }).catch((error) => logger.error('Failed to persist AI citizen notification', error));
  }

  return analysis;
}

export function analyzeIssueInBackground(issueId: string) {
  void analyzeIssue(issueId).catch(async (error) => {
    logger.error(`Autonomous AI analysis failed for issue ${issueId}`, error);
    await prisma.issue.update({
      where: { id: issueId },
      data: { aiFailureReason: error instanceof Error ? error.message : 'AI analysis failed' },
    }).catch(() => null);
  });
}
