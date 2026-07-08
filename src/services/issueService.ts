import api from './api';
import type { Issue, IssueFilters } from '../types/issue.types';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

export interface CreateIssuePayload {
  title: string;
  description?: string;
  category: string;
  severity: string;
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
  mediaUrls: string[];
  isAnonymous: boolean;
  aiCategory?: string;
  aiConfidence?: number;
  aiSeverity?: string;
  estimatedResolutionDays?: number;
  department?: string;
}

export async function fetchIssues(
  filters?: Partial<IssueFilters>,
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<Issue>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (filters?.categories?.length) params.set('categories', filters.categories.join(','));
  if (filters?.statuses?.length)   params.set('statuses',   filters.statuses.join(','));
  if (filters?.severities?.length) params.set('severities', filters.severities.join(','));
  if (filters?.dateRange)          params.set('dateRange',  filters.dateRange);
  if (filters?.zone)               params.set('zone',       filters.zone);
  if (filters?.searchQuery)        params.set('q',          filters.searchQuery);
  const res = await api.get<PaginatedResponse<Issue>>(`/issues?${params}`);
  return res.data;
}

export async function fetchIssueById(id: string): Promise<Issue> {
  const res = await api.get<ApiResponse<Issue>>(`/issues/${id}`);
  return res.data.data;
}

export async function createIssue(payload: CreateIssuePayload): Promise<Issue> {
  const res = await api.post<ApiResponse<Issue>>('/issues', payload);
  return res.data.data;
}

export async function updateIssueStatus(id: string, status: string, note?: string): Promise<Issue> {
  const res = await api.patch<ApiResponse<Issue>>(`/issues/${id}/status`, { status, note });
  return res.data.data;
}

export async function upvoteIssue(id: string): Promise<{ upvotes: number }> {
  try {
    const res = await api.post<ApiResponse<{ upvotes: number }>>(`/issues/${id}/upvote`);
    return res.data.data;
  } catch (err) {
    // Re-throw with the friendly message already set by the api interceptor so
    // callers (e.g. useUpvote) can show it directly.
    throw err;
  }
}

export async function followIssue(id: string): Promise<{ following: boolean; followers: number }> {
  const res = await api.post<ApiResponse<{ following: boolean; followers: number }>>(`/issues/${id}/follow`);
  return res.data.data;
}

export async function joinDuplicateIssue(id: string): Promise<Issue> {
  const res = await api.post<ApiResponse<Issue>>(`/issues/${id}/join-duplicate`);
  return res.data.data;
}

export async function addComment(issueId: string, content: string): Promise<import('../types/issue.types').Comment> {
  const res = await api.post<ApiResponse<import('../types/issue.types').Comment>>(`/issues/${issueId}/comments`, { content });
  return res.data.data;
}

export async function fetchNearbyIssues(lat: number, lng: number, radiusM = 200): Promise<Issue[]> {
  const res = await api.get<ApiResponse<Issue[]>>(`/issues/nearby?lat=${lat}&lng=${lng}&radius=${radiusM}`);
  return res.data.data;
}

export async function fetchIssuesForMap(bounds: { north: number; south: number; east: number; west: number }): Promise<Issue[]> {
  const { north, south, east, west } = bounds;
  const res = await api.get<ApiResponse<Issue[]>>(`/issues/map?north=${north}&south=${south}&east=${east}&west=${west}`);
  return res.data.data;
}

export async function updateIssue(
  id: string,
  payload: { description?: string; severity?: string; mediaUrls?: string[] },
): Promise<Issue> {
  const res = await api.patch<ApiResponse<Issue>>(`/issues/${id}`, payload);
  return res.data.data;
}

export async function deleteIssue(id: string): Promise<void> {
  await api.delete(`/issues/${id}`);
}
