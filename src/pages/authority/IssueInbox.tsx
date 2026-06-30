import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Shield, Eye, CheckCircle2, UserPlus, Filter, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { getDepartmentForCategory, DEPARTMENTS } from '../../config/departments';
import { CATEGORY_LABELS } from '../../utils/constants';
import { CATEGORY_ICONS, STATUS_COLORS } from '../../types/issue.types';
import type { Category, Issue, IssueStatus, Severity } from '../../types/issue.types';
import { timeAgo } from '../../utils/formatters';
import IssueDetailPanel from './IssueDetailPanel';

// ── Role helpers (mirrors IssueDetailPanel / backend) ────────────────────────

const DEPT_EMAILS = new Set(DEPARTMENTS.map((d) => d.defaultAssignee));

function isCityAdmin(role: string, ward?: string | null) {
  return role === 'Admin' || ward === 'City-Wide';
}
function isDeptOfficer(role: string, email: string) {
  return role === 'Authority' && DEPT_EMAILS.has(email);
}
function isWardOfficer(role: string, email: string, ward?: string | null) {
  return (
    role === 'Authority' &&
    !DEPT_EMAILS.has(email) &&
    Boolean(ward && ward !== 'All' && ward !== 'City-Wide')
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, string> = {
  Low:      '#16A34A',
  Medium:   '#D97706',
  High:     '#EA580C',
  Critical: '#DC2626',
};

// All statuses in lifecycle order with human-readable labels
const ALL_STATUSES: Array<{ value: IssueStatus; label: string }> = [
  { value: 'Reported',          label: 'Reported' },
  { value: 'Verified',          label: 'Verified' },
  { value: 'Assigned',          label: 'Assigned' },
  { value: 'Accepted',          label: 'Accepted' },
  { value: 'InProgress',        label: 'In Progress' },
  { value: 'Completed',         label: 'Completed' },
  { value: 'NeedsVerification', label: 'Needs Verification' },
  { value: 'Rejected',          label: 'Rejected' },
  { value: 'Resolved',          label: 'Resolved' },
  { value: 'Closed',            label: 'Closed' },
];

const SELECT_STYLE = {
  backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236F6F6F%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '1em 1em',
};

const SELECT_CLS =
  'h-[42px] w-[175px] px-3.5 text-sm rounded-[12px] border border-[#E5E7EB] bg-white text-[#0D0D0B] focus:border-[#1A6B3C] focus:ring-1 focus:ring-[#1A6B3C] hover:border-[#1A6B3C]/50 outline-none appearance-none cursor-pointer transition-colors duration-200';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IssueInboxProps {
  myCasesOnly?: boolean;
  groupByZone?: boolean;
}

type AuthorityIssue = Issue & {
  assignedTo?: string | null;
  slaHours?: number;
  slaBreached?: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function IssueInbox({ myCasesOnly = false, groupByZone = false }: IssueInboxProps) {
  const { user } = useAuth();

  // Derive role once
  const role  = user?.role  ?? '';
  const email = user?.email ?? '';
  const ward  = user?.ward  ?? null;
  const isAdmin = isCityAdmin(role, ward);
  const isDept  = !isAdmin && isDeptOfficer(role, email);
  const isWard  = !isAdmin && !isDept && isWardOfficer(role, email, ward);

  const [issues,          setIssues]          = useState<AuthorityIssue[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedIds,     setSelectedIds]     = useState<string[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Filters — ward officers don't need a ward filter (backend scopes it)
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterWard,     setFilterWard]     = useState(
    !isWard && user?.ward && user.ward !== 'All' ? user.ward : '',
  );

  // Sort
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc,   setSortAsc]   = useState(false);

  // Collapsed zones
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus)   params.append('status',   filterStatus);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterWard)     params.append('ward',     filterWard);
      params.append('scope', myCasesOnly ? 'my_cases' : 'inbox');

      const res = await api.get(`/authority/issues?${params.toString()}`);
      if (res.data.success) setIssues(res.data.data as AuthorityIssue[]);
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterSeverity, filterStatus, filterWard, myCasesOnly]);

  useEffect(() => { void fetchIssues(); }, [fetchIssues]);

  // ── Sort ──────────────────────────────────────────────────────────────────

  const toggleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const va = sortField === 'createdAt'
      ? new Date(a.createdAt).getTime()
      : String(a[sortField as keyof AuthorityIssue] ?? '');
    const vb = sortField === 'createdAt'
      ? new Date(b.createdAt).getTime()
      : String(b[sortField as keyof AuthorityIssue] ?? '');
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  // ── Group by zone ─────────────────────────────────────────────────────────

  const groupedByZone: Record<string, AuthorityIssue[]> = {};
  if (groupByZone) {
    sortedIssues.forEach((issue) => {
      const z = issue.zone || 'Unassigned Zone';
      groupedByZone[z] = groupedByZone[z] ?? [];
      groupedByZone[z].push(issue);
    });
  }

  // ── Bulk actions (City Admin only) ────────────────────────────────────────

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? sortedIssues.map((i) => i.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  const handleBulkVerify = async () => {
    await Promise.all(selectedIds.map((id) => api.patch(`/issues/${id}/status`, { status: 'Verified' })));
    setSelectedIds([]);
    void fetchIssues();
  };

  const handleBulkClose = async () => {
    await Promise.all(selectedIds.map((id) => api.patch(`/issues/${id}/status`, { status: 'Closed' })));
    setSelectedIds([]);
    void fetchIssues();
  };

  // ── Quick actions (City Admin only) ──────────────────────────────────────

  const handleQuickVerify = async (id: string) => {
    try {
      await api.patch(`/issues/${id}/status`, { status: 'Verified' });
      void fetchIssues();
    } catch (err) { console.error(err); }
  };

  const handleQuickAssign = async (id: string, category: string) => {
    try {
      const dept = getDepartmentForCategory(category);
      await api.patch(`/issues/${id}/assign`, {
        department: dept.name,
        assignedTo: dept.defaultAssignee,
        note: 'Quick-assigned via Inbox',
      });
      void fetchIssues();
    } catch (err) { console.error(err); }
  };

  // ── SLA badge ─────────────────────────────────────────────────────────────

  const renderSlaBadge = (hours: number) => {
    if (hours < 24)  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">&lt;24h</span>;
    if (hours <= 72) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">24–72h</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">72h+ 🔴</span>;
  };

  // ── Row renderer ──────────────────────────────────────────────────────────

  const renderRow = (issue: AuthorityIssue) => {
    const isSelected = selectedIds.includes(issue.id);
    const statusColor = STATUS_COLORS[issue.status as IssueStatus] ?? '#9CA3AF';

    return (
      <tr key={issue.id}
        className="hover:bg-[#F7F7F5] group transition-colors border-b border-[#E5E5E0] cursor-pointer"
        onClick={() => setSelectedIssueId(issue.id)}>
        {/* Checkbox — only for admins who can bulk-act */}
        <td className="p-4" onClick={(e) => e.stopPropagation()}>
          {isAdmin ? (
            <input type="checkbox" checked={isSelected}
              onChange={(e) => handleSelectOne(issue.id, e.target.checked)}
              className="rounded border-[#E5E5E0] text-[#1A6B3C] focus:ring-[#1A6B3C]" />
          ) : (
            <div className="w-4" />
          )}
        </td>

        {/* Issue title */}
        <td className="p-4 font-semibold text-[#0D0D0B] max-w-[220px] truncate">
          <span className="mr-2 text-lg">{CATEGORY_ICONS[issue.category as Category]}</span>
          {issue.title}
        </td>

        {/* Category */}
        <td className="p-4 text-sm text-[#6F6F6F]">
          {CATEGORY_LABELS[issue.category as Category] || issue.category}
        </td>

        {/* Location */}
        <td className="p-4 text-sm text-[#6F6F6F] max-w-[160px] truncate">
          {issue.zone ? <span className="font-medium text-[#0D0D0B]">{issue.zone}</span> : null}
          {issue.zone && issue.address ? <span className="text-[#9CA3AF]"> · </span> : null}
          {issue.address || (!issue.zone ? 'Kolkata' : '')}
        </td>

        {/* Severity */}
        <td className="p-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium border"
            style={{
              borderColor:     SEVERITY_COLORS[issue.severity as Severity] + '40',
              color:           SEVERITY_COLORS[issue.severity as Severity],
              backgroundColor: SEVERITY_COLORS[issue.severity as Severity] + '10',
            }}>
            {issue.severity}
          </span>
        </td>

        {/* Reported */}
        <td className="p-4 text-xs text-[#6F6F6F]">{timeAgo(issue.createdAt)}</td>

        {/* Upvotes */}
        <td className="p-4 text-sm text-[#0D0D0B] font-medium">👍 {issue.upvotes}</td>

        {/* SLA */}
        <td className="p-4">{renderSlaBadge(issue.slaHours ?? 0)}</td>

        {/* Status */}
        <td className="p-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium border"
            style={{
              borderColor:     statusColor + '40',
              color:           statusColor,
              backgroundColor: statusColor + '10',
            }}>
            {ALL_STATUSES.find((s) => s.value === issue.status)?.label ?? issue.status}
          </span>
        </td>

        {/* Quick actions — visible on hover, City Admin only */}
        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdmin && issue.status === 'Reported' && (
              <button onClick={() => handleQuickVerify(issue.id)} title="Quick Verify"
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                <CheckCircle2 size={14} />
              </button>
            )}
            {isAdmin && issue.status === 'Verified' && (
              <button onClick={() => handleQuickAssign(issue.id, issue.category)} title="Quick Assign"
                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                <UserPlus size={14} />
              </button>
            )}
            <button onClick={() => setSelectedIssueId(issue.id)} title="View Details"
              className="p-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100">
              <Eye size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Empty state message per role ──────────────────────────────────────────

  const emptyMessage = isWard
    ? 'No issues need verification in your ward right now.'
    : isDept
    ? 'No issues are currently assigned to your department.'
    : 'No issues found matching your selection.';

  // ── Page title / subtitle per role ────────────────────────────────────────

  const pageTitle = myCasesOnly
    ? '📋 My Cases'
    : groupByZone
    ? '🗺️ Issues by Zone'
    : isWard
    ? '🔍 Verification Queue'
    : '📥 Issue Inbox';

  const pageSubtitle = myCasesOnly
    ? 'Issues assigned to you and pending execution'
    : isWard
    ? `Completed issues awaiting your verification — ${ward ?? 'your ward'}`
    : isDept
    ? 'Issues assigned to your department'
    : 'Review and action reported civic issues';

  // ── Columns (Ward Officers skip SLA column — less relevant) ───────────────

  const columns = [
    { label: 'Issue',    field: 'title'     },
    { label: 'Category', field: 'category'  },
    { label: 'Location', field: 'address'   },
    { label: 'Severity', field: 'severity'  },
    { label: 'Reported', field: 'createdAt' },
    { label: 'Upvotes',  field: 'upvotes'   },
    ...(!isWard ? [{ label: 'SLA', field: 'slaHours' }] : []),
    { label: 'Status',   field: 'status'    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative min-h-[80vh]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0D0D0B]">{pageTitle}</h1>
          <p className="text-sm text-[#6F6F6F]">{pageSubtitle}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white px-6 py-4 min-h-[72px] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-wrap gap-6 items-center justify-between">
        <div className="flex flex-wrap gap-5 items-center flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6F6F6F] uppercase tracking-wider mr-2">
            <Filter size={16} className="text-[#1A6B3C]" /> Filters
          </div>
          <div className="flex flex-wrap items-center gap-3.5">

            {/* Category — not shown to ward officers (they only see NeedsVerification) */}
            {!isWard && (
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className={SELECT_CLS} style={SELECT_STYLE}>
                <option value="">Category (All)</option>
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat as Category]}</option>
                ))}
              </select>
            )}

            {/* Status — all roles; ward officer defaults to NeedsVerification */}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className={SELECT_CLS} style={SELECT_STYLE}>
              <option value="">Status (All)</option>
              {ALL_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Severity — not shown to ward officers */}
            {!isWard && (
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
                className={SELECT_CLS} style={SELECT_STYLE}>
                <option value="">Severity (All)</option>
                {(['Low', 'Medium', 'High', 'Critical'] as Severity[]).map((sv) => (
                  <option key={sv} value={sv}>{sv}</option>
                ))}
              </select>
            )}

            {/* Ward filter — City Admin only (others are scoped by backend) */}
            {isAdmin && (
              <input type="text" placeholder="Ward (e.g. Ward 7)"
                value={filterWard} onChange={(e) => setFilterWard(e.target.value)}
                className="h-[42px] w-[175px] px-3.5 text-sm rounded-[12px] border border-[#E5E7EB] bg-white text-[#0D0D0B] focus:border-[#1A6B3C] focus:ring-1 focus:ring-[#1A6B3C] outline-none placeholder:text-[#9CA3AF] transition-colors duration-200" />
            )}
          </div>
        </div>

        {/* Reset */}
        {(filterCategory || filterStatus || filterSeverity || filterWard) ? (
          <button onClick={() => {
            setFilterCategory('');
            setFilterStatus('');
            setFilterSeverity('');
            setFilterWard('');
          }}
            className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap px-2 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Reset Filters
          </button>
        ) : <div className="w-[100px]" />}
      </div>

      {/* Bulk Action Bar — City Admin only */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="bg-[#E8F5EE] border border-[#1A6B3C]/20 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[#1A6B3C]" />
            <span className="text-sm font-semibold text-[#0D3320]">{selectedIds.length} issues selected</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBulkVerify}
              className="px-3 py-1.5 text-xs bg-white text-[#1A6B3C] font-semibold border border-[#1A6B3C]/20 rounded-xl hover:bg-emerald-50">
              Verify All
            </button>
            <button onClick={handleBulkClose}
              className="px-3 py-1.5 text-xs bg-white text-red-700 font-semibold border border-red-200 rounded-xl hover:bg-red-50">
              Close All
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-3xl border border-[#E5E5E0]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1A6B3C]" />
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E5E0] py-20 text-center space-y-2">
          <p className="text-[#6F6F6F] text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E5E5E0]">
                  <th className="p-4 w-12">
                    {isAdmin && (
                      <input type="checkbox" onChange={handleSelectAll}
                        checked={selectedIds.length === sortedIssues.length && sortedIssues.length > 0}
                        className="rounded border-[#E5E5E0] text-[#1A6B3C] focus:ring-[#1A6B3C]" />
                    )}
                  </th>
                  {columns.map((col) => (
                    <th key={col.field} onClick={() => toggleSort(col.field)}
                      className="p-4 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F] cursor-pointer hover:text-[#0D0D0B]">
                      <span className="flex items-center gap-1">{col.label} <ArrowUpDown size={12} /></span>
                    </th>
                  ))}
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupByZone ? (
                  Object.keys(groupedByZone).map((zone) => {
                    const collapsed = collapsedZones[zone];
                    return (
                      <React.Fragment key={zone}>
                        <tr className="bg-gray-50 border-b border-[#E5E5E0]">
                          <td colSpan={columns.length + 2} className="p-3">
                            <button
                              onClick={() => setCollapsedZones((prev) => ({ ...prev, [zone]: !prev[zone] }))}
                              className="flex items-center gap-2 text-sm font-bold text-[#0D3320] w-full text-left outline-none">
                              {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                              📍 {zone} ({groupedByZone[zone].length} cases)
                            </button>
                          </td>
                        </tr>
                        {!collapsed && groupedByZone[zone].map((issue) => renderRow(issue))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  sortedIssues.map((issue) => renderRow(issue))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <IssueDetailPanel
        issueId={selectedIssueId}
        onClose={() => { setSelectedIssueId(null); void fetchIssues(); }}
      />
    </div>
  );
}
