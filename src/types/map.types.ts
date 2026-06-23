import type { Category, IssueStatus, Severity } from './issue.types';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

export interface IssueMarkerData {
  id: string;
  title: string;
  category: Category;
  status: IssueStatus;
  severity: Severity;
  lat: number;
  lng: number;
  upvotes: number;
  createdAt: string;
}

export interface ClusterData {
  id: string;
  lat: number;
  lng: number;
  count: number;
  dominantCategory: Category;
  markers: IssueMarkerData[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface MapFilter {
  categories: Category[];
  statuses: IssueStatus[];
  severities: Severity[];
  dateRange: '7d' | '30d' | '90d' | 'all';
  showHeatmap: boolean;
  showClusters: boolean;
}

export interface GeocodedAddress {
  displayName: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string;
  ward?: string;
}
