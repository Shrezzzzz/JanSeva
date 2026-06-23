import { create } from 'zustand';
import type { MapFilter, MapViewState } from '../types/map.types';
import type { Issue } from '../types/issue.types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../utils/constants';

interface MapState {
  view: MapViewState;
  filter: MapFilter;
  mapIssues: Issue[];
  showSatellite: boolean;
  isFilterOpen: boolean;

  setView: (v: Partial<MapViewState>) => void;
  setFilter: (f: Partial<MapFilter>) => void;
  resetFilter: () => void;
  setMapIssues: (issues: Issue[]) => void;
  toggleSatellite: () => void;
  toggleFilter: () => void;
  toggleHeatmap: () => void;
}

const DEFAULT_FILTER: MapFilter = {
  categories:   [],
  statuses:     [],
  severities:   [],
  dateRange:    '30d',
  showHeatmap:  false,
  showClusters: true,
};

export const useMapStore = create<MapState>((set) => ({
  view:          { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM },
  filter:        DEFAULT_FILTER,
  mapIssues:     [],
  showSatellite: false,
  isFilterOpen:  false,

  setView:      (v) => set((s) => ({ view: { ...s.view, ...v } })),
  setFilter:    (f) => set((s) => ({ filter: { ...s.filter, ...f } })),
  resetFilter:  ()  => set({ filter: DEFAULT_FILTER }),
  setMapIssues: (issues) => set({ mapIssues: issues }),
  toggleSatellite: () => set((s) => ({ showSatellite: !s.showSatellite })),
  toggleFilter:    () => set((s) => ({ isFilterOpen: !s.isFilterOpen })),
  toggleHeatmap:   () => set((s) => ({ filter: { ...s.filter, showHeatmap: !s.filter.showHeatmap } })),
}));
