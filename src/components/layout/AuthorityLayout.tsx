import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Shield } from 'lucide-react';
import BrandLogo from '../brand/BrandLogo';
import { DEPARTMENTS } from '../../config/departments';

// ── Role helpers ──────────────────────────────────────────────────────────────

const DEPT_EMAILS = new Set(DEPARTMENTS.map((d) => d.defaultAssignee));

function getRoleLabel(role: string, email: string, ward?: string | null): string {
  if (role === 'Admin' || ward === 'City-Wide') return 'City Admin';
  if (role === 'Authority' && DEPT_EMAILS.has(email)) {
    const dept = DEPARTMENTS.find((d) => d.defaultAssignee === email);
    return dept ? dept.name.replace(' Department', '').replace(' & Recreation', '') + ' Officer' : 'Dept Officer';
  }
  if (role === 'Authority' && ward && ward !== 'All') return 'Ward Officer';
  return 'Authority';
}

function getRoleBadgeColors(role: string, email: string, ward?: string | null) {
  if (role === 'Admin' || ward === 'City-Wide')
    return { bg: 'bg-purple-600', text: 'text-white' };
  if (role === 'Authority' && DEPT_EMAILS.has(email))
    return { bg: 'bg-blue-600', text: 'text-white' };
  return { bg: 'bg-[#1A6B3C]', text: 'text-white' };
}

// ── Nav items scoped per role ─────────────────────────────────────────────────

function getNavItems(role: string, email: string, ward?: string | null) {
  const isAdmin = role === 'Admin' || ward === 'City-Wide';
  const isDept  = role === 'Authority' && DEPT_EMAILS.has(email);
  const isWard  = role === 'Authority' && !DEPT_EMAILS.has(email) && Boolean(ward && ward !== 'All');

  if (isWard) {
    // Ward Officer: dedicated verification pages
    return [
      { label: '📊 Overview',           path: '/authority/ward/dashboard' },
      { label: '🔍 Verification Queue', path: '/authority/ward/queue'     },
    ];
  }

  if (isDept) {
    // Department Officer: their own cases + dashboard
    return [
      { label: '📊 Overview',  path: '/authority/dashboard' },
      { label: '📋 My Cases',  path: '/authority/my-cases'  },
    ];
  }

  // City Admin: full access
  return [
    { label: '📊 Overview',  path: '/authority/dashboard' },
    { label: '📥 Inbox',     path: '/authority/inbox'     },
    { label: '📋 My Cases',  path: '/authority/my-cases'  },
    { label: '🗺️ By Zone',   path: '/authority/zones'     },
    { label: '📈 Analytics', path: '/authority/analytics' },
    { label: '👥 Team',      path: '/authority/team'      },
  ];
}

function getMobileNavItems(role: string, email: string, ward?: string | null) {
  const isAdmin = role === 'Admin' || ward === 'City-Wide';
  const isDept  = role === 'Authority' && DEPT_EMAILS.has(email);
  const isWard  = role === 'Authority' && !DEPT_EMAILS.has(email) && Boolean(ward && ward !== 'All');

  if (isWard)  return [{ icon: '📊', path: '/authority/ward/dashboard' }, { icon: '🔍', path: '/authority/ward/queue' }];
  if (isDept)  return [{ icon: '📊', path: '/authority/dashboard' }, { icon: '📋', path: '/authority/my-cases' }];
  return [
    { icon: '📊', path: '/authority/dashboard' },
    { icon: '📥', path: '/authority/inbox'     },
    { icon: '📋', path: '/authority/my-cases'  },
    { icon: '🗺️', path: '/authority/zones'     },
    { icon: '📈', path: '/authority/analytics' },
  ];
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AuthorityLayout({ children }: { children?: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    if (!user || (user.role !== 'Authority' && user.role !== 'Admin')) {
      navigate('/authority/login', { replace: true });
    }
  }, [user, navigate]);

  const role  = user?.role  ?? '';
  const email = user?.email ?? '';
  const ward  = user?.ward  ?? null;

  const roleLabel  = getRoleLabel(role, email, ward);
  const badgeCls   = getRoleBadgeColors(role, email, ward);
  const navItems   = getNavItems(role, email, ward);
  const mobileItems = getMobileNavItems(role, email, ward);

  return (
    <div className="min-h-screen bg-[#F0F4F0] flex flex-col">

      {/* Top bar */}
      <header className="bg-[#0D3320] text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Shield size={18} className="text-[#4ADE80] sm:w-5 sm:h-5 shrink-0" />
          <span className="font-display text-base sm:text-lg hidden sm:inline-flex items-center gap-1 whitespace-nowrap">
            <BrandLogo colorClassName="text-white" /> <span className="hidden sm:inline">Authority Portal</span>
          </span>
          {/* Role badge */}
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${badgeCls.bg} ${badgeCls.text}`}>
            {roleLabel}
          </span>
          {/* Ward badge (not for city admin) */}
          {ward && ward !== 'All' && ward !== 'City-Wide' && (
            <span className="text-[10px] sm:text-xs bg-white/15 border border-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              {ward}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 ml-2">
          <span className="text-sm text-white/70 hidden sm:block truncate max-w-[120px]">{user?.name}</span>
          <button
            onClick={() => { signOut(); navigate('/authority/login'); }}
            className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors shrink-0"
            aria-label="Sign out"
          >
            <LogOut size={16} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-52 bg-white border-r border-[#E5E5E0] py-4 gap-1 px-2 shrink-0">
          {navItems.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <Link key={tab.path} to={tab.path}
                className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-[#E8F5EE] text-[#1A6B3C] font-semibold'
                    : 'text-[#0D0D0B] hover:bg-[#E8F5EE] hover:text-[#1A6B3C]'
                }`}>
                {tab.label}
              </Link>
            );
          })}

          {/* Role info card at bottom of sidebar */}
          <div className="mt-auto pt-4 mx-1 border-t border-[#E5E5E0]">
            <div className="px-3 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] space-y-0.5">
              <p className="text-[10px] uppercase font-bold text-[#6F6F6F] tracking-wider">Signed in as</p>
              <p className="text-xs font-semibold text-[#0D0D0B] truncate">{user?.name}</p>
              <p className="text-[10px] text-[#6F6F6F] truncate">{email}</p>
              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeCls.bg} ${badgeCls.text}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E5E5E0] flex justify-around py-2 z-50">
        {mobileItems.map((t) => (
          <Link key={t.path} to={t.path}
            className={`flex flex-col items-center text-xl py-1 px-3 rounded-xl transition-colors ${
              location.pathname === t.path ? 'bg-[#E8F5EE]' : ''
            }`}>
            {t.icon}
          </Link>
        ))}
      </nav>
    </div>
  );
}
