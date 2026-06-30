import { useState, useEffect } from 'react';
import { BarChart2, CheckCircle, Clock, Users, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';
import TrendChart from './TrendChart';
import CategoryDonut from './CategoryDonut';
import ZoneLeaderboard from './ZoneLeaderboard';
import { fetchAnalyticsSummary, fetchAIInsights } from '../../services/analyticsService';
import type { AnalyticsSummary, AIInsight } from '../../types/api.types';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

type Range = '7d' | '30d' | '90d' | '1y';

export default function ImpactDashboard() {
  const [range,    setRange]    = useState<Range>('30d');
  const [data,     setData]     = useState<AnalyticsSummary | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [aiLoading,setAiLoading]= useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [aiError,  setAiError]  = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAnalyticsSummary(range)
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err instanceof Error ? err.message : 'Unable to load analytics.');
      })
      .finally(() => setLoading(false));
  }, [range]);

  async function refreshInsights() {
    setAiLoading(true);
    setAiError(null);
    try {
      const i = await fetchAIInsights();
      setInsights(i);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Could not generate insights right now.');
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} className="text-[#1A6B3C]" /></div>;
  if (error) {
    return (
      
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return null;
  console.log("Analytics data:", data);

  const RANGES: { v: Range; l: string }[] = [
    { v: '7d', l: '7 Days' }, { v: '30d', l: 'Month' },
    { v: '90d', l: '90 Days' }, { v: '1y', l: 'Year' },
  ];

  return (
    
    <div className="space-y-8">
      {/* Range toggle */}
      <div className="flex gap-2 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.v}
            onClick={() => setRange(r.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              range === r.v ? 'bg-[#1A6B3C] text-white border-[#1A6B3C]' : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
            }`}
          >
            {r.l}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Issues" value={data.totalIssues.toLocaleString()} icon={BarChart2} trend={12} />
        <StatCard title="Resolved" value={data.resolvedIssues.toLocaleString()} subtitle={`${(data.resolutionRate * 100).toFixed(0)}% rate`} icon={CheckCircle} accentColor="#1A6B3C" trend={8} />
        <StatCard title="Avg Resolution" value={`${data.avgResolutionDays.toFixed(1)} days`} icon={Clock} accentColor="#D97706" trend={-5} />
        <StatCard title="Active Citizens" value={data.activeContributors.toLocaleString()} icon={Users} accentColor="#0284C7" trend={22} />
      </div>

      {/* Charts row */}
     
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E5E0] p-5">
          <h3 className="font-medium text-[#0D0D0B] mb-4">Issues Over Time</h3>
          <TrendChart reported={data.trends.issues} resolved={data.trends.resolved} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5E0] p-5">
          <h3 className="font-medium text-[#0D0D0B] mb-1">By Category</h3>
          <CategoryDonut data={data.byCategory} />
        </div>
      </div>
     
      {/* Zone leaderboard */}
      <div>
        <h3 className="font-display text-xl text-[#0D0D0B] mb-4">Zone Performance</h3>
        <ZoneLeaderboard data={data.byZone} />
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-2xl border border-[#E5E5E0] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[#0D0D0B] flex items-center gap-2">🤖 JanSeva AI Insights</h3>
          <Button size="sm" variant="ghost" onClick={refreshInsights} loading={aiLoading} icon={<RefreshCw size={13} />}>
            Refresh
          </Button>
        </div>
        {aiError ? (
          <p className="text-sm text-red-600">{aiError}</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-[#6F6F6F]">Click "Refresh" to generate AI-powered insights from the current data.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E5E0]">
                <div className="text-2xl mb-2">{ins.icon}</div>
                <p className="font-medium text-sm text-[#0D0D0B] mb-1">{ins.title}</p>
                <p className="text-xs text-[#6F6F6F] leading-relaxed">{ins.description}</p>
                <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                  ins.priority === 'High' ? 'bg-red-50 text-red-600' :
                  ins.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-green-50 text-green-600'
                }`}>{ins.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}