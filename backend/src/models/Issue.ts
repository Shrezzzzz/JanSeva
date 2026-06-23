// Type definitions mirroring the Prisma schema for use in controllers.
// The actual DB model is defined in backend/prisma/schema.prisma.

export type Category   = 'Pothole' | 'Streetlight' | 'WaterLeak' | 'WasteDump' | 'Sewage' | 'RoadDamage' | 'ParkIssue' | 'Other';
export type Severity   = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Reported' | 'Verified' | 'Assigned' | 'InProgress' | 'Resolved' | 'Closed';

export interface IssueCreateInput {
  title: string;
  description?: string;
  category: Category;
  severity?: Severity;
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
  mediaUrls?: string[];
  isAnonymous?: boolean;
  reporterId?: string;
  aiCategory?: string;
  aiConfidence?: number;
  aiSeverity?: string;
  estimatedResolutionDays?: number;
  department?: string;
}

export interface IssueUpdateInput {
  status?: IssueStatus;
  severity?: Severity;
  department?: string;
  note?: string;
}
