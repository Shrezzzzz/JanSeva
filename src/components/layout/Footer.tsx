import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E5E0] bg-[#F7F7F5] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div className="sm:col-span-2">
            <span className="font-display text-2xl text-[#0D0D0B]">JanSeva<sup className="text-xs">®</sup></span>
            <p className="mt-2 text-sm text-[#6F6F6F] max-w-xs">
              A citizen-powered platform for reporting, tracking, and resolving hyperlocal civic issues across India.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0B] mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-[#6F6F6F]">
              <li><Link to={ROUTES.REPORT}       className="hover:text-[#0D0D0B] transition-colors">Report Issue</Link></li>
              <li><Link to={ROUTES.MAP}           className="hover:text-[#0D0D0B] transition-colors">Explore Map</Link></li>
              <li><Link to={ROUTES.TRACK}         className="hover:text-[#0D0D0B] transition-colors">Track Issue</Link></li>
              <li><Link to={ROUTES.DASHBOARD}     className="hover:text-[#0D0D0B] transition-colors">Impact Dashboard</Link></li>
              <li><Link to={ROUTES.GAMIFICATION}  className="hover:text-[#0D0D0B] transition-colors">Leaderboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0B] mb-3">About</h4>
            <ul className="space-y-2 text-sm text-[#6F6F6F]">
              <li><a href="#" className="hover:text-[#0D0D0B] transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-[#0D0D0B] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#0D0D0B] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#0D0D0B] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[#E5E5E0] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#6F6F6F]">© {new Date().getFullYear()} JanSeva. Built for civic-minded communities.</p>
          <p className="text-xs text-[#6F6F6F]">Powered by <span className="text-[#1A6B3C]">Groq + LLaMA 3</span></p>
        </div>
      </div>
    </footer>
  );
}
