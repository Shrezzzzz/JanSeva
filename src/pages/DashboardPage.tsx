import ImpactDashboard from '../components/dashboard/ImpactDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-3xl sm:text-5xl text-[#0D0D0B]">Civic Impact</h1>
          <p className="text-[#6F6F6F] mt-1 sm:mt-2 text-sm sm:text-base">Real-time overview of issues across the city.</p>
        </div>
        <ImpactDashboard />
      </div>
    </div>
  );
}
