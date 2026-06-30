import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendPoint } from '../../types/api.types';
import { format, parseISO } from 'date-fns';

interface TrendChartProps {
  reported: TrendPoint[];
  resolved: TrendPoint[];
}

export default function TrendChart({ reported, resolved }: TrendChartProps) {
  const data = reported.map((r, i) => ({
    date:     r.date,
    label:    format(parseISO(r.date), 'MMM d'),
    reported: r.count,
    resolved: resolved[i]?.count ?? 0,
  }));

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-[#6F6F6F]">
        No issue trend data available for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6F6F6F' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6F6F6F' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E5E5E0', fontSize: 12, boxShadow: 'none' }}
          labelStyle={{ fontWeight: 600, color: '#0D0D0B' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="reported" stroke="#9CA3AF" strokeWidth={2} dot={false} name="Reported" />
        <Line type="monotone" dataKey="resolved" stroke="#1A6B3C" strokeWidth={2} dot={false} name="Resolved" />
      </LineChart>
    </ResponsiveContainer>
  );
}
