import { CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface Stage {
  id: number;
  label: string;
  icon: string;
  color: string;
  href: string;
  description: string;
}

interface StageNodeProps {
  stage: Stage;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}

export default function StageNode({ stage, active, completed, onClick }: StageNodeProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`Stage: ${stage.label}`}
      className={clsx(
        'flex flex-col items-center gap-2 group transition-all duration-300',
        active ? 'scale-110' : 'hover:scale-105',
      )}
    >
      <div
        className={clsx(
          'w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 transition-all duration-300 shadow-md',
          completed ? 'border-[#1A6B3C] bg-[#1A6B3C]' : active ? 'border-current bg-white' : 'border-current bg-white',
          active && 'animate-pulse-glow animate-[pulse-glow_2s_ease-in-out_infinite]',
        )}
        style={{ borderColor: completed ? '#1A6B3C' : stage.color, color: completed ? 'white' : stage.color }}
      >
        {completed ? <CheckCircle size={28} className="text-white" /> : <span>{stage.icon}</span>}
      </div>
      <span className={clsx('text-xs font-medium', active ? 'text-[#0D0D0B]' : 'text-[#6F6F6F]')}>
        {stage.label}
      </span>
    </button>
  );
}
