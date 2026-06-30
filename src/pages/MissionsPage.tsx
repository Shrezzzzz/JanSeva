import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { CATEGORY_ICONS } from '../types/issue.types';

interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
  date: string;
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    function calc() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

export default function MissionsPage() {
  const { user } = useAuthStore();
  const { openLogin } = useUIStore();
  const navigate = useNavigate();
  const timeLeft = useCountdown();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  const loadMissions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await api.get('/missions/today');
      setMissions(res.data.data ?? []);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    window.setTimeout(() => {
      void loadMissions();
    }, 0);
  }, [loadMissions]);

  useEffect(() => {
    if (missions.length > 0 && missions.every(m => m.completed)) {
      window.setTimeout(() => setCelebrating(true), 0);
    }
  }, [missions]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4 pb-24">
        <span className="text-6xl mb-4">🎯</span>
        <h2 className="font-display text-2xl text-[#0D0D0B] mb-2">Daily Missions</h2>
        <p className="text-[#6F6F6F] text-center mb-6">Sign in to get your daily civic missions and earn XP.</p>
        <button
          onClick={openLogin}
          className="px-6 py-3 bg-[#1A6B3C] text-white rounded-full font-medium"
        >
          Sign In to Hunt
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <Spinner size={32} className="text-[#1A6B3C]" />
      </div>
    );
  }

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-28 pt-20">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl text-[#0D0D0B]">🎯 Daily Missions</h1>
          <p className="text-[#6F6F6F] text-sm mt-1">Hunt civic issues in your area</p>
          <div className="mt-3 inline-flex flex-col items-center bg-white rounded-2xl px-6 py-3 shadow-sm border border-[#E5E5E0]">
            <p className="text-xs text-[#6F6F6F]">Resets in</p>
            <p className="font-mono text-2xl font-bold text-[#1A6B3C]">{timeLeft}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-[#E5E5E0] shadow-sm">
          <div className="flex justify-between text-xs text-[#6F6F6F] mb-2">
            <span>Today's progress</span>
            <span className="font-semibold text-[#1A6B3C]">{completedCount} / {missions.length} done</span>
          </div>
          <div className="h-2 bg-[#F7F7F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1A6B3C] rounded-full transition-all duration-700"
              style={{ width: missions.length ? `${(completedCount / missions.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* All done celebration */}
        {celebrating && (
          <div className="bg-[#1A6B3C] text-white rounded-2xl p-6 mb-4 text-center animate-fade-rise">
            <p className="text-4xl mb-2">🏆</p>
            <p className="font-display text-xl">All missions complete!</p>
            <p className="text-sm opacity-80 mt-1">Your missions are complete. Come back tomorrow!</p>
          </div>
        )}

        {/* Mission cards */}
        {missions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌅</p>
            <p className="text-[#6F6F6F]">No missions yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 transition-all ${
                  mission.completed
                    ? 'border-[#1A6B3C] opacity-80'
                    : 'border-[#D97706]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl leading-none mt-0.5">
                      {CATEGORY_ICONS[mission.category as keyof typeof CATEGORY_ICONS] ?? '📍'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0D0D0B]">{mission.title}</p>
                      <p className="text-xs text-[#6F6F6F] mt-0.5">{mission.description}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold text-[#1A6B3C] bg-[#E8F5EE] px-2 py-1 rounded-full">
                    +{mission.xpReward} XP
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#F7F7F5] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mission.completed ? 'bg-[#1A6B3C] w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-[#6F6F6F] flex-shrink-0">
                    {mission.completed ? '✅ Done' : '🔴 Pending'}
                  </span>
                </div>

                {!mission.completed && (
                  <button
                    onClick={() => navigate('/report')}
                    className="mt-3 w-full py-2.5 rounded-xl bg-[#1A6B3C] text-white text-sm font-medium active:scale-95 transition-transform"
                  >
                    🎯 Go Hunt
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Hunt on map button */}
        <button
          onClick={() => navigate('/map')}
          className="mt-6 w-full py-4 rounded-2xl border-2 border-[#1A6B3C] text-[#1A6B3C] font-medium text-sm flex items-center justify-center gap-2"
        >
          🗺️ View Mission Zones on Map
        </button>
      </div>
    </div>
  );
}
