import { useState, useCallback } from 'react';
import { categorizeFromText, categorizeFromImage } from '../services/groq';
import { fileToBase64 } from '../services/uploadService';
import type { AICategorizationResult } from '../types/issue.types';

export function useGroqAI() {
  const [result,    setResult]  = useState<AICategorizationResult | null>(null);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState<string | null>(null);

  const analyzeText = useCallback(async (text: string) => {
    setLoading(true); setError(null);
    try {
      const r = await categorizeFromText(text);
      setResult(r);
      return r;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeImage = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    try {
      const b64 = await fileToBase64(file);
      const r   = await categorizeFromImage(b64, file.type);
      setResult(r);
      return r;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, loading, error, analyzeText, analyzeImage, reset };
}
