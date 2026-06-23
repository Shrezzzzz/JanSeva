import { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import IssueMap from '../components/map/IssueMap';
import IssueDetail from '../components/issue/IssueDetail';
import { useMapStore } from '../store/mapStore';
import { fetchIssuesForMap } from '../services/issueService';
import type { Issue, Category, IssueStatus, Severity } from '../types/issue.types';
import { CATEGORY_ICONS } from '../types/issue.types';
import { CATEGORY_LABELS } from '../utils/constants';
import { MOCK_ISSUES } from '../utils/mockData';

const ALL_CATS: Category[]      = ['Pothole', 'Streetlight', 'WaterLeak', 'WasteDump', 'Sewage', 'RoadDamage', 'ParkIssue', 'Other'];
const ALL_STATUSES: IssueStatus[] = ['Reported', 'Verified', 'Assigned', 'InProgress', 'Resolved', 'Closed'];
const ALL_SEVERITIES: Severity[]  = ['Low', 'Medium', 'High', 'Critical'];
const DATE_RANGES = [
  { label: '7 days',  value: '7d'  as const },
  { label: '30 days', value: '30d' as const },
  { label: '90 days', value: '90d' as const },
  { label: 'All time', value: 'all' as const },
];

export default function MapPage() {
  const { isFilterOpen, toggleFilter, setFilter, filter, setMapIssues } = useMapStore();
  const [selected, setSelected] = useState<Issue | null>(null);

  // Seed map with mock data on mount, then try real API
  useEffect(() => {
    setMapIssues(MOCK_ISSUES);
    fetchIssuesForMap({ north: 22.65, south: 22.49, east: 88.45, west: 88.28 })
      .then((issues) => { if (issues.length) setMapIssues(issues); })
      .catch(() => null);
  }, [setMapIssues]);

  function toggleCategory(cat: Category) {
    const existing = filter.categories;
    setFilter({
      categories: existing.includes(cat)
        ? existing.filter((c) => c !== cat)
        : [...existing, cat],
    });
  }

  function toggleStatus(st: IssueStatus) {
    const existing = filter.statuses;
    setFilter({
      statuses: existing.includes(st)
        ? existing.filter((s) => s !== st)
        : [...existing, st],
    });
  }

  function toggleSeverity(sv: Severity) {
    const existing = filter.severities;
    setFilter({
      severities: existing.includes(sv)
        ? existing.filter((s) => s !== sv)
        : [...existing, sv],
    });
  }

  function setDateRange(value: '7d' | '30d' | '90d' | 'all') {
    setFilter({ dateRange: value });
  }

  const activeFilterCount =
    filter.categories.length +
    filter.statuses.length +
    filter.severities.length +
    (filter.dateRange !== '30d' ? 1 : 0);

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Offset for fixed navbar */}
      <div className="h-16 flex-shrink-0" />

      <div className="flex-1 relative overflow-hidden">
        {/* Map */}
        <IssueMap onSelectIssue={setSelected} />

        {/* Filter toggle button */}
        <button
          onClick={toggleFilter}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-5 py-2.5 glass rounded-full shadow-lg text-sm font-medium text-[#0D0D0B] hover:bg-white transition-colors"
        >
          <SlidersHorizontal size={15} /> Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#1A6B3C] text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter drawer */}
        {isFilterOpen && (
          <div className="absolute bottom-0 left-0 right-0 z-[600] bg-white rounded-t-3xl shadow-2xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#0D0D0B]">Filter Issues</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter({ categories: [], statuses: [], severities: [], dateRange: '30d' })}
                  className="text-xs text-[#6F6F6F] hover:text-[#DC2626]"
                >
                  Reset
                </button>
                <button onClick={toggleFilter} className="p-1 rounded-full hover:bg-[#F7F7F5]">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Category */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6F6F6F] mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        filter.categories.includes(cat)
                          ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]'
                          : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                      }`}
                    >
                      {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6F6F6F] mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => toggleStatus(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        filter.statuses.includes(st)
                          ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]'
                          : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6F6F6F] mb-2">Severity</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_SEVERITIES.map((sv) => {
                    const colors: Record<Severity, string> = {
                      Low:      'border-green-400  text-green-700  bg-green-50',
                      Medium:   'border-amber-400  text-amber-700  bg-amber-50',
                      High:     'border-orange-400 text-orange-700 bg-orange-50',
                      Critical: 'border-red-400    text-red-700    bg-red-50',
                    };
                    const active = filter.severities.includes(sv);
                    return (
                      <button
                        key={sv}
                        onClick={() => toggleSeverity(sv)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? colors[sv]
                            : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                        }`}
                      >
                        {sv}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6F6F6F] mb-2">Date Range</p>
                <div className="flex flex-wrap gap-2">
                  {DATE_RANGES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDateRange(d.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        filter.dateRange === d.value
                          ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]'
                          : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issue detail side panel */}
        {selected && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-[550] shadow-2xl overflow-hidden flex flex-col animate-slide-right">
            <IssueDetail issue={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
