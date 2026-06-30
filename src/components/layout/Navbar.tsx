import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import BrandLogo from '../brand/BrandLogo';

const NAV_LINKS = [
  { label: '🏙️ Home',      href: ROUTES.CITIZEN },
  { label: '🌍 Map',       href: ROUTES.MAP },
  { label: '🔍 Track',     href: ROUTES.TRACK },
  { label: '📈 Impact',    href: ROUTES.DASHBOARD },
  { label: '🎯 Missions',  href: ROUTES.MISSIONS },
  { label: '🎭 Character', href: ROUTES.AVATAR },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { openLogin } = useUIStore();
  const [scrolled,  setScrolled] = useState(false);
  const [menuOpen,  setMenuOpen] = useState(false);
  const [userMenu,  setUserMenu] = useState(false);
  const isHero = pathname === ROUTES.CITIZEN;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 inset-x-0 z-40 transition-all duration-300',
          scrolled || !isHero
            ? 'bg-white/90 backdrop-blur-md border-b border-[#E5E5E0] py-2.5 sm:py-3'
            : 'bg-transparent py-4 sm:py-5',
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to={ROUTES.CITIZEN} className="text-xl sm:text-2xl text-[#0D0D0B] hover:opacity-80 transition-opacity shrink-0">
            <BrandLogo />
          </Link>

          {/* Desktop links — hidden on mobile/tablet */}
          <ul className="hidden lg:flex items-center gap-4 xl:gap-6 ml-6 xl:ml-44">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  className={clsx(
                    'relative text-sm pb-1 transition-colors whitespace-nowrap',
                    pathname === l.href
                      ? 'text-[#0D0D0B] font-medium'
                      : 'text-[#6F6F6F] hover:text-[#0D0D0B]',
                  )}
                >
                  {l.label}
                  {pathname === l.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#1A6B3C]" aria-hidden />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto lg:ml-0">
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
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full p-0.5 hover:bg-[#F7F7F5] transition-colors min-w-[44px] min-h-[44px] justify-center"
                >
                  <Avatar src={user?.avatarUrl} name={user?.name} size="sm" activeCharacter={user?.activeCharacter} />
                </button>
                {userMenu && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                    <div className="absolute right-0 top-12 w-48 bg-white border border-[#E5E5E0] rounded-2xl shadow-lg py-2 z-20 animate-scale-in">
                      <Link to={ROUTES.PROFILE} className="block px-4 py-2.5 text-sm hover:bg-[#F7F7F5] min-h-[44px] flex items-center" onClick={() => setUserMenu(false)}>My Profile</Link>
                      <Link to={ROUTES.GAMIFICATION} className="block px-4 py-2.5 text-sm hover:bg-[#F7F7F5] min-h-[44px] flex items-center" onClick={() => setUserMenu(false)}>Leaderboard</Link>
                      {(user?.role === 'Authority' || user?.role === 'Admin') && (
                        <Link to="/authority/dashboard" className="block px-4 py-2.5 text-sm hover:bg-[#F7F7F5] min-h-[44px] flex items-center" onClick={() => setUserMenu(false)}>
                          🏛️ Authority Panel
                        </Link>
                      )}
                      {user?.role === 'Admin' && (
                        <Link to={ROUTES.ADMIN} className="block px-4 py-2.5 text-sm hover:bg-[#F7F7F5] min-h-[44px] flex items-center" onClick={() => setUserMenu(false)}>Admin Panel</Link>
                      )}
                      <hr className="my-1 border-[#E5E5E0]" />
                      <button onClick={() => { signOut(); setUserMenu(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-[#DC2626] hover:bg-red-50 min-h-[44px] flex items-center">Sign Out</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={openLogin}
                className="text-sm text-[#6F6F6F] hover:text-[#0D0D0B] transition-colors hidden sm:inline min-h-[44px] px-2 flex items-center"
              >
                Login
              </button>
            )}

            {/* Hamburger — visible on mobile + tablet */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-[#F7F7F5] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile/tablet slide-out drawer */}
      {/* Backdrop */}
      <div
        className={clsx(
          'lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          'lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 sm:w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E0]">
          <BrandLogo className="text-xl" />
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-xl hover:bg-[#F7F7F5] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[52px] mb-1',
                  active
                    ? 'bg-[#E8F5EE] text-[#1A6B3C]'
                    : 'text-[#0D0D0B] hover:bg-[#F7F7F5]',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div className="px-4 py-4 border-t border-[#E5E5E0] space-y-3">
          <Button
            size="md"
            fullWidth
            onClick={() => { navigate(ROUTES.REPORT); setMenuOpen(false); }}
            icon={<AlertCircle size={15} />}
          >
            Report an Issue
          </Button>
          {!isAuthenticated ? (
            <button
              onClick={() => { openLogin(); setMenuOpen(false); }}
              className="w-full py-3 text-sm text-center text-[#6F6F6F] hover:text-[#0D0D0B] border border-[#E5E5E0] rounded-xl transition-colors min-h-[48px]"
            >
              Login
            </button>
          ) : (
            <>
              {(user?.role === 'Authority' || user?.role === 'Admin') && (
                <button
                  onClick={() => { navigate('/authority/dashboard'); setMenuOpen(false); }}
                  className="w-full py-3 text-sm text-center font-medium bg-[#1A6B3C] text-white hover:bg-[#155A32] rounded-xl transition-colors min-h-[48px]"
                >
                  🏛️ Authority Portal
                </button>
              )}
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full py-3 text-sm text-center text-[#DC2626] hover:bg-red-50 border border-red-100 rounded-xl transition-colors min-h-[48px]"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
