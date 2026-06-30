import api from './api';
import type { AICategorizationResult, DuplicateCheckResult } from '../types/issue.types';
import type { AIInsight } from '../types/api.types';

/** Categorize an issue from a text description */
export async function categorizeFromText(description: string): Promise<AICategorizationResult | null> {
  const res = await api.post('/ai/categorize', { description });
  return res.data.data;
}

/** Categorize from a base64 image */
export async function categorizeFromImage(base64: string, mimeType = 'image/jpeg'): Promise<AICategorizationResult | null> {
  const res = await api.post('/ai/categorize', { imageBase64: base64, mimeType });
  return res.data.data;
}

/** Check for duplicates */
export async function checkDuplicate(
  newIssue: { title: string; description?: string; category: string },
  nearbyIssues: { id: string; title: string; category: string }[],
): Promise<DuplicateCheckResult | null> {
  if (!nearbyIssues.length) return { isDuplicate: false, duplicateId: null, confidence: 0 };
  const sameCategory = nearbyIssues.find((issue) => issue.category === newIssue.category);
  return {
    isDuplicate: Boolean(sameCategory),
    duplicateId: sameCategory?.id ?? null,
    confidence: sameCategory ? 0.6 : 0.1,
  };
}

/** Generate predictive insights from aggregated stats */
export async function generateInsights(statsJson: string): Promise<AIInsight[]> {
  const res = await api.post('/ai/insights', { statsJson });
  return res.data.data?.insights ?? [];
}

/** Sentiment analysis on a comment */
export async function analyzeCommentSentiment(comment: string): Promise<{ sentiment: string; escalate: boolean } | null> {
  const res = await api.post('/ai/sentiment', { comment });
  return res.data.data;
}
