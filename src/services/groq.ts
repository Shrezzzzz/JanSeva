import { GROQ_CONFIG, CATEGORIZE_SYSTEM_PROMPT, INSIGHTS_PROMPT, SENTIMENT_PROMPT } from '../config/groqConfig';
import type { AICategorizationResult, DuplicateCheckResult } from '../types/issue.types';
import type { AIInsight } from '../types/api.types';

async function callGroq(messages: { role: string; content: unknown }[], model: string = GROQ_CONFIG.model): Promise<string> {
  const res = await fetch(`${GROQ_CONFIG.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_CONFIG.apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 512 }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

function safeParseJSON<T>(raw: string): T | null {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/** Categorize an issue from a text description */
export async function categorizeFromText(description: string): Promise<AICategorizationResult | null> {
  const messages = [
    { role: 'system', content: CATEGORIZE_SYSTEM_PROMPT },
    { role: 'user',   content: description },
  ];
  const raw = await callGroq(messages);
  return safeParseJSON<AICategorizationResult>(raw);
}

/** Categorize from a base64 image */
export async function categorizeFromImage(base64: string, mimeType = 'image/jpeg'): Promise<AICategorizationResult | null> {
  const messages = [
    { role: 'system', content: CATEGORIZE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this civic infrastructure image and categorize the issue.' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
    },
  ];
  const raw = await callGroq(messages, GROQ_CONFIG.visionModel);
  return safeParseJSON<AICategorizationResult>(raw);
}

/** Check for duplicates */
export async function checkDuplicate(
  newIssue: { title: string; description?: string; category: string },
  nearbyIssues: { id: string; title: string; category: string }[],
): Promise<DuplicateCheckResult | null> {
  if (!nearbyIssues.length) return { isDuplicate: false, duplicateId: null, confidence: 0 };
  const prompt = `New issue: ${JSON.stringify(newIssue)}\n\nNearby issues: ${JSON.stringify(nearbyIssues)}`;
  const messages = [
    { role: 'system', content: 'You are a civic issue deduplication assistant. Respond ONLY with JSON: { "isDuplicate": boolean, "duplicateId": string | null, "confidence": number }' },
    { role: 'user',   content: prompt },
  ];
  const raw = await callGroq(messages);
  return safeParseJSON<DuplicateCheckResult>(raw);
}

/** Generate predictive insights from aggregated stats */
export async function generateInsights(statsJson: string): Promise<AIInsight[]> {
  const messages = [
    { role: 'system', content: INSIGHTS_PROMPT },
    { role: 'user',   content: `City issue statistics:\n${statsJson}` },
  ];
  const raw = await callGroq(messages);
  const parsed = safeParseJSON<{ insights: AIInsight[] }>(raw);
  return parsed?.insights ?? [];
}

/** Sentiment analysis on a comment */
export async function analyzeCommentSentiment(comment: string): Promise<{ sentiment: string; escalate: boolean } | null> {
  const messages = [
    { role: 'system', content: SENTIMENT_PROMPT },
    { role: 'user',   content: comment },
  ];
  const raw = await callGroq(messages);
  return safeParseJSON(raw);
}
