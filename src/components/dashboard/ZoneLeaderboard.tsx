import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ZoneStat } from '../../types/api.types';
import { gradeColor } from '../../utils/formatters';
import { clsx } from 'clsx';

type SortKey = keyof ZoneStat;

export default function ZoneLeaderboard({ data }: { data: ZoneStat[] }) {
  const [sort,  setSort]  = useState<SortKey>('responseRate');
  const [asc,   setAsc]   = useState(false);

  const sorted = [...data].sort((a, b) => {
    const va = a[sort] as number, vb = b[sort] as number;
    return asc ? va - vb : vb - va;
  });

  function toggleSort(key: SortKey) {
    if (sort === key) setAsc((v) => !v);
    else { setSort(key); setAsc(false); }
  }

  const COLS: { key: SortKey; label: string }[] = [
    { key: 'zone',         label: 'Zone'           },
    { key: 'reported',     label: 'Reported'       },
    { key: 'resolved',     label: 'Resolved'       },
    { key: 'avgDays',      label: 'Avg Days'       },
    { key: 'responseRate', label: 'Response Rate'  },
    { key: 'grade',        label: 'Grade'          },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E5E0]">
      <table className="w-full text-sm">
        <thead className="bg-[#F7F7F5] sticky top-0">
          <tr>
            {COLS.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className="px-4 py-3 text-left text-xs font-semibold text-[#6F6F6F] uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-[#0D0D0B]"
              >
                <span className="flex items-center gap-1">
                  {c.label}
                  {sort === c.key ? (asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((z, i) => (
            <tr
              key={z.zone}
              className={clsx('border-t border-[#E5E5E0] transition-colors hover:bg-[#F7F7F5]', i < 3 && 'bg-[#E8F5EE]/30')}
            >
              <td className="px-4 py-3 font-medium text-[#0D0D0B]">{z.zone}</td>
              <td className="px-4 py-3 text-[#6F6F6F]">{z.reported}</td>
              <td className="px-4 py-3 text-[#6F6F6F]">{z.resolved}</td>
              <td className="px-4 py-3 text-[#6F6F6F]">{z.avgDays.toFixed(1)}</td>
              <td className="px-4 py-3 text-[#6F6F6F]">{(z.responseRate * 100).toFixed(0)}%</td>
              <td className="px-4 py-3">
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', gradeColor(z.grade))}>
                  {z.grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
