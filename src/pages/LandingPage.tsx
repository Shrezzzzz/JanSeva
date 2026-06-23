import HeroSection from '../components/hero/HeroSection';
import RoadmapTrack from '../components/roadmap/RoadmapTrack';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { ROUTES } from '../config/routes';

const FEATURES = [
  { icon: Zap,    title: 'AI-Powered',        desc: 'Groq + LLaMA 3 auto-categorizes your report from a single photo in under 2 seconds.' },
  { icon: Shield, title: 'Community Verified', desc: 'Neighbours confirm issues before they escalate — no more false alarms.' },
  { icon: Users,  title: 'Track Together',     desc: 'Watch every status update in real time, from report to resolution.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div>
      <HeroSection />
      <RoadmapTrack />

      {/* Features section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl sm:text-5xl text-[#0D0D0B]">Why JanSeva works</h2>
          <p className="text-[#6F6F6F] mt-3 max-w-xl mx-auto">Built for India's cities, powered by the community and modern AI.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-4 p-6 rounded-2xl border border-[#E5E5E0] hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center">
                <f.icon size={20} className="text-[#1A6B3C]" />
              </div>
              <h3 className="font-semibold text-[#0D0D0B]">{f.title}</h3>
              <p className="text-sm text-[#6F6F6F] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[#0D0D0B] py-20 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl italic text-white mb-4">Your city needs you.</h2>
          <p className="text-[#9CA3AF] mb-8">Every report you submit is a step toward a cleaner, safer neighbourhood.</p>
          <Button
            size="lg"
            onClick={() => navigate(ROUTES.REPORT)}
            className="bg-[#1A6B3C] text-white hover:bg-[#155930]"
            icon={<ArrowRight size={18} />}
          >
            Report your first issue
          </Button>
        </div>
      </section>
    </div>
  );
}
