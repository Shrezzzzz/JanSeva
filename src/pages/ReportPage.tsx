import ReportForm from '../components/report/ReportForm';

export default function ReportPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#F7F7F5]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-[#0D0D0B]">Report an Issue</h1>
          <p className="text-[#6F6F6F] mt-2">Help your community by documenting civic infrastructure problems.</p>
        </div>
        {/* Glassmorphic card */}
        <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/40">
          <ReportForm />
        </div>
      </div>
    </div>
  );
}
