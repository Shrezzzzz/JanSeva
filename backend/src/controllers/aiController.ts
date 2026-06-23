import type { Request, Response } from 'express';
import { categorizeIssue, generateInsights, analyzeSentiment } from '../services/groqService';

export async function categorize(req: Request, res: Response) {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ success: false, error: 'description required' });
    const result = await categorizeIssue(description);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, error: 'AI categorization failed' });
  }
}

export async function getInsights(req: Request, res: Response) {
  try {
    const { statsJson } = req.body;
    const insights = await generateInsights(statsJson ?? '{}');
    return res.json({ success: true, data: { insights } });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to generate insights' });
  }
}

export async function sentiment(req: Request, res: Response) {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ success: false, error: 'comment required' });
    const result = await analyzeSentiment(comment);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, error: 'Sentiment analysis failed' });
  }
}
