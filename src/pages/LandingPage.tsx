import HeroSection from '../components/hero/HeroSection';
import RoadmapTrack from '../components/roadmap/RoadmapTrack';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { ROUTES } from '../config/routes';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div>
      <HeroSection />
      <RoadmapTrack />

      {/* CTA band */}
      <section className="bg-[#0D0D0B] py-24 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-[2.75rem] sm:text-[3.3rem] italic text-white mb-5">Your city needs you.</h2>
          <p className="text-[#9CA3AF] text-[17px] mb-9">Every report you submit is a step toward a cleaner, safer neighbourhood.</p>
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
