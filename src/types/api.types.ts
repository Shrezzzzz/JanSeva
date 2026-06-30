export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  ward?: string;
}

export interface AuthResponse {
  token: string;
  user: import('./user.types').AuthUser;
}

export interface UploadResponse {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
}

export interface AnalyticsSummary {
  totalIssues: number;
  activeIssues: number;
  resolvedIssues: number;
  resolutionRate: number;
  avgResolutionDays: number;
  activeContributors: number;
  trends: {
    issues: TrendPoint[];
    resolved: TrendPoint[];
  };
  byCategory: CategoryStat[];
  severityDistribution: SeverityStat[];
  byZone: ZoneStat[];
  wardDistribution: ZoneStat[];
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  resolved: number;
  color: string;
}

export interface SeverityStat {
  severity: string;
  count: number;
}

export interface ZoneStat {
  zone: string;
  reported: number;
  resolved: number;
  avgDays: number;
  responseRate: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export interface AIInsight {
  title: string;
  description: string;
  icon: string;
  priority: 'High' | 'Medium' | 'Low';
}
