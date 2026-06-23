import { create } from 'zustand';
import type { Issue, IssueFilters, Category, IssueStatus, Severity } from '../types/issue.types';

interface IssueState {
  issues: Issue[];
  selectedIssue: Issue | null;
  filters: IssueFilters;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  setIssues: (issues: Issue[]) => void;
  appendIssues: (issues: Issue[]) => void;
  setSelectedIssue: (issue: Issue | null) => void;
  updateIssue: (id: string, update: Partial<Issue>) => void;
  addIssue: (issue: Issue) => void;
  setFilters: (filters: Partial<IssueFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  optimisticUpvote: (id: string, userId: string) => void;
}

const DEFAULT_FILTERS: IssueFilters = {
  categories: [] as Category[],
  statuses:   [] as IssueStatus[],
  severities: [] as Severity[],
  dateRange:  '30d',
};

export const useIssueStore = create<IssueState>((set, get) => ({
  issues:        [],
  selectedIssue: null,
  filters:       DEFAULT_FILTERS,
  page:          1,
  totalPages:    1,
  isLoading:     false,
  error:         null,

  setIssues:       (issues)      => set({ issues }),
  appendIssues:    (issues)      => set((s) => ({ issues: [...s.issues, ...issues] })),
  setSelectedIssue:(issue)       => set({ selectedIssue: issue }),
  updateIssue: (id, update) =>
    set((s) => ({
      issues: s.issues.map((i) => (i.id === id ? { ...i, ...update } : i)),
      selectedIssue: s.selectedIssue?.id === id ? { ...s.selectedIssue, ...update } : s.selectedIssue,
    })),
  addIssue: (issue) => set((s) => ({ issues: [issue, ...s.issues] })),
  setFilters: (f)  => set((s) => ({ filters: { ...s.filters, ...f }, page: 1 })),
  resetFilters:    () => set({ filters: DEFAULT_FILTERS, page: 1 }),
  setPage:         (page)  => set({ page }),
  setTotalPages:   (total) => set({ totalPages: total }),
  setLoading:      (v)     => set({ isLoading: v }),
  setError:        (e)     => set({ error: e }),
  optimisticUpvote: (id, userId) =>
    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === id
          ? { ...i, upvotes: i.upvotes + 1, verifiedBy: [...i.verifiedBy, userId] }
          : i,
      ),
    })),
}));
