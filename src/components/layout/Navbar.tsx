import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const NAV_LINKS = [
  { label: 'Home',    href: ROUTES.HOME },
  { label: 'Map',     href: ROUTES.MAP },
  { label: 'Track',   href: ROUTES.TRACK },
  { label: 'Impact',  href: ROUTES.DASHBOARD },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { openLogin, openRegister } = useUIStore();
  const [scrolled,   setScrolled] = useState(false);
  const [menuOpen,   setMenuOpen] = useState(false);
  const [userMenu,   setUserMenu] = useState(false);
  const isHero      = pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 inset-x-0 z-40 transition-all duration-300',
        scrolled || !isHero
          ? 'bg-white/90 backdrop-blur-md border-b border-[#E5E5E0] py-3'
          : 'bg-transparent py-5',
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="font-display text-2xl font-normal tracking-tight text-[#0D0D0B] hover:opacity-80 transition-opacity">
          JanSeva<sup className="text-xs">®</sup>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                to={l.href}
                className={clsx(
                  'relative text-sm pb-1 transition-colors',
                  pathname === l.href
                    ? 'text-[#0D0D0B] font-medium'
                    : 'text-[#6F6F6F] hover:text-[#0D0D0B]',
                )}
              >
                {l.label}
                {pathname === l.href && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#1A6B3C]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button
            size="md"
            onClick={() => navigate(ROUTES.REPORT)}
            icon={<AlertCircle size={15} />}
            className="hidden sm:inline-flex"
          >
            Report an Issue
          </Button>

          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 rounded-full p-0.5 hover:bg-[#F7F7F5] transition-colors">
                <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-11 w-44 bg-white border border-[#E5E5E0] rounded-2xl shadow-lg py-2 animate-scale-in">
                  <Link to={ROUTES.PROFILE} className="block px-4 py-2 text-sm hover:bg-[#F7F7F5]" onClick={() => setUserMenu(false)}>My Profile</Link>
                  <Link to={ROUTES.GAMIFICATION} className="block px-4 py-2 text-sm hover:bg-[#F7F7F5]" onClick={() => setUserMenu(false)}>Leaderboard</Link>
                  {user?.role === 'Authority' || user?.role === 'Admin' ? (
                    <Link to={ROUTES.ADMIN} className="block px-4 py-2 text-sm hover:bg-[#F7F7F5]" onClick={() => setUserMenu(false)}>Admin Panel</Link>
                  ) : null}
                  <hr className="my-1 border-[#E5E5E0]" />
                  <button onClick={() => { signOut(); setUserMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-red-50">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={openLogin} className="text-sm text-[#6F6F6F] hover:text-[#0D0D0B] transition-colors hidden sm:inline">
              Login
            </button>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden p-1.5 rounded-full hover:bg-[#F7F7F5]" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E5E0] px-4 py-4 space-y-3 animate-slide-up">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} to={l.href} className="block text-sm text-[#0D0D0B]" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Button size="sm" fullWidth onClick={() => { navigate(ROUTES.REPORT); setMenuOpen(false); }}>Report an Issue</Button>
          {!isAuthenticated && (
            <button onClick={() => { openLogin(); setMenuOpen(false); }} className="w-full text-sm text-center text-[#6F6F6F]">Login</button>
          )}
        </div>
      )}
    </header>
  );
}
