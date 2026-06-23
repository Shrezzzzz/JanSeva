import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORIZE_PROMPT = `
You are JanSeva AI, a civic issue analyzer for Indian cities.
Given an image or description of a public infrastructure problem,
respond ONLY with a valid JSON object:
{
  "category": one of [Pothole, Streetlight, WaterLeak, WasteDump, Sewage, RoadDamage, ParkIssue, Other],
  "severity": one of [Low, Medium, High, Critical],
  "confidence": number between 0 and 1,
  "title": a short 5-8 word issue title,
  "estimatedResolutionDays": number,
  "department": the municipal department responsible
}
Do not include any text outside the JSON.`.trim();

const INSIGHTS_PROMPT = `
You are a civic data analyst for JanSeva.
Given aggregated issue statistics, generate exactly 3 actionable insights for municipal authorities.
Respond ONLY with JSON: { "insights": [{ "title": string, "description": string, "icon": emoji, "priority": "High"|"Medium"|"Low" }] }
`.trim();

const SENTIMENT_PROMPT = `
Analyze the citizen's comment on a civic issue report.
Respond ONLY with JSON: { "sentiment": "Positive"|"Neutral"|"Frustrated"|"Urgent", "escalate": boolean }
`.trim();

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T;
  } catch {
    return null;
  }
}

export async function categorizeIssue(description: string) {
  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: CATEGORIZE_PROMPT },
      { role: 'user',   content: description },
    ],
    temperature: 0.2,
    max_tokens:  300,
  });
  return safeParse(chat.choices[0]?.message?.content ?? '');
}

export async function generateInsights(statsJson: string) {
  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: INSIGHTS_PROMPT },
      { role: 'user',   content: `City issue statistics:\n${statsJson}` },
    ],
    temperature: 0.4,
    max_tokens:  600,
  });
  const parsed = safeParse<{ insights: unknown[] }>(chat.choices[0]?.message?.content ?? '');
  return parsed?.insights ?? [];
}

export async function analyzeSentiment(comment: string) {
  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SENTIMENT_PROMPT },
      { role: 'user',   content: comment },
    ],
    temperature: 0.1,
    max_tokens:  100,
  });
  return safeParse(chat.choices[0]?.message?.content ?? '');
}

export async function checkDuplicate(
  newIssue: { title: string; category: string; description?: string },
  nearbyIssues: { id: string; title: string; category: string }[],
) {
  if (!nearbyIssues.length) return { isDuplicate: false, duplicateId: null, confidence: 0 };
  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a civic issue deduplication assistant. Respond ONLY with JSON: { "isDuplicate": boolean, "duplicateId": string | null, "confidence": number }' },
      { role: 'user',   content: `New: ${JSON.stringify(newIssue)}\nNearby: ${JSON.stringify(nearbyIssues)}` },
    ],
    temperature: 0.1,
    max_tokens:  100,
  });
  return safeParse(chat.choices[0]?.message?.content ?? '');
}
