import { getXPProgress, getLevelTitle } from '../../utils/xpCalculator';
import ProgressBar from '../ui/ProgressBar';

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const { current, next, percent } = getXPProgress(xp);
  const title = getLevelTitle(level);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#0D0D0B]">{title} — Level {level}</span>
        <span className="text-[#6F6F6F]">{current} / {next} XP</span>
      </div>
      <ProgressBar value={percent} color="#1A6B3C" height={8} animated />
      <p className="text-xs text-[#6F6F6F]">{next - current} XP to next level</p>
    </div>
  );
}
