import { formatDistanceToNow, format, parseISO, differenceInDays } from 'date-fns';
import type { Severity, IssueStatus } from '../types/issue.types';

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function formatDate(dateStr: string, pattern = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), pattern);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a');
}

export function daysSince(dateStr: string): number {
  try {
    return differenceInDays(new Date(), parseISO(dateStr));
  } catch {
    return 0;
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function severityColor(s: Severity): string {
  const map: Record<Severity, string> = {
    Low: 'text-green-600 bg-green-50',
    Medium: 'text-amber-600 bg-amber-50',
    High: 'text-orange-600 bg-orange-50',
    Critical: 'text-red-600 bg-red-50',
  };
  return map[s];
}

export function statusColor(s: IssueStatus): string {
  const map: Record<IssueStatus, string> = {
    Reported:          'text-gray-600 bg-gray-100',
    Verified:          'text-blue-600 bg-blue-50',
    Assigned:          'text-amber-600 bg-amber-50',
    Accepted:          'text-purple-600 bg-purple-50',
    InProgress:        'text-orange-600 bg-orange-50',
    Completed:         'text-cyan-600 bg-cyan-50',
    NeedsVerification: 'text-orange-700 bg-orange-100',
    Rejected:          'text-red-600 bg-red-50',
    Resolved:          'text-green-600 bg-green-50',
    Closed:            'text-gray-500 bg-gray-100',
  };
  return map[s];
}

export function issueIdDisplay(id: string): string {
  // e.g. clxyz123 → #JS-CLXYZ123
  return `#JS-${id.slice(0, 8).toUpperCase()}`;
}

export function truncate(str: string, max = 100): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function gradeColor(grade: 'A' | 'B' | 'C' | 'D'): string {
  return { A: 'text-green-600 bg-green-50', B: 'text-blue-600 bg-blue-50', C: 'text-amber-600 bg-amber-50', D: 'text-red-600 bg-red-50' }[grade];
}
