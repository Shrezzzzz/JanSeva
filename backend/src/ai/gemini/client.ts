import { safeParseJSON } from '../utils/json';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export function getGeminiModel() {
  return DEFAULT_MODEL;
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
}

type GeminiOptions = {
  timeoutMs?: number;
};

export async function generateGeminiJSON<T>(prompt: string, fallback: T, options: GeminiOptions = {}): Promise<T> {
  if (!isGeminiConfigured()) return fallback;

  const controller = options.timeoutMs ? new AbortController() : undefined;
  const timeout = controller && options.timeoutMs
    ? setTimeout(() => controller.abort(), options.timeoutMs)
    : undefined;

  const url = `${BASE_URL}/${DEFAULT_MODEL}:generateContent`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY as string,
      },
      signal: controller?.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[Gemini] API error ${response.status}: ${errBody}`.trim());
      return fallback;
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    return safeParseJSON<T>(text) ?? fallback;
  } catch (error) {
    // Catch network errors, AbortError (timeout), parse errors — always return
    // fallback so callers are never broken by a Gemini outage.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[Gemini] Request failed (returning fallback): ${reason}`);
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}