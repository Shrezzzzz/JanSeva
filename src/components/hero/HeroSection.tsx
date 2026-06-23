import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

      {/* Content */}
      <div className="relative z-20 flex flex-col items-start justify-center flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 pt-32 pb-24">
        {/* Eyebrow tag */}
        <div className="animate-fade-rise mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5EE] text-[#1A6B3C] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A6B3C] animate-pulse inline-block" />
            Live civic platform for India
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-rise font-display font-normal text-[#0D0D0B] text-5xl sm:text-7xl md:text-8xl max-w-3xl"
          style={{ lineHeight: 0.95, letterSpacing: '-2.46px' }}
        >
          When citizens speak,{' '}
          <span className="italic text-[#6F6F6F]">cities listen.</span>
        </h1>

        {/* Sub-text */}
        <p className="animate-fade-rise-delay mt-8 text-base sm:text-lg text-[#6F6F6F] max-w-2xl leading-relaxed">
          JanSeva connects you to your city. Report broken roads, leaking pipes, and failing lights —
          and watch your community fix them together.
        </p>

        {/* CTAs */}
        <div className="animate-fade-rise-delay-2 mt-10 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={() => navigate(ROUTES.REPORT)}>
            Start Reporting
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate(ROUTES.MAP)} icon={<ArrowRight size={18} />}>
            See Live Issues
          </Button>
        </div>

        {/* Stat row */}
        <div className="animate-fade-rise-delay-3 mt-16 flex flex-wrap gap-8">
          {[
            { value: '12,400+', label: 'Issues Reported' },
            { value: '8,200+',  label: 'Resolved'        },
            { value: '3,100+',  label: 'Active Citizens'  },
            { value: '4.2 days',label: 'Avg Resolution'  },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl text-[#0D0D0B]">{s.value}</p>
              <p className="text-xs text-[#6F6F6F] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div className="relative z-20 flex justify-center pb-8 animate-dot-bounce">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-[#6F6F6F]">Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#6F6F6F] to-transparent" />
        </div>
      </div>
    </section>
  );
}
