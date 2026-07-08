import { useState } from 'react';
import { MapPin, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4',
  'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8',
];

/** Full-screen modal shown to a Ward Officer right after login.
 *  They pick their ward for the session; the choice is stored in authStore
 *  (persisted to localStorage) but never written to the DB. */
export default function WardSelector() {
  const { setActiveWard } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const confirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/auth/select-ward', { ward: selected });
      setActiveWard(selected);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to select ward. Please try again.';
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0B]/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5EE] mb-1">
            <MapPin size={26} className="text-[#1A6B3C]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0D0D0B]">Select Your Ward</h1>
          <p className="text-sm text-[#6F6F6F]">
            Choose the ward you're overseeing this session. You can change it next time you log in.
          </p>
        </div>

        {/* Ward grid */}
        <div className="grid grid-cols-2 gap-3">
          {WARDS.map((ward) => (
            <button
              key={ward}
              onClick={() => setSelected(ward)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selected === ward
                  ? 'border-[#1A6B3C] bg-[#E8F5EE] text-[#0D3320]'
                  : 'border-[#E5E5E0] text-[#0D0D0B] hover:border-[#1A6B3C]/40 hover:bg-[#F7F7F5]'
              }`}
            >
              <span>{ward}</span>
              {selected === ward && (
                <span className="w-2 h-2 rounded-full bg-[#1A6B3C]" />
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        {/* Confirm */}
        <button
          onClick={confirm}
          disabled={!selected || saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A6B3C] text-white text-sm font-semibold hover:bg-[#155c32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Confirming…</>
          ) : (
            <><ChevronRight size={16} /> Go to Dashboard</>
          )}
        </button>
      </div>
    </div>
  );
}
