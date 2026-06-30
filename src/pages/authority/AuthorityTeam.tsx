import { useEffect, useState } from 'react';
import { Mail, MapPin, Briefcase, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { DEPARTMENTS } from '../../config/departments';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Authority' | 'Admin';
  ward: string | null;
  assignedDepartments?: string[];
  assignedWard?: string | null;
  activeCases: number;
  resolvedCases: number;
}

const ROLE_LABELS: Record<string, string> = {
  Authority: 'Authority Officer',
  Admin: 'Administrator',
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Authority: { bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200' },
  Admin:     { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

/** Return the departments a member is responsible for based on their email */
function getMemberDepts(email: string): string[] {
  return DEPARTMENTS.filter((d) => d.defaultAssignee === email).map((d) => d.name);
}

export default function AuthorityTeam() {
  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/users/authority-team');
        if (res.data.success) setMembers(res.data.data);
        else setError('Failed to load team.');
      } catch {
        setError('Could not reach server.');
      } finally {
        setLoading(false);
      }
    }

    void loadTeam();
  }, [refreshKey]);

  const totalActive   = members.reduce((s, m) => s + m.activeCases, 0);
  const totalResolved = members.reduce((s, m) => s + m.resolvedCases, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0D0D0B]">Authority Team Directory</h1>
          <p className="text-sm text-[#6F6F6F] mt-0.5">
            Ward officers, department heads, and portal admins — with live case workloads.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5E0] text-xs text-[#6F6F6F] hover:bg-[#F7F7F5] transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary strip */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Team Members',    value: members.length,  icon: '👥' },
            { label: 'Active Cases',    value: totalActive,     icon: '📋' },
            { label: 'Resolved (total)',value: totalResolved,   icon: '✅' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E5E5E0] p-4 flex items-center gap-3 shadow-sm">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xl font-bold text-[#0D0D0B]">{s.value}</p>
                <p className="text-xs text-[#6F6F6F]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1A6B3C]" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Team grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {members.map((member) => {
            const depts   = member.assignedDepartments?.length ? member.assignedDepartments : getMemberDepts(member.email);
            const roleCol = ROLE_COLORS[member.role] ?? ROLE_COLORS.Authority;

            return (
              <div
                key={member.id}
                className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#E8F5EE] text-[#1A6B3C] flex items-center justify-center font-bold text-lg shrink-0">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-[#0D0D0B] truncate">{member.name}</h3>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleCol.bg} ${roleCol.text} ${roleCol.border}`}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                </div>

                {/* Contact + ward */}
                <div className="space-y-1.5 pt-3 border-t border-[#F0F0EE] text-xs text-[#6F6F6F]">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="shrink-0" />
                    <span>{member.assignedWard || (member.ward === 'All' || !member.ward ? 'All Wards' : member.ward)}</span>
                  </div>
                </div>

                {/* Departments */}
                {depts.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9E9C] flex items-center gap-1">
                      <Briefcase size={11} /> Departments
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {depts.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 bg-[#E8F5EE] text-[#1A6B3C] rounded-full text-[10px] font-medium"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case counts */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0F0EE]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock size={13} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0D0D0B]">{member.activeCases}</p>
                      <p className="text-[10px] text-[#6F6F6F]">Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
                      <CheckCircle2 size={13} className="text-[#1A6B3C]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0D0D0B]">{member.resolvedCases}</p>
                      <p className="text-[10px] text-[#6F6F6F]">Resolved</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Department → Category mapping reference */}
      <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 shadow-sm">
        <h2 className="font-display font-bold text-[#0D0D0B] mb-4">Department → Issue Category Mapping</h2>
        <p className="text-xs text-[#6F6F6F] mb-4">
          When assigning an issue, the system auto-suggests the responsible department based on the issue category below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="p-4 rounded-2xl border border-[#E5E5E0] bg-[#F7F7F5] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{dept.icon}</span>
                <h3 className="text-sm font-semibold text-[#0D0D0B]">{dept.name}</h3>
              </div>
              <p className="text-[11px] text-[#6F6F6F]">{dept.description}</p>
              <div className="flex flex-wrap gap-1">
                {dept.categories.map((cat) => (
                  <span key={cat} className="px-2 py-0.5 bg-white border border-[#E5E5E0] rounded-full text-[10px] text-[#0D0D0B]">
                    {cat}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[#6F6F6F]">
                Default assignee: <span className="font-medium text-[#1A6B3C]">{dept.defaultAssignee}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
