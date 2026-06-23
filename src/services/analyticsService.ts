import api from './api';
import type { AnalyticsSummary, AIInsight } from '../types/api.types';
import type { ApiResponse } from '../types/api.types';

export async function fetchAnalyticsSummary(range: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsSummary> {
  const res = await api.get<ApiResponse<AnalyticsSummary>>(`/analytics/summary?range=${range}`);
  return res.data.data;
}

export async function fetchAIInsights(): Promise<AIInsight[]> {
  const res = await api.get<ApiResponse<{ insights: AIInsight[] }>>('/analytics/insights');
  return res.data.data.insights;
}

export async function fetchLeaderboard(period: 'all' | 'month' | 'ward', ward?: string) {
  const params = new URLSearchParams({ period });
  if (ward) params.set('ward', ward);
  const res = await api.get(`/analytics/leaderboard?${params}`);
  return res.data.data;
}
