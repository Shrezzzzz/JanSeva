import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import VideoBackground from './VideoBackground';
import GradientOverlay from './GradientOverlay';
import { ROUTES } from '../../config/routes';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden bg-white flex flex-col">
      {/* Video + overlays */}
      <VideoBackground />
      <GradientOverlay />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate(ROUTES.HOME)}
        icon={<ArrowLeft size={16} />}
        className="absolute left-4 top-32 z-30 border border-white/45 bg-white/65 text-[#0D0D0B] shadow-sm backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/85 sm:left-8 sm:top-36">
        Back to Portal
      </Button>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-start justify-center flex-1 max-w-[88rem] mx-auto w-full px-6 sm:px-11 pt-36 pb-28">
        {/* Eyebrow tag */}
        <div className="animate-fade-rise mt-16 mb-7">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5EE] text-[#1A6B3C] text-[13px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A6B3C] animate-pulse inline-block" />
            Live civic platform for India
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-rise font-display font-normal text-[#0D0D0B] text-[3.3rem] sm:text-[5rem] md:text-[6.6rem] max-w-[58rem]"
          style={{ lineHeight: 0.95, letterSpacing: 0 }}
        >
          When citizens speak,{' '}
          <span className="italic text-[#6F6F6F]">cities listen.</span>
        </h1>

        {/* Sub-text */}
<p className="animate-fade-rise-delay mt-9 text-[17px] sm:text-xl text-white max-w-[46rem] leading-relaxed">
  JanSeva connects you to your city.
  <br />
  Report broken roads, leaking pipes,
  <br />
  and watch your community fix them together.
</p>

        {/* CTAs */}
        <div className="animate-fade-rise-delay-2 mt-11 flex flex-wrap items-center gap-5">
          <Button size="lg" onClick={() => navigate(ROUTES.REPORT)}>
            Start Reporting
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate(ROUTES.MAP)} icon={<ArrowRight size={18} />}>
            See Live Issues
          </Button>
        </div>

        {/* Stat row */}
        <div className="animate-fade-rise-delay-3 mt-18 flex flex-wrap gap-10">
          {[
            { value: '12,400+', label: 'Issues Reported' },
            { value: '8,200+',  label: 'Resolved'        },
            { value: '3,100+',  label: 'Active Citizens'  },
            { value: '4.2 days',label: 'Avg Resolution'  },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-[1.65rem] text-[#0D0D0B]">{s.value}</p>
              <p className="text-[13px] text-[#6F6F6F] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div className="relative z-20 flex justify-center pb-9 animate-dot-bounce">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[#6F6F6F]">Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#6F6F6F] to-transparent" />
        </div>
      </div>
    </section>
  );
}
