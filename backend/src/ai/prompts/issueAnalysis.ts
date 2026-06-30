import type { IssueAnalysisInput, AutonomousIssueAnalysis } from '../types';

export function buildIssueAnalysisPrompt(input: IssueAnalysisInput, fallback: AutonomousIssueAnalysis) {
  return `
You are JanSeva Gemini Civic Intelligence, an autonomous municipal operations planner for Indian cities.
Analyze the report and return ONLY valid JSON matching this exact object shape:
${JSON.stringify(fallback, null, 2)}

Rules:
- Keep authoritySummary.summary under 120 words.
- priority.score must be 0-100.
- Every nested object must include reason, confidence, timestamp, and modelUsed.
- Use practical civic operations language, not marketing language.
- Infer schools/hospitals/traffic/population impact from address, zone, severity, duplicates, category, and history only; do not invent exact names.
- If duplicate evidence is weak, set duplicate.isDuplicate=false.
- Use the existing category enum values only.

Report:
${JSON.stringify(input.issue)}

Fast Groq categorization, if available:
${JSON.stringify(input.groqCategory ?? null)}

Nearby reports:
${JSON.stringify(input.nearbyIssues)}

Historical context:
${JSON.stringify(input.historicalIssues)}
`.trim();
}
