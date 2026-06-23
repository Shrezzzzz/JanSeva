import env from './env';

export const GROQ_CONFIG = {
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'llama-3.3-70b-versatile',
  visionModel: 'llama-3.2-11b-vision-preview',
  apiKey: env.GROQ_API_KEY,
} as const;

export const CATEGORIZE_SYSTEM_PROMPT = `
You are JanSeva AI, a civic issue analyzer for Indian cities.
Given an image or description of a public infrastructure problem,
respond ONLY with a valid JSON object in this format:
{
  "category": one of [Pothole, Streetlight, WaterLeak, WasteDump, Sewage, RoadDamage, ParkIssue, Other],
  "severity": one of [Low, Medium, High, Critical],
  "confidence": number between 0 and 1,
  "title": a short 5-8 word issue title,
  "estimatedResolutionDays": number,
  "department": the municipal department responsible
}
Do not include any explanation or text outside the JSON.
`.trim();

export const DUPLICATE_PROMPT = `
You are a civic issue deduplication assistant.
Given a new issue and a list of existing nearby issues, determine if the new issue
is likely a duplicate of any existing issue.
Respond ONLY with JSON: { "isDuplicate": boolean, "duplicateId": string | null, "confidence": number }
`.trim();

export const INSIGHTS_PROMPT = `
You are a civic data analyst for JanSeva.
Given the following aggregated issue statistics for a city, generate exactly 3
actionable insights that would help municipal authorities prioritize work.
Each insight must include a specific zone or category, a data-backed observation,
and a recommended action.
Respond ONLY with JSON: { "insights": [{ "title": string, "description": string, "icon": emoji, "priority": "High"|"Medium"|"Low" }] }
`.trim();

export const SENTIMENT_PROMPT = `
Analyze the citizen's comment on a civic issue report.
Respond ONLY with JSON: { "sentiment": "Positive"|"Neutral"|"Frustrated"|"Urgent", "escalate": boolean }
If escalate=true, the system will auto-notify the assigned authority.
`.trim();
