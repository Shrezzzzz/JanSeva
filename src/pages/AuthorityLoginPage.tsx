import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import cityReference from '../assets/authority-city-reference.png';
import BrandLogo from '../components/brand/BrandLogo';
import Button from '../components/ui/Button';
import { ROUTES } from '../config/routes';

export default function AuthorityLoginPage() {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'Authority' || user.role === 'Admin')) {
      navigate('/authority/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn({ email, password });
      if (res.user.role !== 'Authority' && res.user.role !== 'Admin') {
        signOut();
        setError('This portal is for authority users only');
      } else {
        navigate('/authority/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07351f] text-[#0D0D0B]">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate(ROUTES.HOME)}
        icon={<ArrowLeft size={16} />}
        className="fixed left-4 top-4 z-40 border border-white/25 bg-white/12 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/20 sm:left-6 sm:top-6"
      >
        Back to Home
      </Button>

      <div className="grid min-h-screen lg:grid-cols-[38%_62%]">
        <section className="relative z-20 flex min-h-screen items-center justify-center bg-[#05351f] px-4 py-20 sm:px-6 lg:px-8 xl:px-10">
          <div className="relative w-full max-w-[416px] rounded-[1.6rem] border border-white bg-white px-5 py-6 shadow-[0_24px_72px_rgba(0,0,0,0.26)] sm:px-8 sm:py-8 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-[70px] w-[70px] items-center justify-center rounded-[1.3rem] bg-[#E8F5EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <Shield size={34} strokeWidth={1.9} className="text-[#1A6B3C]" />
              </div>

              <h1 className="font-display text-[1.6rem] leading-tight text-[#126036] sm:text-[1.88rem]">
                <BrandLogo colorClassName="text-[#126036]" /> Authority Portal
              </h1>
              <p className="mt-1.5 text-sm font-medium text-[#767676]">
                Municipal Staff &amp; Admin Login
              </p>
              <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-[#747474]">
                Manage, verify, assign and resolve citizen reported issues.
              </p>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 shadow-sm">
                <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={16} />
                <p className="text-sm leading-6 text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#777779]">
                  Email Address
                </label>
                <div className="group flex h-12 items-center gap-3 rounded-2xl border border-[#E2E2DE] bg-white px-4 shadow-[0_6px_22px_rgba(13,51,32,0.05)] transition-all duration-300 focus-within:border-[#1A6B3C] focus-within:shadow-[0_10px_28px_rgba(26,107,60,0.12)]">
                  <Mail size={17} className="shrink-0 text-[#858585] transition-colors group-focus-within:text-[#1A6B3C]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium text-[#0D0D0B] placeholder:text-[#9AA0A6] focus:ring-0"
                    placeholder="officer@janseva.gov"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#777779]">
                  Password
                </label>
                <div className="group flex h-12 items-center gap-3 rounded-2xl border border-[#E2E2DE] bg-white px-4 shadow-[0_6px_22px_rgba(13,51,32,0.05)] transition-all duration-300 focus-within:border-[#1A6B3C] focus-within:shadow-[0_10px_28px_rgba(26,107,60,0.12)]">
                  <Lock size={17} className="shrink-0 text-[#858585] transition-colors group-focus-within:text-[#1A6B3C]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium text-[#0D0D0B] placeholder:text-[#9AA0A6] focus:ring-0"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#14723f] px-5 text-sm font-semibold text-white shadow-[0_16px_26px_rgba(20,114,63,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0D3320] hover:shadow-[0_20px_32px_rgba(20,114,63,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Verifying...' : 'Access Dashboard'}</span>
                {!loading && <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-2 text-[10px] font-semibold text-[#747474] sm:text-[11px]">
              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <ShieldCheck size={13} className="text-[#8A8F8A]" />
                <span>Secure Access</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <UserCheck size={13} className="text-[#8A8F8A]" />
                <span>Verified Staff Only</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Lock size={13} className="text-[#8A8F8A]" />
                <span>Protected System</span>
              </div>
            </div>

            <div className="mt-6 border-t border-[#E2E2DE] pt-5 text-center">
              <p className="text-xs leading-5 text-[#8A8A8A]">
                Authorized government staff access only.
                <br />
                All activities are monitored and logged.
              </p>
            </div>
          </div>
        </section>

        <section
          className="relative hidden min-h-screen overflow-hidden bg-cover bg-right lg:block"
          style={{
            backgroundImage: `url(${cityReference})`,
            backgroundSize: '172% 100%',
            backgroundPosition: 'right center',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(5,53,31,0.12)_100%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#05351f]/90 via-[#05351f]/45 to-transparent" />
          <div className="absolute left-[46%] top-[18%] h-[68%] border-l border-dashed border-white/50 shadow-[0_0_18px_rgba(255,255,255,0.2)]" />
        </section>
      </div>
    </main>
  );
}
