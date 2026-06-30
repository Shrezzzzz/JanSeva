# JanSeva Gemini Civic Intelligence

Gemini is used as the primary reasoning layer for autonomous civic decisions:

- Model: `GEMINI_MODEL` or `gemini-2.5-flash`
- API key: `GEMINI_API_KEY`
- Interface: Google Gemini REST `generateContent`
- Output mode: structured JSON via `responseMimeType: application/json`

Groq remains available for fast categorization and duplicate detection. Gemini consumes those fast outputs, adds reasoning, priority, summaries, recommendations, notification text, community insight, and heatmap intelligence, then persists nullable AI metadata on the existing `Issue` record.
