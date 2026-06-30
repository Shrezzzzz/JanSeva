import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Menu, X, ArrowRight } from 'lucide-react';
import { ROUTES } from '../config/routes';
import BrandLogo from '../components/brand/BrandLogo';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4';

const NAV_LINKS = ['About', 'Features', 'AI for Authorities', 'Community'];
const NAV_IDS: Record<string, string> = {
  'AI for Authorities': 'ai-authorities',
};

export default function PublicLandingPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Escape key closes menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="relative min-h-screen bg-black font-['Inter',sans-serif] overflow-x-hidden">

      {/* ── Full-screen background video ───────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/40 backdrop-blur-xl border-b border-white/10 py-3'
            : 'bg-black/20 backdrop-blur-sm py-4 sm:py-5'
        }`}
      >
        <nav className="max-w-[88rem] mx-auto px-4 sm:px-9 flex items-center gap-3 sm:gap-4">

          {/* Logo */}
          <BrandLogo colorClassName="text-white" className="text-[1.25rem] sm:text-[1.4rem] select-none" />

          {/* Desktop center links */}
          <ul className="hidden md:flex items-center justify-center gap-6 lg:gap-9 flex-1 ml-8 lg:ml-12">
            {NAV_LINKS.map((label) => (
              <li key={label}>
                <button
                  className="text-sm lg:text-[15px] text-white/75 hover:text-white transition-colors min-h-[44px] flex items-center"
                  onClick={() => {
                    const el = document.getElementById(NAV_IDS[label] ?? label.toLowerCase());
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Desktop: full Authority Portal button */}
            <button
              onClick={() => navigate('/authority/login')}
              className="hidden md:flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm lg:text-[15px] font-medium backdrop-blur-sm transition-all duration-200 min-h-[44px]"
            >
              <Shield size={15} />
              Authority Portal
            </button>

            {/* Mobile hamburger only — no compact portal button in header */}
            <button
              className="md:hidden p-2 rounded-full bg-white/10 text-white min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile overlay — z-40, covers everything including header ── */}
      <div
        aria-hidden
        className={`md:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ── Mobile slide-out drawer — z-50, sits above the overlay ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-[280px] max-w-[82vw] flex flex-col
          bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-white/10 shadow-[-8px_0_40px_rgba(0,0,0,0.6)]
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8">
          <BrandLogo colorClassName="text-white" className="text-xl select-none" />
          <button
            className="p-2 rounded-full bg-white/10 text-white w-10 h-10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col flex-1 px-5 py-3 overflow-y-auto">
          {NAV_LINKS.map((label) => (
            <button
              key={label}
              className="text-left text-[17px] font-medium text-white/75 hover:text-white active:text-white/50 py-[18px] border-b border-white/6 transition-colors last:border-b-0 flex items-center gap-3"
              onClick={() => {
                setMenuOpen(false);
                setTimeout(() => {
                  const el = document.getElementById(NAV_IDS[label] ?? label.toLowerCase());
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 320);
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Footer CTA */}
        <div className="px-5 pb-10 pt-4">
          <button
            onClick={() => { setMenuOpen(false); navigate('/authority/login'); }}
            className="flex items-center justify-center gap-2.5 w-full px-6 py-4 rounded-2xl
              bg-white/12 border border-white/20 text-white text-[15px] font-medium
              hover:bg-white/20 active:scale-[0.98] transition-all min-h-[54px]"
          >
            <Shield size={17} />
            Authority Portal
          </button>
        </div>
      </div>

      {/* ── Content Wrapper ─────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="relative min-h-[calc(100svh-60px)] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-9 text-center -mt-[60px] sm:-mt-[88px] pt-[60px] sm:pt-[88px] pb-12">

          <div className="animate-[fadeInUp_0.8s_ease_both]" style={{ animationDelay: '0.1s' }}>
            <h1 className="font-semibold text-[2.1rem] sm:text-[4.15rem] lg:text-[5rem] text-white leading-[1.1] sm:leading-[1.08] tracking-tight max-w-5xl mx-auto drop-shadow-2xl">
              Together We Build<br />
              <span className="text-white/90">Better Cities.</span>
            </h1>
          </div>

          <div className="animate-[fadeInUp_0.8s_ease_both] mt-4 sm:mt-6" style={{ animationDelay: '0.25s' }}>
            <p className="text-white/90 text-base sm:text-xl max-w-[46rem] mx-auto leading-relaxed drop-shadow-lg">
              Empower citizens to report civic issues, enable authorities to resolve them
              faster, and build smarter communities through AI-powered collaboration.
            </p>
          </div>

          {/* CTA cards — stack on mobile, side-by-side on sm+ */}
          <div
            className="animate-[fadeInUp_0.8s_ease_both] mt-8 sm:mt-14 flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-[46rem] mx-auto"
            style={{ animationDelay: '0.4s' }}
          >
            <button
              onClick={() => navigate(ROUTES.CITIZEN)}
              className="group flex-1 flex flex-col items-start gap-3 sm:gap-4 p-5 sm:p-7 rounded-2xl
                         bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/30
                         backdrop-blur-md text-left transition-all duration-250
                         hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] active:scale-[0.99]"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center">
                  <User size={22} className="text-white/90" />
                </div>
                <ArrowRight size={16} className="text-white/35 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h2 className="text-white/90 font-semibold text-lg sm:text-xl leading-tight">Citizen Portal</h2>
                <p className="text-white/55 text-sm sm:text-[15px] mt-1.5 sm:mt-2 leading-relaxed">
                  Report issues, track complaints, earn rewards, complete missions, and improve your community.
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/authority/login')}
              className="group flex-1 flex flex-col items-start gap-3 sm:gap-4 p-5 sm:p-7 rounded-2xl
                         bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/30
                         backdrop-blur-md text-left transition-all duration-250
                         hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] active:scale-[0.99]"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center">
                  <Shield size={22} className="text-white/90" />
                </div>
                <ArrowRight size={16} className="text-white/35 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h2 className="text-white/90 font-semibold text-lg sm:text-xl leading-tight">Authority Portal</h2>
                <p className="text-white/55 text-sm sm:text-[15px] mt-1.5 sm:mt-2 leading-relaxed">
                  Access the government staff dashboard to verify, assign, monitor, and resolve citizen-reported issues.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* ── About ───────────────────────────────────────────────────── */}
        <section id="about" className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-9 bg-black/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] sm:text-xs uppercase tracking-widest mb-5 sm:mb-6 backdrop-blur-md">
              About JanSeva
            </div>
            <h2 className="text-[1.75rem] sm:text-[3.3rem] font-semibold text-white leading-tight mb-5 sm:mb-7 drop-shadow-lg">
              Civic infrastructure meets modern technology
            </h2>
            <p className="text-white/80 text-base sm:text-xl leading-relaxed max-w-[46rem] mx-auto drop-shadow-md">
              JanSeva bridges the gap between citizens and local authorities. Built for
              India's cities, the platform transforms grassroots civic reports into tracked,
              verified, and resolved outcomes — transparently and in real time.
            </p>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section id="features" className="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-9">
          <div className="max-w-[82rem] mx-auto">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] sm:text-xs uppercase tracking-widest mb-5 sm:mb-6 backdrop-blur-md">
                Features
              </div>
              <h2 className="text-[1.75rem] sm:text-[2.75rem] font-semibold text-white drop-shadow-lg">
                Everything you need to fix your city
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: '📸', title: 'AI Photo Analysis', desc: 'Snap a photo — Groq + LLaMA 3 auto-categorizes your report in under 2 seconds.' },
                { icon: '✅', title: 'Community Verification', desc: 'Neighbours confirm issues before they escalate. No false alarms, just facts.' },
                { icon: '📍', title: 'Live Issue Map', desc: 'See every open complaint on a real-time map, filtered by ward and category.' },
                { icon: '🏆', title: 'XP & Badges', desc: 'Earn experience points and unlock badges as you contribute to your community.' },
                { icon: '🎯', title: 'Civic Missions', desc: 'Complete guided missions that multiply your impact and unlock exclusive rewards.' },
                { icon: '📊', title: 'Impact Dashboard', desc: "Track resolution rates, trends, and your neighbourhood's overall civic health." },
              ].map((f) => (
                <div
                  key={f.title}
                  className="p-5 sm:p-7 rounded-2xl bg-white/8 border border-white/12 backdrop-blur-sm
                             hover:bg-white/12 hover:border-white/20 transition-all duration-200"
                >
                  <span className="text-[1.75rem] sm:text-[2.1rem] block mb-3 sm:mb-4">{f.icon}</span>
                  <h3 className="text-white text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{f.title}</h3>
                  <p className="text-white/55 text-sm sm:text-[15px] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI for Authorities ──────────────────────────────────────── */}
        <section id="ai-authorities" className="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-9 bg-black/50 backdrop-blur-sm">
          <div className="max-w-[82rem] mx-auto">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] sm:text-xs uppercase tracking-widest mb-5 sm:mb-6 backdrop-blur-md">
                AI for Authorities
              </div>
              <h2 className="text-[1.75rem] sm:text-[2.75rem] font-semibold text-white mb-4 sm:mb-7 drop-shadow-lg">
                AI for Authorities
              </h2>
              <p className="text-white/80 text-base sm:text-[17px] leading-relaxed max-w-[46rem] mx-auto drop-shadow-md">
                Intelligent decision support that helps city authorities prioritize, assign,
                monitor, and resolve civic issues faster.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  icon: (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>),
                  title: 'AI Civic Brief', desc: 'Daily AI-generated summaries of important civic activity, emerging trends, and urgent issues.',
                },
                {
                  icon: (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>),
                  title: 'Smart Assignment', desc: 'Automatically recommends the most appropriate department or authority for every reported issue.',
                },
                {
                  icon: (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
                  title: 'Priority Detection', desc: 'Identifies critical complaints using severity, location, and impact analysis.',
                },
                {
                  icon: (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
                  title: 'Ward Intelligence', desc: 'Provides localized insights, issue density, and ward-wise performance monitoring.',
                },
                {
                  icon: (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
                  title: 'SLA Monitoring', desc: 'Tracks pending cases and highlights potential service-level breaches before deadlines.',
                },
                {
                  icon: (<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><path d="M2 20h20"/></svg>),
                  title: 'City Analytics', desc: 'Visualizes citywide patterns and operational insights to support better administrative decisions.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="p-5 sm:p-7 rounded-2xl bg-white/8 border border-white/12 backdrop-blur-sm
                             hover:bg-white/12 hover:border-white/20 transition-all duration-200"
                >
                  <span className="text-white/70 block mb-3 sm:mb-4">{f.icon}</span>
                  <h3 className="text-white text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{f.title}</h3>
                  <p className="text-white/55 text-sm sm:text-[15px] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Community ────────────────────────────────────────────────── */}
        <section id="community" className="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-9">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] sm:text-xs uppercase tracking-widest mb-5 sm:mb-6 backdrop-blur-md">
              Community
            </div>
            <h2 className="text-[1.75rem] sm:text-[2.75rem] font-semibold text-white mb-4 sm:mb-7 drop-shadow-lg">
              Your city needs you.
            </h2>
            <p className="text-white/80 text-base sm:text-[17px] leading-relaxed mb-8 sm:mb-11 drop-shadow-md">
              Every report you submit is a step toward a cleaner, safer neighbourhood.
              Join thousands of citizens already making a difference — one issue at a time.
            </p>
            <button
              onClick={() => navigate(ROUTES.CITIZEN)}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-9 py-4 rounded-2xl
                         bg-white text-black font-semibold text-base sm:text-[15px]
                         hover:bg-white/90 transition-all duration-200 active:scale-[0.98]
                         shadow-[0_4px_24px_rgba(255,255,255,0.15)] min-h-[56px]"
            >
              Get started as a citizen
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="relative border-t border-white/10 pt-10 sm:pt-16 pb-0 px-4 sm:px-9 bg-black/60 backdrop-blur-sm">
          <div className="max-w-[88rem] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 pb-10 sm:pb-12">
              <div>
                <BrandLogo colorClassName="text-white" className="text-[1.25rem] sm:text-[1.35rem]" />
                <p className="mt-3 sm:mt-4 text-white/45 text-[13px] sm:text-[14px] leading-relaxed max-w-[15rem]">
                  A citizen-powered platform for reporting, tracking, and resolving civic issues across India.
                </p>
              </div>
              <div>
                <h4 className="text-white/55 text-[11px] font-semibold uppercase tracking-widest mb-3 sm:mb-4">Resources</h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {['About', 'Features', 'AI for Authorities', 'Community'].map((label) => (
                    <li key={label}>
                      <button
                        onClick={() => {
                          const el = document.getElementById(NAV_IDS[label] ?? label.toLowerCase());
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-white/45 hover:text-white/80 text-[13px] sm:text-[14px] transition-colors text-left min-h-[36px] flex items-center"
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white/55 text-[11px] font-semibold uppercase tracking-widest mb-3 sm:mb-4">Legal</h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {['Privacy Policy', 'Terms of Service', 'Contact'].map((label) => (
                    <li key={label}>
                      <a href="#" className="text-white/45 hover:text-white/80 text-[13px] sm:text-[14px] transition-colors min-h-[36px] flex items-center">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <span className="text-white/35 text-xs sm:text-sm">
                © {new Date().getFullYear()} JanSeva. All rights reserved.
              </span>
              <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={() => navigate(ROUTES.CITIZEN)} className="text-white/35 hover:text-white/60 text-xs sm:text-sm transition-colors min-h-[36px]">
                  Citizen Portal
                </button>
                <button onClick={() => navigate('/authority/login')} className="text-white/35 hover:text-white/60 text-xs sm:text-sm transition-colors min-h-[36px]">
                  Authority Portal
                </button>
              </div>
            </div>
          </div>
        </footer>

      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}
