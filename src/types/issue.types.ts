export type Category =
  | 'Pothole'
  | 'Streetlight'
  | 'WaterLeak'
  | 'WasteDump'
  | 'Sewage'
  | 'RoadDamage'
  | 'ParkIssue'
  | 'Other';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus =
  | 'Reported'
  | 'Verified'
  | 'Assigned'
  | 'InProgress'
  | 'Resolved'
  | 'Closed';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TimelineEvent {
  id: string;
  issueId: string;
  event: string;
  actor: string;
  actorRole: 'Citizen' | 'Moderator' | 'Authority' | 'Admin';
  note?: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Frustrated' | 'Urgent';
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  category: Category;
  severity: Severity;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
  mediaUrls: string[];
  isAnonymous: boolean;
  reporterId?: string;
  reporterName?: string;
  reporterAvatar?: string;
  upvotes: number;
  verifiedBy: string[];
  duplicateOf?: string;
  aiCategory?: string;
  aiConfidence?: number;
  aiSeverity?: string;
  estimatedResolutionDays?: number;
  department?: string;
  comments?: Comment[];
  timeline?: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueFilters {
  categories: Category[];
  statuses: IssueStatus[];
  severities: Severity[];
  dateRange: '7d' | '30d' | '90d' | 'all';
  zone?: string;
  searchQuery?: string;
}

export interface AICategorizationResult {
  category: Category;
  severity: Severity;
  confidence: number;
  title: string;
  estimatedResolutionDays: number;
  department: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateId: string | null;
  confidence: number;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Pothole: '#DC2626',
  Streetlight: '#F59E0B',
  WaterLeak: '#0284C7',
  WasteDump: '#65A30D',
  Sewage: '#7C3AED',
  RoadDamage: '#EA580C',
  ParkIssue: '#16A34A',
  Other: '#6F6F6F',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Pothole:    '🕳️',
  Streetlight: '💡',
  WaterLeak:  '🚰',
  WasteDump:  '🗑️',
  Sewage:     '🪣',
  RoadDamage: '🚧',
  ParkIssue:  '🌳',
  Other:      '📍',
};

export const STATUS_COLORS: Record<IssueStatus, string> = {
  Reported: '#9CA3AF',
  Verified: '#0284C7',
  Assigned: '#D97706',
  InProgress: '#F59E0B',
  Resolved: '#1A6B3C',
  Closed: '#6B7280',
};
