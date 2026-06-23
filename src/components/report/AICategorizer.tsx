import { RefreshCw, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import type { AICategorizationResult, Category } from '../../types/issue.types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../types/issue.types';
import { CATEGORY_LABELS } from '../../utils/constants';
import Spinner from '../ui/Spinner';
import ProgressBar from '../ui/ProgressBar';

const ALL_CATEGORIES: Category[] = ['Pothole','Streetlight','WaterLeak','WasteDump','Sewage','RoadDamage','ParkIssue','Other'];

interface AICategorizerProps {
  result: AICategorizationResult | null;
  loading: boolean;
  onOverride: (cat: Category) => void;
  overrideMode: boolean;
  setOverrideMode: (v: boolean) => void;
  /** The currently selected category (manual or AI) */
  selected?: Category | null;
}

export default function AICategorizer({
  result, loading, onOverride, overrideMode, setOverrideMode, selected,
}: AICategorizerProps) {

  // ── AI is analysing ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#E8F5EE] border border-[#1A6B3C]/20">
        <div className="w-8 h-8 rounded-full border-2 border-[#1A6B3C] flex items-center justify-center">
          <Spinner size={14} className="text-[#1A6B3C]" />
        </div>
        <span className="text-sm text-[#1A6B3C] font-medium">JanSeva AI is reading your photo…</span>
      </div>
    );
  }

  // ── AI produced a result and user hasn't opened override ─────────────────
  if (result && !overrideMode) {
    const color = CATEGORY_COLORS[result.category as Category] ?? '#6F6F6F';
    const icon  = CATEGORY_ICONS[result.category as Category] ?? '📍';
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E5E5E0] bg-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-[#6F6F6F]">AI Detected</p>
            <p className="font-medium text-sm text-[#0D0D0B]">{CATEGORY_LABELS[result.category as Category]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <ProgressBar value={result.confidence * 100} color={color} height={5} />
            <p className="text-xs text-[#6F6F6F] mt-1">{Math.round(result.confidence * 100)}% confidence</p>
          </div>
          <button
            onClick={() => setOverrideMode(true)}
            className="text-xs text-[#6F6F6F] hover:text-[#0D0D0B] flex items-center gap-1"
          >
            <Pencil size={12} /> Change
          </button>
        </div>
      </div>
    );
  }

  // ── No AI result OR override mode — always show the full category grid ────
  const activeCat = selected ?? (result?.category as Category | undefined) ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#0D0D0B]">
          {result ? 'Choose a different category:' : 'What type of issue is this?'}
        </p>
        {result && overrideMode && (
          <button
            onClick={() => setOverrideMode(false)}
            className="text-xs text-[#6F6F6F] flex items-center gap-1 hover:text-[#0D0D0B]"
          >
            <RefreshCw size={12} /> Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { onOverride(cat); setOverrideMode(false); }}
            className={clsx(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all',
              cat === activeCat
                ? 'border-[#1A6B3C] bg-[#E8F5EE] text-[#1A6B3C] shadow-sm'
                : 'border-[#E5E5E0] hover:border-[#1A6B3C] hover:bg-[#E8F5EE]/50 text-[#6F6F6F]',
            )}
          >
            <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
            <span className="text-center leading-tight">{CATEGORY_LABELS[cat]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
