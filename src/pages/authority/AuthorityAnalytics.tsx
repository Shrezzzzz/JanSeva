import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Sparkles } from 'lucide-react';
import api from '../../services/api';

type CommunityInsightResponse = {
  trends: Array<{ title: string; description: string; priority: string }>;
  topAffectedWard: string;
  fastestRespondingDepartment: string;
  generatedAt: string;
  modelUsed: string;
};

export default function AuthorityAnalytics() {
  const [insights, setInsights] = useState<CommunityInsightResponse | null>(null);

  useEffect(() => {
    api.get('/ai/community-insights')
      .then((res) => { if (res.data.success) setInsights(res.data.data); })
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0D0D0B]">Analytics & Insights</h1>
        <p className="text-sm text-[#6F6F6F]">Ward performance, resolution times, and SLA status reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E0] shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-semibold text-[#6F6F6F]">Avg Resolution Time</span>
            <TrendingUp size={18} className="text-[#1A6B3C]" />
          </div>
          <p className="text-2xl font-bold text-[#0D0D0B]">34.2 Hours</p>
          <span className="text-xs text-emerald-600 font-medium">↓ 4.8h from last month</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E0] shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-semibold text-[#6F6F6F]">SLA Adherence</span>
            <BarChart3 size={18} className="text-[#1A6B3C]" />
          </div>
          <p className="text-2xl font-bold text-[#0D0D0B]">94.1%</p>
          <span className="text-xs text-emerald-600 font-medium">↑ 1.2% from last month</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E0] shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-semibold text-[#6F6F6F]">Citizen Satisfaction</span>
            <Users size={18} className="text-[#1A6B3C]" />
          </div>
          <p className="text-2xl font-bold text-[#0D0D0B]">4.6 / 5.0</p>
          <span className="text-xs text-emerald-600 font-medium">Based on verification reviews</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm">
        <h3 className="font-display font-bold text-sm text-[#0D0D0B] mb-4">SLA Compliance Breakdown</h3>
        <p className="text-xs text-[#6F6F6F] leading-relaxed">
          Comprehensive compliance reports are generated weekly. Most SLA breaches were categorized under "Water Leak" due to pipe logistics delays in Ward 4.
        </p>
      </div>

      {insights && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-sm text-[#0D0D0B] flex items-center gap-2">
              <Sparkles size={16} className="text-[#1A6B3C]" /> AI Community Insights
            </h3>
            <span className="text-xs text-[#6F6F6F]">{insights.modelUsed}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.trends.slice(0, 3).map((item) => (
              <div key={item.title} className="rounded-2xl bg-[#F7F7F5] border border-[#E5E5E0] p-4">
                <span className="text-xs font-bold text-[#1A6B3C]">{item.title}</span>
                <p className="text-xs text-[#6F6F6F] mt-1">{item.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6F6F6F]">
            Top affected ward: <strong className="text-[#0D0D0B]">{insights.topAffectedWard}</strong> · Fastest responding department: <strong className="text-[#0D0D0B]">{insights.fastestRespondingDepartment}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
