import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CategoryStat } from '../../types/api.types';

export default function CategoryDonut({ data }: { data: CategoryStat[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-[#6F6F6F]">
        No category data available for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="count"
          nameKey="category"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(val: number, name: string) => [val, name]}
          contentStyle={{ borderRadius: 12, border: '1px solid #E5E5E0', fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, marginTop: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
